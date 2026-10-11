alter table public.work_entries
  add column if not exists daily_description text not null default '';

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
  insert into public.work_entries (employee_id, project_id, date, start_time, end_time, normal_hours, normal_overtime, weekend_overtime, description, daily_description, remarks)
  values (
    (entry_payload->>'employee_id')::uuid,
    (entry_payload->>'project_id')::uuid,
    (entry_payload->>'date')::date,
    (entry_payload->>'start_time')::time,
    (entry_payload->>'end_time')::time,
    (entry_payload->>'normal_hours')::numeric,
    coalesce((entry_payload->>'normal_overtime')::numeric, 0),
    coalesce((entry_payload->>'weekend_overtime')::numeric, 0),
    coalesce(entry_payload->>'description', ''),
    coalesce(entry_payload->>'daily_description', ''),
    entry_payload->>'remarks'
  ) returning * into inserted;
  return inserted;
end;
$$;

notify pgrst, 'reload schema';

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
      normal_hours = coalesce((entry_payload->>'normal_hours')::numeric, normal_hours),
      normal_overtime = coalesce((entry_payload->>'normal_overtime')::numeric, normal_overtime),
      weekend_overtime = coalesce((entry_payload->>'weekend_overtime')::numeric, weekend_overtime),
      description = coalesce(entry_payload->>'description', description),
      daily_description = case
        when entry_payload ? 'daily_description' then coalesce(entry_payload->>'daily_description', '')
        else daily_description
      end,
      remarks = case when entry_payload ? 'remarks' then entry_payload->>'remarks' else remarks end
  where id = entry_id
  returning * into updated;
  if updated.id is null then raise exception 'Work entry does not exist'; end if;
  return updated;
end;
$$;
