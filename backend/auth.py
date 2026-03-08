import os
import json
import httpx
import jwt as pyjwt
from jwt import PyJWTError
from jwt.algorithms import RSAAlgorithm
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2AuthorizationCodeBearer
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

AUTHENTIK_ISSUER = os.getenv(
    "AUTHENTIK_ISSUER", "http://localhost:9000/application/o/finance-tracker/"
)
AUTHENTIK_CLIENT_ID = os.getenv("AUTHENTIK_CLIENT_ID", "dummy-client-id")

JWKS_URL = f"{AUTHENTIK_ISSUER.rstrip('/')}/jwks/"

# Cache for JWKS keys: dict of kid -> public key
_jwks_cache: dict = {}


def _fetch_jwks() -> dict:
    """Fetch JWKS using httpx with a browser-like User-Agent to avoid 403."""
    global _jwks_cache
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                JWKS_URL,
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; FinanceTracker/1.0)",
                    "Accept": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            # Build a kid -> RSA public key mapping
            new_cache = {}
            for key_data in data.get("keys", []):
                kid = key_data.get("kid")
                if kid:
                    public_key = RSAAlgorithm.from_jwk(json.dumps(key_data))
                    new_cache[kid] = public_key
            _jwks_cache = new_cache
            print(f"DEBUG: Fetched {len(_jwks_cache)} keys from JWKS endpoint")
            return _jwks_cache
    except Exception as e:
        print(f"DEBUG: Failed to fetch JWKS: {type(e).__name__}: {e}")
        raise


def _get_signing_key(token: str):
    """Get the signing key for a given JWT token, fetching JWKS if needed."""
    global _jwks_cache

    # Decode header without verification to get the kid
    try:
        header = pyjwt.get_unverified_header(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token header: {e}")

    kid = header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Token header missing 'kid'")

    # Try cache first, refresh if key not found
    if kid not in _jwks_cache:
        _fetch_jwks()

    if kid not in _jwks_cache:
        raise HTTPException(status_code=401, detail=f"Key ID '{kid}' not found in JWKS")

    return _jwks_cache[kid]


oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{AUTHENTIK_ISSUER}/authorize/",
    tokenUrl=f"{AUTHENTIK_ISSUER}/token/",
)


class User(BaseModel):
    id: str  # The 'sub' claim from Authentik
    username: Optional[str] = None
    email: Optional[str] = None


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    print(f"DEBUG: get_current_user called, token length: {len(token) if token else 0}")
    print(
        f"DEBUG: Validating against Issuer: '{AUTHENTIK_ISSUER}' and Audience: '{AUTHENTIK_CLIENT_ID}'"
    )

    try:
        signing_key = _get_signing_key(token)

        payload = pyjwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=AUTHENTIK_CLIENT_ID,
            issuer=AUTHENTIK_ISSUER,
            options={"verify_exp": True},
        )

        print(f"DEBUG: JWT validated successfully. Sub: {payload.get('sub')}")

        user_id: str = payload.get("sub")
        if user_id is None:
            print("DEBUG: Missing sub claim in token")
            raise HTTPException(status_code=401, detail="Missing sub claim in token")

        return User(
            id=user_id,
            username=payload.get("preferred_username"),
            email=payload.get("email"),
        )

    except HTTPException:
        raise
    except pyjwt.ExpiredSignatureError:
        print("DEBUG: Token has expired")
        raise HTTPException(
            status_code=401, detail="Token has expired. Please re-login."
        )
    except pyjwt.InvalidAudienceError as e:
        print(f"DEBUG: Invalid audience: {e}")
        try:
            unverified = pyjwt.decode(token, options={"verify_signature": False})
            msg = f"Audience mismatch. Expected='{AUTHENTIK_CLIENT_ID}', Got='{unverified.get('aud')}'"
            print(f"DEBUG: {msg}")
            raise HTTPException(status_code=401, detail=msg)
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=401, detail=f"Invalid audience: {e}")
    except pyjwt.InvalidIssuerError as e:
        print(f"DEBUG: Invalid issuer: {e}")
        try:
            unverified = pyjwt.decode(token, options={"verify_signature": False})
            msg = f"Issuer mismatch. Expected='{AUTHENTIK_ISSUER}', Got='{unverified.get('iss')}'"
            print(f"DEBUG: {msg}")
            raise HTTPException(status_code=401, detail=msg)
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=401, detail=f"Invalid issuer: {e}")
    except PyJWTError as e:
        print(f"DEBUG: PyJWTError: {type(e).__name__}: {e}")
        raise HTTPException(status_code=401, detail=f"JWT validation failed: {str(e)}")
    except Exception as e:
        import traceback

        tb = traceback.format_exc()
        msg = f"Unexpected auth error: {repr(e)}\n{tb}"
        print(msg)
        with open("auth_debug.log", "a") as f:
            f.write(f"\n--- {type(e).__name__} ---\n{msg}\n")
        raise HTTPException(status_code=401, detail=f"Authentication error: {repr(e)}")
