-- SQLVault: Repository Summary View
-- Provides a high-level dashboard of every repository with its latest commit,
-- total commits, open pending changes, and the number of branches.
-- Demonstrates: SQL Views, multiple JOINs, correlated sub-queries, aggregates.

CREATE OR REPLACE VIEW public.v_repository_summary AS
SELECT
    r.id                                AS repository_id,
    r.name                              AS repository_name,
    r.description,
    r.created_at                        AS created_at,
    u.username                          AS owner_name,
    u.email                             AS owner_email,
    -- Default / main branch head
    b_main.id                           AS main_branch_id,
    b_main.head_commit_id               AS latest_commit_id,
    latest_c.message                    AS latest_commit_message,
    latest_c.created_at                 AS latest_commit_at,
    -- Totals
    (
        SELECT COUNT(*)
          FROM public.commits c
         WHERE c.repository_id = r.id
    )                                   AS total_commits,
    (
        SELECT COUNT(*)
          FROM public.branches br
         WHERE br.repository_id = r.id
    )                                   AS total_branches,
    (
        SELECT COUNT(*)
          FROM public.pending_changes pc
          JOIN public.change_sets      cs ON cs.id = pc.change_set_id
         WHERE cs.repository_id = r.id
           AND cs.status = 'OPEN'
    )                                   AS uncommitted_changes,
    (
        SELECT COUNT(*)
          FROM public.students s
         WHERE s.repository_id = r.id
    )                                   AS student_row_count
FROM public.repositories r
JOIN public.users u
    ON u.id = r.owner_id
LEFT JOIN public.branches b_main
    ON b_main.repository_id = r.id
   AND b_main.name = 'main'
LEFT JOIN public.commits latest_c
    ON latest_c.id = b_main.head_commit_id
ORDER BY r.created_at DESC;

COMMENT ON VIEW public.v_repository_summary IS
    'Dashboard view: per-repository commit count, branch count, latest commit, and pending change count.';
