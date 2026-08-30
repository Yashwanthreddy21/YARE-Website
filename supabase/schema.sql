create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists categories (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  icon text,
  sort_order int default 0,
  deleted boolean default false,
  created_at timestamptz default now(),
  primary key (user_id, id)
);

create table if not exists tasks (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  name text not null,
  category_id text,
  task_type text not null,
  icon text,
  theme_tag text,
  unit text,
  target_value numeric,
  min_value numeric,
  max_value numeric,
  frequency_type text default 'daily',
  start_date date not null default current_date,
  end_date date,
  active boolean default true,
  archived boolean default false,
  deleted boolean default false,
  include_in_score boolean default true,
  reminder_enabled boolean default false,
  reminder_time time,
  notes text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, id),
  foreign key (user_id, category_id) references categories(user_id, id) on delete restrict
);

create table if not exists task_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null,
  day_of_week int not null check(day_of_week between 0 and 6),
  frequency_type text default 'custom',
  unique(user_id, task_id, day_of_week),
  foreign key (user_id, task_id) references tasks(user_id, id) on delete cascade
);

create table if not exists task_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  task_id text,
  date date not null,
  completed boolean default false,
  numeric_value numeric,
  text_value text,
  time_value time,
  duration_minutes int,
  target_snapshot numeric,
  min_snapshot numeric,
  max_snapshot numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, id),
  unique(user_id, task_id, date),
  foreign key (user_id, task_id) references tasks(user_id, id) on delete restrict
);

create table if not exists expenses (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  date date not null,
  amount numeric not null check(amount >= 0),
  category text not null,
  description text,
  notes text,
  created_at timestamptz default now(),
  primary key (user_id, id)
);

create table if not exists job_applications (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  company text not null,
  role text not null,
  date_applied date not null,
  job_url text,
  location text,
  salary text,
  work_type text,
  status text not null default 'Applied',
  notes text,
  created_at timestamptz default now(),
  primary key (user_id, id)
);

create table if not exists schedule_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  day_of_week int not null check(day_of_week between 0 and 6),
  title text not null,
  start_time time,
  end_time time,
  sort_order int default 0,
  primary key (user_id, id)
);

create table if not exists user_goals (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  goal_name text not null,
  goal_value numeric,
  unit text,
  primary key (user_id, id),
  unique(user_id, goal_name)
);

alter table profiles enable row level security;
alter table categories enable row level security;
alter table tasks enable row level security;
alter table task_schedules enable row level security;
alter table task_logs enable row level security;
alter table expenses enable row level security;
alter table job_applications enable row level security;
alter table schedule_items enable row level security;
alter table user_goals enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles','categories','tasks','task_schedules','task_logs','expenses','job_applications','schedule_items','user_goals'] loop
    execute format('drop policy if exists "own data" on %I', t);
    execute format(
      'create policy "own data" on %I for all using (auth.uid() = %s) with check (auth.uid() = %s)',
      t,
      case when t='profiles' then 'id' else 'user_id' end,
      case when t='profiles' then 'id' else 'user_id' end
    );
  end loop;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create index if not exists task_logs_user_date_idx on task_logs(user_id, date);
create index if not exists expenses_user_date_idx on expenses(user_id, date);
create index if not exists jobs_user_date_idx on job_applications(user_id, date_applied);
