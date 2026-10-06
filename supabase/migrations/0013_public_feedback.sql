create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  rating smallint check (rating between 1 and 5),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  is_read boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_unread_idx on public.feedback (id) where not is_read;

alter table public.feedback enable row level security;

revoke all on table public.feedback from public, anon, authenticated;
grant select (id, name, rating, message, created_at) on public.feedback to anon;
grant select (id, name, rating, message, is_read, is_approved, created_at) on public.feedback to authenticated;
grant insert (name, rating, message) on public.feedback to anon, authenticated;
grant update (is_read, is_approved) on public.feedback to authenticated;

drop policy if exists feedback_select_approved on public.feedback;
create policy feedback_select_approved
  on public.feedback for select to anon
  using (is_approved);

drop policy if exists feedback_select_admin on public.feedback;
create policy feedback_select_admin
  on public.feedback for select to authenticated
  using (public.is_admin());

drop policy if exists feedback_insert_public on public.feedback;
create policy feedback_insert_public
  on public.feedback for insert to anon, authenticated
  with check (not is_read and not is_approved);

drop policy if exists feedback_update_admin on public.feedback;
create policy feedback_update_admin
  on public.feedback for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

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
