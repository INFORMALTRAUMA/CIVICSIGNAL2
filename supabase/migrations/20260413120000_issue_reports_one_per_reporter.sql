-- One community report per user per issue (matches issue_upvotes pattern).
-- Remove duplicate rows before adding the constraint (keep oldest by created_at).
delete from issue_reports ir
where ir.id in (
  select id from (
    select id,
      row_number() over (partition by issue_id, reporter_id order by created_at asc, id asc) as rn
    from issue_reports
  ) ranked
  where rn > 1
);

create unique index if not exists issue_reports_issue_reporter_uidx
  on issue_reports (issue_id, reporter_id);
