create or replace function public.email_exists_in_auth(email_input text)
returns boolean
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(email_input))
  );
$$;

revoke all on function public.email_exists_in_auth(text) from public;
grant execute on function public.email_exists_in_auth(text) to anon, authenticated;
