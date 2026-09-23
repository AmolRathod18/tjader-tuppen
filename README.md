# TJÄDERTUPPEN Management System

## Backend setup

The FastAPI backend is in [`backend/`](./backend). It uses the Supabase service key
only on the server; never put that key in a `VITE_*` variable or browser code.

1. Copy `backend/.env.example` to `backend/.env` and fill in the Supabase URL,
   service-role key, JWT secret, and administrator password.
2. Run [`backend/schema.sql`](./backend/schema.sql) in the Supabase SQL editor.
   For an existing database, run [`backend/create_admin.sql`](./backend/create_admin.sql)
   instead (or run both if the base schema has not been applied yet).
   If the existing database was created before expenditure tracking was added,
   also run [`backend/create_expenditures.sql`](./backend/create_expenditures.sql).
   For the working-hour categories, run [`backend/working_hours.sql`](./backend/working_hours.sql)
   against an existing database.
3. Install and start the API:

```powershell
cd backend
python -m venv .venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API documentation is available at `http://127.0.0.1:8000/docs`. Set
`VITE_API_URL` in the frontend environment when the API is not on port 8000.
Set `CORS_ORIGINS` in `backend/.env` to a comma-separated list of deployed
frontend origins. Localhost and `127.0.0.1` origins on any development port are
allowed automatically.

On the first login, the configured `ADMIN_USERNAME`, `ADMIN_EMAIL`, and
`ADMIN_PASSWORD` are securely hashed into the `admins` table. After signing in,
use **Settings** in the administrator sidebar to change the username, email, or
password. The current password is required for every credentials update.
Passwords must be between 8 and 72 UTF-8 bytes because bcrypt cannot process
longer passwords.

Expenditure kilometers are entered as whole numbers (for example, `42`).

## Frontend

The frontend calls the FastAPI service through `VITE_API_URL`. Environment variables
are embedded at build time, so set this variable in Vercel for Production, Preview,
and Development as needed:

```text
VITE_API_URL=https://tjader-tuppen-management.onrender.com
```

In Render, set the backend `CORS_ORIGINS` variable to the exact Vercel deployment
origin:

```text
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://tjader-tuppen-management.vercel.app
```

Include any custom domain as another comma-separated origin. Do not include a trailing slash, and never put
Supabase keys, JWT secrets, or administrator credentials in a `VITE_*` variable.

After deploying, verify the backend at
`https://tjader-tuppen-management.onrender.com/health` and then open the Vercel URL
to test login. The Vercel rewrite in `vercel.json` keeps React Router routes working
when a page is refreshed.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
