-- Run this migration once on an existing Supabase database.
create sequence if not exists project_number_seq;

do $$
declare
  current_max bigint;
begin
  select max(nullif(regexp_replace(number, '[^0-9]', '', 'g'), '')::bigint)
    into current_max
  from public.projects;

  if current_max is null then
    perform setval('public.project_number_seq', 1, false);
  else
    perform setval('public.project_number_seq', current_max + 1, false);
  end if;
end $$;

alter table public.projects
  alter column number set default (
    'P-' || lpad(nextval('public.project_number_seq')::text, 4, '0')
  );
