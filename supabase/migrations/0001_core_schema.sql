create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  x_user_id text unique,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  bch_handle text unique not null default ('bch_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  media_urls text[] not null default '{}',
  reply_to_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('laugh', 'fire', 'cruise', 'wild', 'music')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, reaction)
);

create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null,
  points integer not null check (points <> 0),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.reactions enable row level security;
alter table public.point_events enable row level security;
alter table public.notifications enable row level security;

create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "users update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "posts are publicly readable" on public.posts for select using (true);
create policy "users create own posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "users delete own posts" on public.posts for delete using (auth.uid() = author_id);
create policy "reactions are publicly readable" on public.reactions for select using (true);
create policy "users manage own reactions" on public.reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own point events" on public.point_events for select using (auth.uid() = user_id);
create policy "users read own notifications" on public.notifications for select using (auth.uid() = user_id);

create index if not exists posts_author_created_idx on public.posts(author_id, created_at desc);
create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists point_events_user_created_idx on public.point_events(user_id, created_at desc);
