# TJÄDERTUPPEN Management System

## Backend setup

The FastAPI backend is in [`backend/`](./backend). It uses the Supabase service key
only on the server; never put that key in a `VITE_*` variable or browser code.

1. Copy `backend/.env.example` to `backend/.env` and fill in the Supabase URL,
   service-role key, JWT secret, and administrator password.
2. Run [`backend/schema.sql`](./backend/schema.sql) in the Supabase SQL editor.
3. Install and start the API:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API documentation is available at `http://localhost:8000/docs`. Set
`VITE_API_URL` in the frontend environment when the API is not on port 8000.

## Frontend

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
