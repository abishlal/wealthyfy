@echo off
cd backend
uv sync
uv run uvicorn main:app --reload
