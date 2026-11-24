-- SQLVault: create_repository()
-- Creates a new repository + a default 'main' branch + an initial OPEN change set
-- in one atomic transaction.
-- Demonstrates: PL/pgSQL functions, transactions, RETURNING, RAISE, parameter validation.

CREATE OR REPLACE FUNCTION public.create_repository(
    p_name        TEXT,
    p_description TEXT DEFAULT NULL,
    p_owner_id    BIGINT DEFAULT NULL
)
RETURNS TABLE (
    repository_id   BIGINT,
    repository_name TEXT,
    branch_id       BIGINT,
    branch_name     TEXT,
    change_set_id   BIGINT,
    owner_id        BIGINT
)
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_owner_id      BIGINT;
    v_repo_id       BIGINT;
    v_branch_id     BIGINT;
    v_change_set_id BIGINT;
BEGIN
    -- Validate required argument
    IF p_name IS NULL OR BTRIM(p_name) = '' THEN
        RAISE EXCEPTION 'Repository name must not be empty.'
            USING ERRCODE = '22023';
    END IF;

    -- Resolve owner: use provided ID or fall back to the demo user
    IF p_owner_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_owner_id) THEN
            RAISE EXCEPTION 'User % does not exist.', p_owner_id
                USING ERRCODE = '22023';
        END IF;
        v_owner_id := p_owner_id;
    ELSE
        -- Auto-create or fetch the demo user
        INSERT INTO public.users (username, email)
        VALUES ('demo_user', 'demo_user@sqlvault.local')
        ON CONFLICT (username) DO NOTHING;

        SELECT id INTO v_owner_id FROM public.users WHERE username = 'demo_user';
    END IF;

    -- 1. Insert the repository
    INSERT INTO public.repositories (name, description, owner_id)
    VALUES (BTRIM(p_name), p_description, v_owner_id)
    RETURNING id INTO v_repo_id;

    -- 2. Create the default 'main' branch
    INSERT INTO public.branches (repository_id, name)
    VALUES (v_repo_id, 'main')
    RETURNING id INTO v_branch_id;

    -- 3. Open an initial change set so mutations can be staged immediately
    INSERT INTO public.change_sets (repository_id, branch_id, user_id, status)
    VALUES (v_repo_id, v_branch_id, v_owner_id, 'OPEN')
    RETURNING id INTO v_change_set_id;

    RETURN QUERY
    SELECT
        v_repo_id,
        BTRIM(p_name),
        v_branch_id,
        'main'::TEXT,
        v_change_set_id,
        v_owner_id;
END;
$function$;

COMMENT ON FUNCTION public.create_repository(TEXT, TEXT, BIGINT) IS
    'Creates a repository with a default main branch and an initial OPEN change set.';
