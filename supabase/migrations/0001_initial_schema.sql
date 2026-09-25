create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create sequence if not exists public.project_number_seq;
create sequence if not exists public.employee_id_seq;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  number text not null default ('P-' || lpad(nextval('public.project_number_seq')::text, 4, '0')),
  name text not null,
  location text,
  start_date date not null,
  end_date date not null,
  status text not null default 'Active' check (status in ('Active', 'Completed', 'On Hold')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(number),
  check (end_date >= start_date)
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emp_id text not null unique default ('EMP-' || lpad(nextval('public.employee_id_seq')::text, 3, '0')),
  role text,
  phone text,
  email text,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  photo text,
  experience text,
  skills text,
  work_type text,
  certifications text,
  joining_date date,
  notes text,
  address text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_work_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  company_name text not null,
  role text,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  assigned_from date,
  assigned_to date,
  role text,
  created_at timestamptz not null default now(),
  unique(employee_id, project_id),
  check (assigned_to is null or assigned_from is null or assigned_to >= assigned_from)
);

create table if not exists public.work_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete restrict,
  project_id uuid not null references public.projects(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  date date not null,
  start_time time not null,
  end_time time not null,
  hours numeric(6,2) not null default 0,
  normal_hours numeric(6,2) not null default 0,
  normal_overtime numeric(6,2) not null default 0,
  weekend_overtime numeric(6,2) not null default 0,
  description text not null,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time <> end_time)
);

create table if not exists public.expenditures (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  journey_date date not null default current_date,
  start_place text not null,
  end_place text not null,
  kilometers integer not null check (kilometers > 0),
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employees add column if not exists photo text;
alter table public.employees add column if not exists skills text;
alter table public.employees add column if not exists certifications text;
alter table public.employees add column if not exists joining_date date;
alter table public.employees add column if not exists notes text;
alter table public.expenditures alter column kilometers type integer using round(kilometers)::integer;
alter table public.projects drop constraint if exists projects_company_id_number_key;
alter table public.projects add constraint projects_number_key unique(number);

create index if not exists expenditures_project_idx on public.expenditures(project_id);
create index if not exists expenditures_employee_idx on public.expenditures(employee_id);
create index if not exists expenditures_date_idx on public.expenditures(journey_date);
create index if not exists work_entries_employee_date_idx on public.work_entries(employee_id, date);
create index if not exists work_entries_project_idx on public.work_entries(project_id);
create index if not exists work_entries_company_idx on public.work_entries(company_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.calculate_work_entry()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  duration numeric(6,2);
  project_company uuid;
  is_weekend boolean;
begin
  select company_id into project_company from public.projects where id = new.project_id;
  if project_company is null then raise exception 'Project does not exist'; end if;
  if not exists (select 1 from public.employees where id = new.employee_id) then raise exception 'Employee does not exist'; end if;
  new.company_id = project_company;
  if new.start_time = new.end_time then raise exception 'Start and end time must differ'; end if;
  duration := extract(epoch from ((new.date + new.end_time) - (new.date + new.start_time))) / 3600;
  if duration <= 0 then duration := duration + 24; end if;
  if duration > 24 then raise exception 'Work entry cannot exceed 24 hours'; end if;
  is_weekend := extract(isodow from new.date) in (6, 7);
  if is_weekend then
    new.normal_hours = 0;
    new.normal_overtime = 0;
    new.weekend_overtime = duration;
  else
    new.normal_hours = least(duration, 8);
    new.normal_overtime = greatest(duration - 8, 0);
    new.weekend_overtime = 0;
  end if;
  new.hours = new.normal_hours + new.normal_overtime + new.weekend_overtime;
  return new;
end;
$$;

create or replace function public.prevent_work_entry_overlap()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare
  entry_start timestamp;
  entry_end timestamp;
  conflict_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.employee_id::text, 0));
  entry_start := new.date + new.start_time;
  entry_end := new.date + new.end_time;
  if entry_end <= entry_start then entry_end := entry_end + interval '1 day'; end if;
  select id into conflict_id
  from public.work_entries existing
  where existing.employee_id = new.employee_id
    and existing.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and tstzrange(entry_start at time zone 'UTC', entry_end at time zone 'UTC', '[)') &&
        tstzrange((existing.date + existing.start_time) at time zone 'UTC',
          (existing.date + existing.end_time + case when existing.end_time <= existing.start_time then interval '1 day' else interval '0 day' end) at time zone 'UTC', '[)')
  limit 1;
  if conflict_id is not null then raise exception 'Work entry overlaps existing entry %', conflict_id using errcode = '23P01'; end if;
  return new;
end;
$$;

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
drop trigger if exists employees_updated_at on public.employees;
create trigger employees_updated_at before update on public.employees for each row execute function public.set_updated_at();
drop trigger if exists work_entries_updated_at on public.work_entries;
create trigger work_entries_updated_at before update on public.work_entries for each row execute function public.set_updated_at();
drop trigger if exists expenditures_updated_at on public.expenditures;
create trigger expenditures_updated_at before update on public.expenditures for each row execute function public.set_updated_at();
drop trigger if exists work_entries_calculated on public.work_entries;
create trigger work_entries_calculated before insert or update on public.work_entries for each row execute function public.calculate_work_entry();
drop trigger if exists work_entries_no_overlap on public.work_entries;
create trigger work_entries_no_overlap before insert or update on public.work_entries for each row execute function public.prevent_work_entry_overlap();
