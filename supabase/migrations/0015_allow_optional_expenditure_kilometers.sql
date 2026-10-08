alter table public.expenditures
  alter column kilometers drop not null;

alter table public.expenditures
  drop constraint if exists expenditures_kilometers_check;

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
      nullif(expenditure_payload->>'kilometers', '')::integer,
      nullif(expenditure_payload->>'hours', '')::numeric,
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
      nullif(expenditure_payload->>'kilometers', '')::integer,
      nullif(expenditure_payload->>'hours', '')::numeric,
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
