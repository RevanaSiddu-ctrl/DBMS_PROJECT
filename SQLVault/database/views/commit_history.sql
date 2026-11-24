-- SQLVault: Commit History View
-- Provides a Git-log-style timeline of all commits with author and branch info.
-- Demonstrates: SQL Views, JOINs, aggregate functions, window functions.

CREATE OR REPLACE VIEW public.v_commit_history AS
SELECT
    c.id                                        AS commit_id,
    c.message,
    c.created_at,
    c.parent_commit_id,
    u.username                                  AS author_name,
    u.email                                     AS author_email,
    r.id                                        AS repository_id,
    r.name                                      AS repository_name,
    b.id                                        AS branch_id,
    b.name                                      AS branch_name,
    COUNT(rv.id)                                AS total_changes,
    -- Which operations this commit contains
    SUM(CASE WHEN rv.operation = 'INSERT' THEN 1 ELSE 0 END) AS inserts,
    SUM(CASE WHEN rv.operation = 'UPDATE' THEN 1 ELSE 0 END) AS updates,
    SUM(CASE WHEN rv.operation = 'DELETE' THEN 1 ELSE 0 END) AS deletes,
    -- Rank within a repository (1 = most recent)
    ROW_NUMBER() OVER (
        PARTITION BY c.repository_id
        ORDER BY c.created_at DESC
    )                                           AS commit_rank
FROM public.commits c
JOIN public.users       u  ON u.id  = c.author_id
JOIN public.repositories r ON r.id  = c.repository_id
JOIN public.branches    b  ON b.id  = c.branch_id
LEFT JOIN public.record_versions rv ON rv.commit_id = c.id
GROUP BY
    c.id, c.message, c.created_at, c.parent_commit_id,
    u.username, u.email,
    r.id, r.name,
    b.id, b.name
ORDER BY c.created_at DESC;

COMMENT ON VIEW public.v_commit_history IS
    'Git-log-style timeline of all commits with author, branch, and change-count metadata.';
