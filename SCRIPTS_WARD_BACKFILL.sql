-- Recompute ward_id for all issues using ward boundaries
update issues
set ward_id = w.id
from wards w
where w.boundary is not null
  and st_contains(w.boundary::geometry, issues.location::geometry);
