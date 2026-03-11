-- Supabase init script for DocuAI

create extension if not exists "uuid-ossp";

create table if not exists "User" (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null unique,
  password text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists "Document" (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references "User"(id) on delete cascade,
  name text,
  folder text default 'root',
  content text,
  type text default 'pdf',
  s3_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists "Share" (
  id uuid default uuid_generate_v4() primary key,
  doc_id uuid references "Document"(id) on delete cascade,
  token text unique,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Row-level security (RLS) policies
alter table "User" enable row level security;
create policy "Users can manage their own row" on "User"
  for all
  using (auth.uid() = id);

alter table "Document" enable row level security;
create policy "Owners can manage documents" on "Document"
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

alter table "Share" enable row level security;
create policy "Share read for all" on "Share"
  for select
  using (true);
create policy "Share manage all" on "Share"
  for all
  using (true);

-- triggers to keep updated_at up-to-date
create function update_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_user_updated_at
  before update on "User"
  for each row execute function update_updated_at();

create trigger trigger_document_updated_at
  before update on "Document"
  for each row execute function update_updated_at();

-- index for lookups
create index if not exists idx_document_owner_id on "Document" (owner_id);
create index if not exists idx_share_token on "Share" (token);
