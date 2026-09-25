# TJÄDERTUPPEN Management System

## Supabase setup

The browser uses Supabase Auth, PostgreSQL, and RLS directly. The former FastAPI
backend and Render deployment files have been removed; the frontend does not use
a custom backend.

1. Create a Supabase project and open the SQL editor.
2. Apply [`supabase/migrations/0001_initial_schema.sql`](./supabase/migrations/0001_initial_schema.sql), then
   [`supabase/migrations/0002_security_and_work_entry_rpc.sql`](./supabase/migrations/0002_security_and_work_entry_rpc.sql).
3. In Authentication, create the first user with an email and password. Do not
   use the old `admins.password_hash` table for authentication.
4. Insert the matching profile as the first administrator:

```sql
insert into public.admin_profiles (id, username, email, role)
select id, 'admin', email, 'admin'
from auth.users
where email = 'admin@example.com';
```

Replace the username and email with the values used in Supabase Auth. The first
login field accepts an email address. Username login is intentionally not exposed
because resolving usernames for anonymous login would create an account-enumeration
endpoint.

## Environment and local development

Copy [`.env.example`](./.env.example) to `.env.local` and set:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Only the anon/publishable key belongs in Vite variables. Never put a service-role
key, secret key, JWT secret, password, or password hash in frontend code or any
`VITE_*` variable.

```powershell
npm install
npm run dev
```

For Vercel, set the same two variables for Production, Preview, and Development.
The rewrite in [`vercel.json`](./vercel.json) keeps React Router routes working on
refresh.

## Security and business rules

Every browser-accessed table has RLS enabled. Policies require an authenticated
user whose `admin_profiles.role` is `admin`; anonymous CRUD is denied. The
`is_admin()` function is `SECURITY DEFINER` with a fixed search path and does not
trust client-provided role values.

PostgreSQL generates project numbers (`P-0001`) and employee IDs (`EMP-001`),
checks project dates, derives a work entry's company and hours, handles overnight
and weekend entries, prevents overlapping employee entries, and enforces positive
whole-number kilometers. Work-entry writes use `create_work_entry` and
`update_work_entry` RPCs so calculated fields cannot be supplied by the browser.
Foreign-key deletes use `restrict` for business records; employee history still
cascades with its employee.

Reports and PDF export remain client-side. Automatic description translation was
removed: Swedish reports preserve the original descriptions. Interface translation
continues to use the frontend translation files. No translation provider key is
sent to the browser.

## RLS verification checklist

Use the Supabase SQL editor or a SQL test runner with separate sessions to verify:

- `anon` cannot select, insert, update, or delete business rows.
- An authenticated non-admin cannot access business rows.
- An authenticated admin can perform intended CRUD operations.
- An admin cannot change `admin_profiles.role` away from `admin`.
- Invalid dates, kilometers, company/project relationships, overlaps, and derived
  hour values are rejected or calculated by PostgreSQL.

The migration cannot be called fully verified until these checks are run against
the target Supabase project with an anon session and real Auth users. Complete a
full CRUD, report, PDF, reload-session, logout, and password-update pass after
deploying the migrations.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
