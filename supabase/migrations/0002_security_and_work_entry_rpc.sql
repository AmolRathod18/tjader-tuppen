create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admin_profiles enable row level security;
alter table public.companies enable row level security;
alter table public.projects enable row level security;
alter table public.employees enable row level security;
alter table public.employee_work_history enable row level security;
alter table public.assignments enable row level security;
alter table public.work_entries enable row level security;
alter table public.expenditures enable row level security;

drop policy if exists admin_profiles_select_self on public.admin_profiles;
create policy admin_profiles_select_self on public.admin_profiles for select to authenticated using (id = auth.uid() and public.is_admin());
drop policy if exists admin_profiles_update_self on public.admin_profiles;
create policy admin_profiles_update_self on public.admin_profiles for update to authenticated using (id = auth.uid() and public.is_admin()) with check (id = auth.uid() and role = 'admin');

do $policies$
declare
  table_name text;
begin
  foreach table_name in array array['companies', 'projects', 'employees', 'employee_work_history', 'assignments', 'work_entries', 'expenditures'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_admin', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_admin())', table_name || '_select_admin', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_admin', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', table_name || '_insert_admin', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_admin', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', table_name || '_update_admin', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_admin', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', table_name || '_delete_admin', table_name);
  end loop;
end;
$policies$;

create or replace function public.create_work_entry(entry_payload jsonb)
returns public.work_entries
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted public.work_entries;
begin
  if not public.is_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  insert into public.work_entries (employee_id, project_id, date, start_time, end_time, description, remarks)
  values (
    (entry_payload->>'employee_id')::uuid,
    (entry_payload->>'project_id')::uuid,
    (entry_payload->>'date')::date,
    (entry_payload->>'start_time')::time,
    (entry_payload->>'end_time')::time,
    coalesce(entry_payload->>'description', ''),
    entry_payload->>'remarks'
  ) returning * into inserted;
  return inserted;
end;
$$;

create or replace function public.update_work_entry(entry_id uuid, entry_payload jsonb)
returns public.work_entries
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated public.work_entries;
begin
  if not public.is_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  update public.work_entries
  set employee_id = coalesce((entry_payload->>'employee_id')::uuid, employee_id),
      project_id = coalesce((entry_payload->>'project_id')::uuid, project_id),
      date = coalesce((entry_payload->>'date')::date, date),
      start_time = coalesce((entry_payload->>'start_time')::time, start_time),
      end_time = coalesce((entry_payload->>'end_time')::time, end_time),
      description = coalesce(entry_payload->>'description', description),
      remarks = case when entry_payload ? 'remarks' then entry_payload->>'remarks' else remarks end
  where id = entry_id
  returning * into updated;
  if updated.id is null then raise exception 'Work entry does not exist'; end if;
  return updated;
end;
$$;

revoke all on function public.create_work_entry(jsonb) from public;
revoke all on function public.update_work_entry(uuid, jsonb) from public;
grant execute on function public.create_work_entry(jsonb) to authenticated;
grant execute on function public.update_work_entry(uuid, jsonb) to authenticated;

create or replace function public.touch_admin_profile()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_profiles_updated_at on public.admin_profiles;
create trigger admin_profiles_updated_at before update on public.admin_profiles for each row execute function public.touch_admin_profile();
