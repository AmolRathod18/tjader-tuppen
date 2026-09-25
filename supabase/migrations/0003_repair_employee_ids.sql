do $$
declare
  highest_id bigint;
begin
  select max((substring(emp_id from '^EMP-([0-9]+)$'))::bigint)
  into highest_id
  from public.employees;

  if highest_id is null or highest_id = 0 then
    perform setval('public.employee_id_seq', 1, false);
  else
    perform setval('public.employee_id_seq', highest_id, true);
  end if;
end;
$$;

create or replace function public.generate_employee_id()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.emp_id is null or btrim(new.emp_id) = '' then
    new.emp_id := 'EMP-' || lpad(nextval('public.employee_id_seq')::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists employees_generate_id on public.employees;
create trigger employees_generate_id
before insert or update on public.employees
for each row execute function public.generate_employee_id();

update public.employees
set emp_id = null
where emp_id is null or btrim(emp_id) = '';
