create table if not exists users (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists gmail_connections (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  gmail_email_hash text not null,
  gmail_email_encrypted text not null,
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  token_expires_at timestamptz not null,
  scopes text[] not null default '{}',
  status text not null check (status in ('connected', 'disconnected', 'insufficient_scopes')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists gmail_connections_user_active_idx
  on gmail_connections(user_id)
  where status <> 'disconnected';

create table if not exists scan_runs (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  status text not null check (status in ('running', 'completed', 'partial', 'failed')),
  query text not null,
  message_count integer not null default 0,
  candidate_count integer not null default 0,
  selected_count integer not null default 0,
  skipped_count integer not null default 0,
  degraded boolean not null default false,
  error_code text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists sender_candidates (
  id text primary key,
  scan_run_id text not null references scan_runs(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  sender_domain text not null,
  sender_email_hash text,
  sender_display_name_encrypted text,
  classification text not null,
  score integer not null,
  reasons text[] not null default '{}',
  message_count integer not null default 0,
  proposed_action text not null,
  selected_by_default boolean not null default false,
  unsubscribe_methods text[] not null default '{}',
  protected_reason text,
  created_at timestamptz not null default now()
);

create index if not exists sender_candidates_scan_idx on sender_candidates(scan_run_id, user_id);

create table if not exists sender_actions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  scan_run_id text references scan_runs(id) on delete set null,
  sender_domain text not null,
  candidate_id text references sender_candidates(id) on delete set null,
  action_type text not null,
  result text not null,
  error_code text,
  reversible boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists gmail_filters (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  action_id text not null references sender_actions(id) on delete cascade,
  sender_domain text not null,
  gmail_filter_id text not null,
  gmail_label_id text not null,
  label_name text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists unsubscribe_attempts (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  action_id text references sender_actions(id) on delete set null,
  sender_domain text not null,
  method text not null check (method in ('https', 'mailto')),
  result text not null,
  error_code text,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  actor text not null check (actor in ('system', 'user')),
  action_type text not null,
  target_sender_domain text,
  result text not null,
  error_code text,
  reversible_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists user_allowlist (
  user_id text not null references users(id) on delete cascade,
  domain text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, domain)
);

create table if not exists user_blocklist (
  user_id text not null references users(id) on delete cascade,
  domain text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, domain)
);

alter table users enable row level security;
alter table gmail_connections enable row level security;
alter table scan_runs enable row level security;
alter table sender_candidates enable row level security;
alter table sender_actions enable row level security;
alter table gmail_filters enable row level security;
alter table unsubscribe_attempts enable row level security;
alter table audit_events enable row level security;
alter table user_allowlist enable row level security;
alter table user_blocklist enable row level security;
