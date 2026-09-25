-- Run the catalog assertions as the project owner after applying both migrations.
select tablename, rowsecurity
from pg_catalog.pg_tables
where schemaname = 'public'
  and tablename in ('admin_profiles', 'companies', 'projects', 'employees',
    'employee_work_history', 'assignments', 'work_entries', 'expenditures')
order by tablename;

select schemaname, tablename, policyname, roles, cmd
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in ('admin_profiles', 'companies', 'projects', 'employees',
    'employee_work_history', 'assignments', 'work_entries', 'expenditures')
order by tablename, policyname;

-- Run each block in a separate authenticated session. SQL editor owner sessions
-- bypass RLS, so these blocks must be executed through the anon/authenticated API
-- session or a psql connection using the corresponding role and JWT settings.
--
-- Anonymous session: every statement below must fail with a permission/RLS error.
-- select * from public.companies;
-- insert into public.companies (name, contact) values ('RLS test', 'RLS test');
-- update public.companies set name = 'blocked' where false;
-- delete from public.companies where false;
--
-- Authenticated non-admin session: select/insert/update/delete must fail.
-- Authenticated admin session: the same operations must succeed, while this must fail:
-- update public.admin_profiles set role = 'user' where id = auth.uid();
