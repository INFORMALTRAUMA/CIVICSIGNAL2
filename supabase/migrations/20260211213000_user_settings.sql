create table if not exists user_settings (
  user_id text primary key,
  theme text not null default 'sand',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_theme_check check (theme in ('sand', 'harbor', 'midnight'))
);

alter table user_settings enable row level security;

-- Reuse the shared updated_at trigger function if present.
do $$ begin
  create trigger set_user_settings_updated_at
  before update on user_settings
  for each row execute function set_updated_at();
exception
  when duplicate_object then null;
end $$;
