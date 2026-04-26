-- Some Postgres/PostGIS installs ship without EPSG:4326 in spatial_ref_sys, which breaks
-- geography(point,4326) and ST_DWithin with SRID 4326 (e.g. find_issue_duplicates).
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'spatial_ref_sys')
     and not exists (select 1 from spatial_ref_sys where srid = 4326) then
    insert into spatial_ref_sys (srid, auth_name, auth_srid, proj4text, srtext)
    values (
      4326,
      'EPSG',
      4326,
      '+proj=longlat +datum=WGS84 +no_defs ',
      'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.017453292519943295],AUTHORITY["EPSG","4326"]]'
    );
  end if;
end $$;
