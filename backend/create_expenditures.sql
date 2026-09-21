create table if not exists public.expenditures (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  journey_date date not null default current_date,
  start_place text not null,
  end_place text not null,
  kilometers numeric(10,2) not null check (kilometers > 0),
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenditures_project_idx on public.expenditures(project_id);
create index if not exists expenditures_employee_idx on public.expenditures(employee_id);
create index if not exists expenditures_date_idx on public.expenditures(journey_date);

alter table public.expenditures enable row level security;
