alter table work_entries
  add column if not exists normal_hours numeric(6,2),
  add column if not exists normal_overtime numeric(6,2) not null default 0,
  add column if not exists weekend_overtime numeric(6,2) not null default 0;

update work_entries
set normal_hours = case
  when extract(isodow from date) between 6 and 7 then 0
  else hours
end,
weekend_overtime = case
  when extract(isodow from date) between 6 and 7 then hours
  else 0
end
where normal_hours is null;
