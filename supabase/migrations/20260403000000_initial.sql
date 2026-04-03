-- Profiles (linked 1:1 to auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null
);

alter table profiles enable row level security;

create policy "Authenticated users can view all profiles"
  on profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on profiles for update to authenticated using (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Courses
create table courses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  par_9 integer,
  par_18 integer,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table courses enable row level security;

create policy "Authenticated users can view courses"
  on courses for select to authenticated using (true);

create policy "Authenticated users can insert courses"
  on courses for insert to authenticated
  with check (auth.uid() = created_by);

-- Rounds
create table rounds (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete restrict not null,
  date date not null,
  holes integer not null check (holes in (9, 18)),
  par integer not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

alter table rounds enable row level security;

create policy "Authenticated users can view rounds"
  on rounds for select to authenticated using (true);

create policy "Authenticated users can insert rounds"
  on rounds for insert to authenticated
  with check (auth.uid() = created_by);

-- Round scores
create table round_scores (
  id uuid default gen_random_uuid() primary key,
  round_id uuid references rounds(id) on delete cascade not null,
  player_id uuid references profiles(id) on delete cascade not null,
  score integer not null,
  unique(round_id, player_id)
);

alter table round_scores enable row level security;

create policy "Authenticated users can view scores"
  on round_scores for select to authenticated using (true);

create policy "Authenticated users can insert scores"
  on round_scores for insert to authenticated with check (true);
