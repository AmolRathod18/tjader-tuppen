alter table public.expenditures
  alter column start_place drop not null,
  alter column end_place drop not null,
  alter column kilometers drop not null;

alter table public.expenditures
  drop constraint if exists expenditures_kilometers_check;

notify pgrst, 'reload schema';
