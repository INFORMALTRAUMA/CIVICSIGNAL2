-- Civic Signal initial schema
-- Extensions
create extension if not exists postgis;
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists pg_cron;

-- Enums
do $$ begin
  create type issue_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type issue_priority as enum ('low', 'medium', 'high', 'critical');
exception
  when duplicate_object then null;
end $$;

-- Wards (administrative boundaries)
create table if not exists wards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  city text not null,
  boundary geography(polygon, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Issues (core reporting entity)
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  location geography(point, 4326) not null,
  address text,
  ward_id uuid references wards(id) on delete set null,
  status issue_status not null default 'open',
  priority issue_priority not null default 'medium',
  severity smallint not null default 3 check (severity between 1 and 5),
  priority_score numeric(10, 4) not null default 0,
  upvote_count integer not null default 0,
  report_count integer not null default 1,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists issues_location_gix on issues using gist (location);
create index if not exists issues_ward_id_idx on issues (ward_id);
create index if not exists issues_status_idx on issues (status);
create index if not exists issues_priority_score_idx on issues (priority_score desc);

create or replace function assign_issue_ward()
returns trigger as $$
declare
  ward uuid;
begin
  if new.location is null then
    return new;
  end if;

  select w.id into ward
  from wards w
  where w.boundary is not null
    and st_contains(w.boundary::geometry, new.location::geometry)
  order by w.name
  limit 1;

  if ward is not null then
    new.ward_id := ward;
  end if;

  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger issues_assign_ward
  before insert or update of location on issues
  for each row execute function assign_issue_ward();
exception
  when duplicate_object then null;
end $$;

-- Backfill ward_id for existing issues (safe to run multiple times)
update issues
set ward_id = w.id
from wards w
where issues.ward_id is null
  and w.boundary is not null
  and st_contains(w.boundary::geometry, issues.location::geometry);

-- Issue upvotes
create table if not exists issue_upvotes (
  issue_id uuid not null references issues(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (issue_id, user_id)
);

create index if not exists issue_upvotes_issue_id_idx on issue_upvotes (issue_id);

create or replace function increment_issue_upvotes()
returns trigger as $$
begin
  update issues set upvote_count = upvote_count + 1 where id = new.issue_id;
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger issue_upvotes_increment
  after insert on issue_upvotes
  for each row execute function increment_issue_upvotes();
exception
  when duplicate_object then null;
end $$;

-- Issue reports (for duplicate submissions or confirmations)
create table if not exists issue_reports (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  reporter_id text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists issue_reports_issue_id_idx on issue_reports (issue_id);

create or replace function increment_issue_reports()
returns trigger as $$
begin
  update issues set report_count = report_count + 1 where id = new.issue_id;
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger issue_reports_increment
  after insert on issue_reports
  for each row execute function increment_issue_reports();
exception
  when duplicate_object then null;
end $$;

-- Issue resolutions
create table if not exists issue_resolutions (
  issue_id uuid primary key references issues(id) on delete cascade,
  resolved_by text not null,
  resolved_at timestamptz not null default now(),
  verification_count integer not null default 0,
  resolution_note text
);

create table if not exists issue_verifications (
  issue_id uuid not null references issues(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (issue_id, user_id)
);

create index if not exists issue_verifications_issue_id_idx on issue_verifications (issue_id);

create or replace function increment_resolution_verifications()
returns trigger as $$
begin
  insert into issue_resolutions (issue_id, resolved_by, resolved_at, verification_count)
  values (new.issue_id, new.user_id, now(), 1)
  on conflict (issue_id)
  do update set verification_count = issue_resolutions.verification_count + 1;
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger issue_verifications_increment
  after insert on issue_verifications
  for each row execute function increment_resolution_verifications();
exception
  when duplicate_object then null;
end $$;

-- Issue status history
create table if not exists issue_status_history (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  status issue_status not null,
  note text,
  changed_by text,
  created_at timestamptz not null default now()
);

create index if not exists issue_status_history_issue_id_idx on issue_status_history (issue_id);

-- Media attachments (stored in Supabase Storage)
create table if not exists issue_media (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  media_type text not null,
  uploader_id text,
  created_at timestamptz not null default now()
);

create index if not exists issue_media_issue_id_idx on issue_media (issue_id);

-- Priority scoring function (for views or scheduled recalculation)
create or replace function civic_priority_score(
  upvotes integer,
  reports integer,
  age_hours numeric,
  severity integer,
  verification_count integer
) returns numeric as $$
select greatest(
  0,
  (
    (log(greatest(1, upvotes + reports)) * 10) + (least(5, greatest(1, severity)) * 5)
  ) * (1 / greatest(1, age_hours / 24))
  * (1 - least(1, verification_count / 10.0))
)
$$ language sql stable;

create or replace function update_issue_priority_score()
returns trigger as $$
declare
  verification_count integer;
begin
  select coalesce(r.verification_count, 0)
  into verification_count
  from issue_resolutions r
  where r.issue_id = new.id;

  new.priority_score := civic_priority_score(
    new.upvote_count,
    new.report_count,
    extract(epoch from (now() - new.created_at)) / 3600.0,
    new.severity,
    verification_count
  );

  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger issues_priority_score_update
  before insert or update of upvote_count, report_count, severity on issues
  for each row execute function update_issue_priority_score();
exception
  when duplicate_object then null;
end $$;

create or replace function refresh_issue_priority_scores()
returns void as $$
begin
  update issues i
  set priority_score = civic_priority_score(
    i.upvote_count,
    i.report_count,
    extract(epoch from (now() - i.created_at)) / 3600.0,
    i.severity,
    coalesce(r.verification_count, 0)
  )
  from issue_resolutions r
  where r.issue_id = i.id;

  update issues i
  set priority_score = civic_priority_score(
    i.upvote_count,
    i.report_count,
    extract(epoch from (now() - i.created_at)) / 3600.0,
    i.severity,
    0
  )
  where not exists (select 1 from issue_resolutions r where r.issue_id = i.id);
end;
$$ language plpgsql;

do $$ begin
  if not exists (select 1 from cron.job where jobname = 'refresh-issue-priority-scores') then
    perform cron.schedule(
      'refresh-issue-priority-scores',
      '0 * * * *',
      $cron$select refresh_issue_priority_scores();$cron$
    );
  end if;
exception
  when undefined_table then null;
end $$;

-- View for computed priority score (keeps raw columns + live score)
create or replace view issues_with_priority as
select
  i.*,
  civic_priority_score(
    i.upvote_count,
    i.report_count,
    extract(epoch from (now() - i.created_at)) / 3600.0,
    i.severity,
    coalesce(r.verification_count, 0)
  ) as live_priority_score
from issues i
left join issue_resolutions r on r.issue_id = i.id;

create or replace function find_issue_duplicates(
  lat numeric,
  lng numeric,
  query_text text,
  radius_m integer default 300,
  min_similarity numeric default 0.2
) returns table (
  issue_id uuid,
  title text,
  description text,
  similarity numeric,
  distance_m numeric,
  priority_score numeric,
  status issue_status,
  upvote_count integer,
  report_count integer
) as $$
select
  i.id as issue_id,
  i.title,
  i.description,
  greatest(similarity(i.title, query_text), similarity(i.description, query_text)) as similarity,
  st_distance(i.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography) as distance_m,
  i.priority_score,
  i.status,
  i.upvote_count,
  i.report_count
from issues i
where st_dwithin(i.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography, radius_m)
  and (
    similarity(i.title, query_text) >= min_similarity
    or similarity(i.description, query_text) >= min_similarity
  )
order by similarity desc, distance_m asc
limit 20;
$$ language sql stable;

create or replace function issues_within_radius(
  lat numeric,
  lng numeric,
  radius_m integer,
  status_filter issue_status default null,
  search_text text default null,
  ward_filter uuid default null
) returns setof issues as $$
select *
from issues
where st_dwithin(location, st_setsrid(st_makepoint(lng, lat), 4326)::geography, radius_m)
  and (status_filter is null or status = status_filter)
  and (ward_filter is null or ward_id = ward_filter)
  and (
    search_text is null
    or title ilike '%' || search_text || '%'
    or description ilike '%' || search_text || '%'
  )
order by priority_score desc;
$$ language sql stable;

-- Trigger to update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger set_wards_updated_at
  before update on wards
  for each row execute function set_updated_at();
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create trigger set_issues_updated_at
  before update on issues
  for each row execute function set_updated_at();
exception
  when duplicate_object then null;
end $$;

-- RLS is intentionally left disabled during scaffolding.
-- Minimal RLS for MVP (assumes Clerk user_id is stored in created_by/user_id fields).
alter table issues enable row level security;
alter table issue_upvotes enable row level security;
alter table issue_reports enable row level security;
alter table issue_media enable row level security;
alter table issue_status_history enable row level security;
alter table issue_resolutions enable row level security;
alter table issue_verifications enable row level security;
alter table wards enable row level security;

-- Public read access (MVP)
drop policy if exists "public_read_issues" on issues;
create policy "public_read_issues" on issues
  for select using (true);
drop policy if exists "public_read_wards" on wards;
create policy "public_read_wards" on wards
  for select using (true);
drop policy if exists "public_read_media" on issue_media;
create policy "public_read_media" on issue_media
  for select using (storage_bucket = 'issue-media');
drop policy if exists "public_read_status_history" on issue_status_history;
create policy "public_read_status_history" on issue_status_history
  for select using (true);
drop policy if exists "public_read_resolutions" on issue_resolutions;
create policy "public_read_resolutions" on issue_resolutions
  for select using (true);

-- Authenticated users can create issues/reports/upvotes/media/verifications
drop policy if exists "citizen_insert_issues" on issues;
create policy "citizen_insert_issues" on issues
  for insert with check ((auth.jwt() ->> 'role') = 'citizen' and auth.uid()::text = created_by);

drop policy if exists "citizen_insert_upvotes" on issue_upvotes;
create policy "citizen_insert_upvotes" on issue_upvotes
  for insert with check ((auth.jwt() ->> 'role') = 'citizen' and auth.uid()::text = user_id);

drop policy if exists "citizen_insert_reports" on issue_reports;
create policy "citizen_insert_reports" on issue_reports
  for insert with check ((auth.jwt() ->> 'role') = 'citizen' and auth.uid()::text = reporter_id);

drop policy if exists "auth_insert_media" on issue_media;
create policy "auth_insert_media" on issue_media
  for insert with check (auth.uid()::text = uploader_id);

drop policy if exists "citizen_insert_verifications" on issue_verifications;
create policy "citizen_insert_verifications" on issue_verifications
  for insert with check ((auth.jwt() ->> 'role') = 'citizen' and auth.uid()::text = user_id);

-- Officials can update issue status (set role claim in JWT: role=official)
drop policy if exists "official_update_issues" on issues;
create policy "official_update_issues" on issues
  for update using (auth.jwt() ->> 'role' = 'official');

drop policy if exists "official_insert_status_history" on issue_status_history;
create policy "official_insert_status_history" on issue_status_history
  for insert with check (auth.jwt() ->> 'role' = 'official');

drop policy if exists "owner_update_media" on issue_media;
create policy "owner_update_media" on issue_media
  for update using (auth.uid()::text = uploader_id);

drop policy if exists "owner_delete_media" on issue_media;
create policy "owner_delete_media" on issue_media
  for delete using (auth.uid()::text = uploader_id);
