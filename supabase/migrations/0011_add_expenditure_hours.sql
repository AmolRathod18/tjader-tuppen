alter table public.expenditures
  add column if not exists hours numeric check (hours > 0);

notify pgrst, 'reload schema';
