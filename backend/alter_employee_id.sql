-- Run this migration once on an existing Supabase database.
create sequence if not exists employee_id_seq;

do $$
declare
  current_max bigint;
begin
  select max(nullif(regexp_replace(emp_id, '[^0-9]', '', 'g'), '')::bigint)
    into current_max
  from public.employees;

  if current_max is null then
    perform setval('public.employee_id_seq', 1, false);
  else
    perform setval('public.employee_id_seq', current_max + 1, false);
  end if;
end $$;

alter table public.employees
  alter column emp_id set default (
    'EMP-' || lpad(nextval('public.employee_id_seq')::text, 3, '0')
  );
