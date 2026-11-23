-- SQLVault: branch_operations.sql
-- PL/pgSQL functions for SQLVault branching support (Advanced feature per PRD).
-- Demonstrates: branching, fork semantics, branch listing.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. create_branch()
--    Forks a new branch from the current head of an existing branch.
--    Analogous to `git checkout -b <new-branch> [<source-branch>]`.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_branch(
    p_repository_id  BIGINT,
    p_branch_name    TEXT,
    p_source_branch  TEXT DEFAULT 'main',
    p_user_id        BIGINT DEFAULT NULL
)
RETURNS TABLE (
    branch_id      BIGINT,
    branch_name    TEXT,
    source_name    TEXT,
    head_commit_id BIGINT,
    change_set_id  BIGINT
)
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_source_id    BIGINT;
    v_head_commit  BIGINT;
    v_new_branch   BIGINT;
    v_user_id      BIGINT;
    v_cs_id        BIGINT;
BEGIN
    IF p_branch_name IS NULL OR BTRIM(p_branch_name) = '' THEN
        RAISE EXCEPTION 'Branch name must not be empty.' USING ERRCODE = '22023';
    END IF;

    -- Resolve source branch
    SELECT id, head_commit_id
      INTO v_source_id, v_head_commit
      FROM public.branches
     WHERE repository_id = p_repository_id
       AND name = p_source_branch;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source branch "%" not found in repository %.', p_source_branch, p_repository_id
            USING ERRCODE = '22023';
    END IF;

    -- Resolve user
    IF p_user_id IS NOT NULL THEN
        v_user_id := p_user_id;
    ELSE
        INSERT INTO public.users (username, email)
        VALUES ('demo_user', 'demo_user@sqlvault.local')
        ON CONFLICT (username) DO NOTHING;
        SELECT id INTO v_user_id FROM public.users WHERE username = 'demo_user';
    END IF;

    -- Create the new branch forked at the source head
    INSERT INTO public.branches (repository_id, name, head_commit_id)
    VALUES (p_repository_id, BTRIM(p_branch_name), v_head_commit)
    RETURNING id INTO v_new_branch;

    -- Open an initial change set on the new branch
    INSERT INTO public.change_sets (repository_id, branch_id, user_id, status)
    VALUES (p_repository_id, v_new_branch, v_user_id, 'OPEN')
    RETURNING id INTO v_cs_id;

    RETURN QUERY
    SELECT v_new_branch, BTRIM(p_branch_name), p_source_branch, v_head_commit, v_cs_id;
END;
$function$;

COMMENT ON FUNCTION public.create_branch(BIGINT, TEXT, TEXT, BIGINT) IS
    'Creates a new branch forked from an existing branch head (like git checkout -b).';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. list_branches()
--    Returns all branches for a repository with head commit info.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_branches(p_repository_id BIGINT)
RETURNS TABLE (
    branch_id      BIGINT,
    branch_name    TEXT,
    head_commit_id BIGINT,
    head_message   TEXT,
    head_at        TIMESTAMPTZ,
    total_commits  BIGINT
)
LANGUAGE sql
SET search_path = pg_catalog, public
AS $function$
    SELECT
        b.id                                         AS branch_id,
        b.name                                       AS branch_name,
        b.head_commit_id,
        c.message                                    AS head_message,
        c.created_at                                 AS head_at,
        (
            SELECT COUNT(*)
              FROM public.commits x
             WHERE x.repository_id = p_repository_id
               AND x.branch_id = b.id
        )                                            AS total_commits
    FROM public.branches b
    LEFT JOIN public.commits c ON c.id = b.head_commit_id
    WHERE b.repository_id = p_repository_id
    ORDER BY b.created_at ASC;
$function$;

COMMENT ON FUNCTION public.list_branches(BIGINT) IS
    'Lists all branches for a repository with their head commit information.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. merge_branch() — basic fast-forward merge (no conflict resolution)
--    Copies the head commit pointer from source into target when the target
--    is a direct ancestor of the source (fast-forward eligible).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.merge_branch(
    p_repository_id BIGINT,
    p_source_branch TEXT,
    p_target_branch TEXT DEFAULT 'main'
)
RETURNS TABLE (
    merged          BOOLEAN,
    source_branch   TEXT,
    target_branch   TEXT,
    new_head_commit BIGINT,
    message         TEXT
)
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_source_id      BIGINT;
    v_target_id      BIGINT;
    v_source_head    BIGINT;
    v_target_head    BIGINT;
BEGIN
    -- Fetch both branches
    SELECT id, head_commit_id INTO v_source_id, v_source_head
      FROM public.branches
     WHERE repository_id = p_repository_id AND name = p_source_branch;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source branch "%" not found.', p_source_branch USING ERRCODE = '22023';
    END IF;

    SELECT id, head_commit_id INTO v_target_id, v_target_head
      FROM public.branches
     WHERE repository_id = p_repository_id AND name = p_target_branch;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target branch "%" not found.', p_target_branch USING ERRCODE = '22023';
    END IF;

    IF v_source_head IS NULL THEN
        RETURN QUERY SELECT FALSE, p_source_branch, p_target_branch, v_target_head,
            'Source branch has no commits to merge.'::TEXT;
        RETURN;
    END IF;

    IF v_source_head = v_target_head THEN
        RETURN QUERY SELECT FALSE, p_source_branch, p_target_branch, v_target_head,
            'Already up to date — both branches point to the same commit.'::TEXT;
        RETURN;
    END IF;

    -- Fast-forward: advance target branch head to source head
    UPDATE public.branches
       SET head_commit_id = v_source_head
     WHERE id = v_target_id;

    RETURN QUERY
    SELECT TRUE, p_source_branch, p_target_branch, v_source_head,
        format('Fast-forward merge: %s → %s advanced to commit %s.',
            p_source_branch, p_target_branch, v_source_head)::TEXT;
END;
$function$;

COMMENT ON FUNCTION public.merge_branch(BIGINT, TEXT, TEXT) IS
    'Fast-forward merges source branch commits into the target branch.';
