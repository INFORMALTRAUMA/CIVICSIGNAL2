-- Seed wards and issues for local testing/demo.

-- Wards (simple bounding boxes around Bengaluru coordinates)
insert into wards (name, code, city, boundary)
select 'Ward 1 - Central Market', 'W1', 'Bengaluru',
       ST_GeogFromText('POLYGON((77.58 12.97, 77.60 12.97, 77.60 12.99, 77.58 12.99, 77.58 12.97))')
where not exists (select 1 from wards where code = 'W1');

insert into wards (name, code, city, boundary)
select 'Ward 2 - River Road', 'W2', 'Bengaluru',
       ST_GeogFromText('POLYGON((77.60 12.96, 77.62 12.96, 77.62 12.98, 77.60 12.98, 77.60 12.96))')
where not exists (select 1 from wards where code = 'W2');

insert into wards (name, code, city, boundary)
select 'Ward 3 - City Center', 'W3', 'Bengaluru',
       ST_GeogFromText('POLYGON((77.57 12.95, 77.59 12.95, 77.59 12.97, 77.57 12.97, 77.57 12.95))')
where not exists (select 1 from wards where code = 'W3');

-- Issues
insert into issues (title, description, location, address, severity, status, priority, upvote_count, report_count, created_by)
select
  'Open manhole near Central Market',
  'An open manhole is exposed near the main entrance of Central Market. Pedestrians at risk.',
  ST_SetSRID(ST_MakePoint(77.5901, 12.9802), 4326)::geography,
  'Central Market Rd, Bengaluru',
  5,
  'open',
  'critical',
  34,
  3,
  'seed-user-1'
where not exists (select 1 from issues where title = 'Open manhole near Central Market');

insert into issues (title, description, location, address, severity, status, priority, upvote_count, report_count, created_by)
select
  'Burst water pipe on 7th Avenue',
  'Water flooding the street due to a burst pipe. Traffic blocked.',
  ST_SetSRID(ST_MakePoint(77.6105, 12.9690), 4326)::geography,
  '7th Avenue, Bengaluru',
  4,
  'in_progress',
  'high',
  18,
  2,
  'seed-user-2'
where not exists (select 1 from issues where title = 'Burst water pipe on 7th Avenue');

insert into issues (title, description, location, address, severity, status, priority, upvote_count, report_count, created_by)
select
  'Streetlight outage on River Road',
  'Multiple streetlights are out, area is dark after 7 PM.',
  ST_SetSRID(ST_MakePoint(77.6152, 12.9674), 4326)::geography,
  'River Road, Bengaluru',
  2,
  'resolved',
  'medium',
  12,
  1,
  'seed-user-3'
where not exists (select 1 from issues where title = 'Streetlight outage on River Road');

-- Status history for the resolved issue
insert into issue_status_history (issue_id, status, note, changed_by)
select i.id, 'resolved', 'Replaced damaged fixtures and restored power.', 'seed-official-1'
from issues i
where i.title = 'Streetlight outage on River Road'
  and not exists (
    select 1 from issue_status_history h where h.issue_id = i.id and h.status = 'resolved'
  );
