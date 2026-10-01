alter table public.expenditures
  add column if not exists hours numeric check (hours > 0);

alter table public.expenditures
  add column if not exists work_entry_id uuid references public.work_entries(id) on delete cascade;

with unique_work_entries as (
  select employee_id, project_id, date
  from public.work_entries
  group by employee_id, project_id, date
  having count(*) = 1
), unique_expenditures as (
  select employee_id, project_id, journey_date
  from public.expenditures
  where work_entry_id is null
  group by employee_id, project_id, journey_date
  having count(*) = 1
)
update public.expenditures expenditure
set work_entry_id = work_entry.id
from public.work_entries work_entry
join unique_work_entries unique_work
  on unique_work.employee_id = work_entry.employee_id
  and unique_work.project_id = work_entry.project_id
  and unique_work.date = work_entry.date
join unique_expenditures unique_expenditure
  on unique_expenditure.employee_id = work_entry.employee_id
  and unique_expenditure.project_id = work_entry.project_id
  and unique_expenditure.journey_date = work_entry.date
where expenditure.employee_id = work_entry.employee_id
  and expenditure.project_id = work_entry.project_id
  and expenditure.journey_date = work_entry.date
  and expenditure.work_entry_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expenditures_work_entry_id_key'
      and conrelid = 'public.expenditures'::regclass
  ) then
    alter table public.expenditures
      add constraint expenditures_work_entry_id_key unique (work_entry_id);
  end if;
end;
$$;

create or replace function public.create_work_entry_with_expenditure(
  entry_payload jsonb,
  expenditure_payload jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_entry public.work_entries;
  inserted_expenditure public.expenditures;
  expenditure_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  inserted_entry := public.create_work_entry(entry_payload);

  if expenditure_payload is not null then
    insert into public.expenditures (
      work_entry_id, employee_id, project_id, journey_date,
      start_place, end_place, kilometers, hours, remarks
    )
    values (
      inserted_entry.id,
      inserted_entry.employee_id,
      inserted_entry.project_id,
      inserted_entry.date,
      nullif(btrim(expenditure_payload->>'start_place'), ''),
      nullif(btrim(expenditure_payload->>'end_place'), ''),
      (expenditure_payload->>'kilometers')::integer,
      (expenditure_payload->>'hours')::numeric,
      nullif(btrim(expenditure_payload->>'remarks'), '')
    )
    returning * into inserted_expenditure;
    expenditure_result := to_jsonb(inserted_expenditure);
  end if;

  return jsonb_build_object(
    'work_entry', to_jsonb(inserted_entry),
    'expenditure', expenditure_result
  );
end;
$$;

create or replace function public.update_work_entry_with_expenditure(
  entry_id uuid,
  entry_payload jsonb,
  expenditure_payload jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_entry public.work_entries;
  updated_expenditure public.expenditures;
  expenditure_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  updated_entry := public.update_work_entry(entry_id, entry_payload);

  if expenditure_payload is null then
    delete from public.expenditures
    where work_entry_id = updated_entry.id;
  else
    insert into public.expenditures (
      work_entry_id, employee_id, project_id, journey_date,
      start_place, end_place, kilometers, hours, remarks
    )
    values (
      updated_entry.id,
      updated_entry.employee_id,
      updated_entry.project_id,
      updated_entry.date,
      nullif(btrim(expenditure_payload->>'start_place'), ''),
      nullif(btrim(expenditure_payload->>'end_place'), ''),
      (expenditure_payload->>'kilometers')::integer,
      (expenditure_payload->>'hours')::numeric,
      nullif(btrim(expenditure_payload->>'remarks'), '')
    )
    on conflict (work_entry_id) do update
    set employee_id = excluded.employee_id,
        project_id = excluded.project_id,
        journey_date = excluded.journey_date,
        start_place = excluded.start_place,
        end_place = excluded.end_place,
        kilometers = excluded.kilometers,
        hours = excluded.hours,
        remarks = excluded.remarks
    returning * into updated_expenditure;
    expenditure_result := to_jsonb(updated_expenditure);
  end if;

  return jsonb_build_object(
    'work_entry', to_jsonb(updated_entry),
    'expenditure', expenditure_result
  );
end;
$$;

revoke all on function public.create_work_entry_with_expenditure(jsonb, jsonb) from public;
revoke all on function public.update_work_entry_with_expenditure(uuid, jsonb, jsonb) from public;
grant execute on function public.create_work_entry_with_expenditure(jsonb, jsonb) to authenticated;
grant execute on function public.update_work_entry_with_expenditure(uuid, jsonb, jsonb) to authenticated;

notify pgrst, 'reload schema';
