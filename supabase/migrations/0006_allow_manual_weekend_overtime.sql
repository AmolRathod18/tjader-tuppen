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
  new.normal_hours = least(duration, 8);
  new.normal_overtime = entered_overtime;
  new.weekend_overtime = entered_weekend_overtime;
  new.hours = new.normal_hours + new.normal_overtime + new.weekend_overtime;
  return new;
end;
$$;

drop trigger if exists work_entries_calculated on public.work_entries;
create trigger work_entries_calculated
before insert or update on public.work_entries
for each row execute function public.calculate_work_entry();
