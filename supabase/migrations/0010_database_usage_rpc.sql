create or replace function public.get_database_used_bytes()
returns bigint
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  return pg_catalog.pg_database_size(pg_catalog.current_database());
end;
$$;

revoke all on function public.get_database_used_bytes() from public, anon;
grant execute on function public.get_database_used_bytes() to authenticated;