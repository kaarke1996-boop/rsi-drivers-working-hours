create table public.driver_hours (
 id bigint generated always as identity primary key,
 driver text not null check (driver in ('Alinur','Noshad')),
 work_date date not null check (work_date >= date '2026-10-01'),
 start_time time(0) not null,
 end_time time(0) not null,
 minutes integer generated always as ((extract(epoch from (end_time-start_time))/60)::integer + case when end_time < start_time then 1440 else 0 end) stored,
 created_at timestamptz not null default now(),
 archived boolean not null default false,
 constraint valid_shift check (((extract(epoch from (end_time-start_time))/60)::integer + case when end_time < start_time then 1440 else 0 end) between 1 and 1080),
 constraint whole_minutes check (extract(second from start_time)=0 and extract(second from end_time)=0)
);
create unique index one_active_shift_per_day on public.driver_hours(driver,work_date) where archived=false;
alter table public.driver_hours enable row level security;
revoke all on public.driver_hours from anon, authenticated;
grant select (id,driver,work_date,start_time,end_time,minutes,created_at,archived) on public.driver_hours to anon;
grant insert (driver,work_date,start_time,end_time) on public.driver_hours to anon;
grant usage on sequence public.driver_hours_id_seq to anon;
create policy read_active_hours on public.driver_hours for select to anon using (archived=false);
create policy submit_valid_hours on public.driver_hours for insert to anon with check (archived=false and work_date <= (now() at time zone 'Asia/Riyadh')::date);
comment on table public.driver_hours is 'Append-only public timesheet. Owner corrects or archives entries in dashboard. No anonymous update or delete.';
select 'Tracker schema ready' as status;