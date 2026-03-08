import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from 'react-oidc-context'
import { WebStorageStateStore } from 'oidc-client-ts'

const oidcConfig = {
  authority: import.meta.env.VITE_AUTHENTIK_ISSUER as string,
  client_id: import.meta.env.VITE_AUTHENTIK_CLIENT_ID as string,
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "openid profile email",
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  monitorSession: false,
  automaticSilentRenew: false,
  onSigninCallback: () => {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
};

createRoot(document.getElementById('root')!).render(
  <AuthProvider {...oidcConfig}>
    <App />
  </AuthProvider>
)
