create extension if not exists pgcrypto;
create sequence if not exists project_number_seq;
create sequence if not exists employee_id_seq;

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  number text not null default ('P-' || lpad(nextval('project_number_seq')::text, 4, '0')),
  name text not null,
  location text,
  start_date date not null,
  end_date date not null,
  status text not null default 'Active' check (status in ('Active', 'Completed', 'On Hold')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, number),
  check (end_date >= start_date)
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emp_id text not null unique default ('EMP-' || lpad(nextval('employee_id_seq')::text, 3, '0')),
  role text,
  phone text,
  email text,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  experience text,
  work_type text,
  address text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists employee_work_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  company_name text not null,
  role text,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  assigned_from date,
  assigned_to date,
  role text,
  created_at timestamptz not null default now(),
  unique(employee_id, project_id)
);

create table if not exists work_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  hours numeric(6,2) not null,
  description text not null,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time <> start_time)
);

create table if not exists expenditures (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  journey_date date not null default current_date,
  start_place text not null,
  end_place text not null,
  kilometers numeric(10,2) not null check (kilometers > 0),
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenditures_project_idx on expenditures(project_id);
create index if not exists expenditures_employee_idx on expenditures(employee_id);
create index if not exists expenditures_date_idx on expenditures(journey_date);

create index if not exists work_entries_employee_date_idx on work_entries(employee_id, date);
create index if not exists work_entries_project_idx on work_entries(project_id);
create index if not exists work_entries_company_idx on work_entries(company_id);

alter table companies enable row level security;
alter table projects enable row level security;
alter table employees enable row level security;
alter table employee_work_history enable row level security;
alter table assignments enable row level security;
alter table work_entries enable row level security;
alter table expenditures enable row level security;
