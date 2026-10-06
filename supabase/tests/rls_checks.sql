-- Run the catalog assertions as the project owner after applying both migrations.
select tablename, rowsecurity
from pg_catalog.pg_tables
where schemaname = 'public'
  and tablename in ('admin_profiles', 'companies', 'projects', 'employees',
    'employee_work_history', 'assignments', 'work_entries', 'expenditures', 'feedback')
order by tablename;

select schemaname, tablename, policyname, roles, cmd
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in ('admin_profiles', 'companies', 'projects', 'employees',
    'employee_work_history', 'assignments', 'work_entries', 'expenditures', 'feedback')
order by tablename, policyname;

-- Run each block in a separate authenticated session. SQL editor owner sessions
-- bypass RLS, so these blocks must be executed through the anon/authenticated API
-- session or a psql connection using the corresponding role and JWT settings.
--
-- Anonymous session: feedback inserts and approved feedback reads may succeed.
-- This insert should succeed, and only approved rows should be visible.
-- insert into public.feedback (name, rating, message) values ('Visitor', 5, 'Public feedback test');
-- select id, name, rating, message, is_approved, created_at from public.feedback;
--
-- Anonymous session: every statement below must fail or return no pending rows.
-- select * from public.companies;
-- select public.get_storage_used_bytes();
-- select public.get_database_used_bytes();
-- insert into public.companies (name, contact) values ('RLS test', 'RLS test');
-- update public.companies set name = 'blocked' where false;
-- delete from public.companies where false;
-- select * from public.feedback where not is_approved;
-- update public.feedback set is_approved = true where false;
--
-- Authenticated non-admin session: business operations fail and feedback rows
-- are not visible; update operations must fail.
-- Calling public.get_storage_used_bytes() must fail.
-- Calling public.get_database_used_bytes() must fail.
-- select * from public.feedback;
-- update public.feedback set is_approved = true where false;
-- Authenticated admin session: the same operations must succeed, while this must fail:
-- update public.admin_profiles set role = 'user' where id = auth.uid();
