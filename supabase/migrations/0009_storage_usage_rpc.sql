create or replace function public.get_storage_used_bytes()
returns bigint
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  used_bytes bigint;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select coalesce(sum(
    case
      when coalesce(metadata ->> 'size', '') ~ '^[0-9]+$' then (metadata ->> 'size')::bigint
      else 0
    end
  ), 0)::bigint
  into used_bytes
  from storage.objects;

  return used_bytes;
end;
$$;

revoke all on function public.get_storage_used_bytes() from public, anon;
grant execute on function public.get_storage_used_bytes() to authenticated;