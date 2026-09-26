-- Update calculate_work_entry
create or replace function public.calculate_work_entry()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  duration numeric(6,2);
  project_company uuid;
  entered_overtime numeric(6,2);
  entered_weekend_overtime numeric(6,2);
begin
  select company_id into project_company from public.projects where id = new.project_id;
  if project_company is null then raise exception 'Project does not exist'; end if;
  if not exists (select 1 from public.employees where id = new.employee_id) then raise exception 'Employee does not exist'; end if;
  new.company_id = project_company;
  if new.start_time = new.end_time then raise exception 'Start and end time must differ'; end if;
  duration := extract(epoch from ((new.date + new.end_time) - (new.date + new.start_time))) / 3600;
  if duration <= 0 then duration := duration + 24; end if;
  if duration > 24 then raise exception 'Work entry cannot exceed 24 hours'; end if;
  entered_overtime := greatest(coalesce(new.normal_overtime, 0), 0);
  entered_weekend_overtime := greatest(coalesce(new.weekend_overtime, 0), 0);
  if entered_overtime > 24 or entered_weekend_overtime > 24 then raise exception 'Overtime cannot exceed 24 hours'; end if;
  
  -- Allow manual override for normal_hours if it's set
  if new.normal_hours is null then
      new.normal_hours = least(duration, 8);
  end if;

  new.normal_overtime = entered_overtime;
  new.weekend_overtime = entered_weekend_overtime;
  new.hours = new.normal_hours + new.normal_overtime + new.weekend_overtime;
  return new;
end;
$$;

-- Update create_work_entry
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
  insert into public.work_entries (employee_id, project_id, date, start_time, end_time, normal_hours, normal_overtime, weekend_overtime, description, remarks)
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
    entry_payload->>'remarks'
  ) returning * into inserted;
  return inserted;
end;
$$;

-- Update update_work_entry
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
      remarks = case when entry_payload ? 'remarks' then entry_payload->>'remarks' else remarks end
  where id = entry_id
  returning * into updated;
  if updated.id is null then raise exception 'Work entry does not exist'; end if;
  return updated;
end;
$$;

