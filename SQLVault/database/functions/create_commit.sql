-- SQLVault: create_commit()
-- Atomically moves all OPEN pending changes for a repository/branch pair
-- into immutable record_versions, creates a commit record, and advances
-- the branch head pointer — mirroring `git commit -m "..."`.
--
-- Demonstrates: PL/pgSQL, transactions, FOR loops, RETURNING, FK management.

CREATE OR REPLACE FUNCTION public.create_commit(
    p_repository_id BIGINT,
    p_message       TEXT,
    p_branch_id     BIGINT DEFAULT NULL,
    p_author_id     BIGINT DEFAULT NULL
)
RETURNS TABLE (
    commit_id       BIGINT,
    message         TEXT,
    branch_id       BIGINT,
    author_id       BIGINT,
    parent_commit_id BIGINT,
    changes_recorded INT,
    created_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_branch_id      BIGINT;
    v_author_id      BIGINT;
    v_change_set_id  BIGINT;
    v_parent_commit  BIGINT;
    v_new_commit_id  BIGINT;
    v_new_commit_at  TIMESTAMPTZ;
    v_change_count   INT := 0;
    v_change         RECORD;
BEGIN
    -- Validate inputs
    IF p_repository_id IS NULL OR p_message IS NULL OR BTRIM(p_message) = '' THEN
        RAISE EXCEPTION 'repository_id and a non-empty message are required.'
            USING ERRCODE = '22023';
    END IF;

    -- Resolve branch
    IF p_branch_id IS NOT NULL THEN
        v_branch_id := p_branch_id;
    ELSE
        SELECT id INTO v_branch_id
          FROM public.branches
         WHERE repository_id = p_repository_id AND name = 'main'
         LIMIT 1;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Repository % has no main branch.', p_repository_id
                USING ERRCODE = '22023';
        END IF;
    END IF;

    -- Resolve author
    IF p_author_id IS NOT NULL THEN
        v_author_id := p_author_id;
    ELSE
        INSERT INTO public.users (username, email)
        VALUES ('demo_user', 'demo_user@sqlvault.local')
        ON CONFLICT (username) DO NOTHING;
        SELECT id INTO v_author_id FROM public.users WHERE username = 'demo_user';
    END IF;

    -- Lock and fetch the OPEN change set
    SELECT id INTO v_change_set_id
      FROM public.change_sets
     WHERE repository_id = p_repository_id
       AND branch_id     = v_branch_id
       AND status        = 'OPEN'
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No OPEN change set found for repository % / branch %. Make some changes first.',
            p_repository_id, v_branch_id
            USING ERRCODE = '22023';
    END IF;

    -- Confirm there is at least one pending change to commit
    SELECT COUNT(*) INTO v_change_count
      FROM public.pending_changes
     WHERE change_set_id = v_change_set_id;

    IF v_change_count = 0 THEN
        RAISE EXCEPTION 'Nothing to commit. Working directory is clean.'
            USING ERRCODE = '22023';
    END IF;

    -- Get the current head commit as parent
    SELECT head_commit_id INTO v_parent_commit
      FROM public.branches
     WHERE id = v_branch_id
     FOR UPDATE;

    -- Create the commit record
    INSERT INTO public.commits
        (repository_id, branch_id, author_id, parent_commit_id, message)
    VALUES
        (p_repository_id, v_branch_id, v_author_id, v_parent_commit, BTRIM(p_message))
    RETURNING id, created_at
    INTO v_new_commit_id, v_new_commit_at;

    -- Transfer pending_changes → record_versions
    FOR v_change IN
        SELECT *
          FROM public.pending_changes
         WHERE change_set_id = v_change_set_id
         ORDER BY created_at ASC
    LOOP
        INSERT INTO public.record_versions
            (commit_id, operation, table_name, record_id, old_data, new_data)
        VALUES
            (v_new_commit_id, v_change.operation, v_change.table_name,
             v_change.record_id, v_change.old_data, v_change.new_data);
    END LOOP;

    -- Remove pending changes
    DELETE FROM public.pending_changes WHERE change_set_id = v_change_set_id;

    -- Mark change set committed
    UPDATE public.change_sets SET status = 'COMMITTED' WHERE id = v_change_set_id;

    -- Advance branch head pointer
    UPDATE public.branches SET head_commit_id = v_new_commit_id WHERE id = v_branch_id;

    -- Open a fresh OPEN change set for subsequent work
    INSERT INTO public.change_sets (repository_id, branch_id, user_id, status)
    VALUES (p_repository_id, v_branch_id, v_author_id, 'OPEN');

    RETURN QUERY
    SELECT
        v_new_commit_id,
        BTRIM(p_message),
        v_branch_id,
        v_author_id,
        v_parent_commit,
        v_change_count,
        v_new_commit_at;
END;
$function$;

COMMENT ON FUNCTION public.create_commit(BIGINT, TEXT, BIGINT, BIGINT) IS
    'Atomically commits pending changes: copies to record_versions, clears staging, and advances branch head.';
