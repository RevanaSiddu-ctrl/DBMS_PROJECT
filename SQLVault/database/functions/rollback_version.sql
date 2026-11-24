-- SQLVault: rollback_version()
-- Reverts the `students` table back to the state it was in after a target commit,
-- undoing every later commit in reverse chronological order.
-- Equivalent to `git checkout <commit>` applied to the data layer.
--
-- Demonstrates: PL/pgSQL, JSONB operators, reverse iteration, UPSERT, OVERRIDING SYSTEM VALUE.

CREATE OR REPLACE FUNCTION public.rollback_version(
    p_repository_id  BIGINT,
    p_target_commit_id BIGINT
)
RETURNS TABLE (
    reverted_commits   INT,
    target_commit_id   BIGINT,
    target_message     TEXT,
    rollback_at        TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_target_message  TEXT;
    v_reverted        INT  := 0;
    v_later_commit    RECORD;
    v_rv              RECORD;
    v_old             JSONB;
BEGIN
    -- Validate target commit belongs to this repository
    SELECT message INTO v_target_message
      FROM public.commits
     WHERE id = p_target_commit_id
       AND repository_id = p_repository_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commit % does not exist in repository %.',
            p_target_commit_id, p_repository_id
            USING ERRCODE = '22023';
    END IF;

    -- Revert each commit that happened AFTER the target, newest-first
    FOR v_later_commit IN
        SELECT id
          FROM public.commits
         WHERE repository_id = p_repository_id
           AND id > p_target_commit_id
         ORDER BY id DESC
    LOOP
        v_reverted := v_reverted + 1;

        -- Process each record change in reverse order within the commit
        FOR v_rv IN
            SELECT *
              FROM public.record_versions
             WHERE commit_id = v_later_commit.id
             ORDER BY id DESC
        LOOP
            IF v_rv.table_name = 'students' THEN
                IF v_rv.operation = 'INSERT' THEN
                    -- Undo INSERT → delete the row
                    DELETE FROM public.students
                     WHERE id = (v_rv.new_data ->> 'id')::BIGINT;

                ELSIF v_rv.operation = 'UPDATE' THEN
                    -- Undo UPDATE → restore old values
                    v_old := v_rv.old_data;
                    UPDATE public.students
                       SET name       = v_old ->> 'name',
                           email      = v_old ->> 'email',
                           department = v_old ->> 'department'
                     WHERE id = (v_old ->> 'id')::BIGINT;

                ELSIF v_rv.operation = 'DELETE' THEN
                    -- Undo DELETE → re-insert the original row
                    v_old := v_rv.old_data;
                    INSERT INTO public.students
                        (id, repository_id, name, email, department, created_at)
                    OVERRIDING SYSTEM VALUE
                    VALUES (
                        (v_old ->> 'id')::BIGINT,
                        (v_old ->> 'repository_id')::BIGINT,
                         v_old ->> 'name',
                         v_old ->> 'email',
                         v_old ->> 'department',
                        (v_old ->> 'created_at')::TIMESTAMPTZ
                    )
                    ON CONFLICT (id) DO UPDATE
                        SET name       = EXCLUDED.name,
                            email      = EXCLUDED.email,
                            department = EXCLUDED.department;
                END IF;
            END IF;
            -- Additional tracked tables can be handled here following the same pattern.
        END LOOP;
    END LOOP;

    -- Move the main branch head back to the target commit
    UPDATE public.branches
       SET head_commit_id = p_target_commit_id
     WHERE repository_id = p_repository_id
       AND name           = 'main';

    RETURN QUERY
    SELECT
        v_reverted,
        p_target_commit_id,
        v_target_message,
        NOW();
END;
$function$;

COMMENT ON FUNCTION public.rollback_version(BIGINT, BIGINT) IS
    'Rolls back tracked table data to a previous commit state, undoing later commits in reverse order.';
