grant select (is_approved) on public.feedback to anon;

do $publication$
begin
  if exists (
    select 1
    from pg_catalog.pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'feedback'
  ) then
    alter publication supabase_realtime add table public.feedback;
  end if;
end;
$publication$;
