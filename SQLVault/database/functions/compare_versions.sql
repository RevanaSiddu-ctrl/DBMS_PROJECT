-- SQLVault: compare_versions()
-- Returns a side-by-side diff of every record change between two commits,
-- mirroring `git diff <commit_a>..<commit_b>`.
--
-- Demonstrates: set-returning PL/pgSQL functions, JSONB operators, FULL OUTER JOIN logic.

CREATE OR REPLACE FUNCTION public.compare_versions(
    p_from_commit_id BIGINT,
    p_to_commit_id   BIGINT
)
RETURNS TABLE (
    table_name     TEXT,
    record_id      TEXT,
    operation_from TEXT,
    operation_to   TEXT,
    old_data_from  JSONB,
    new_data_from  JSONB,
    old_data_to    JSONB,
    new_data_to    JSONB,
    diff_summary   TEXT
)
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_from_exists BOOLEAN;
    v_to_exists   BOOLEAN;
BEGIN
    -- Validate commits exist
    SELECT EXISTS (SELECT 1 FROM public.commits WHERE id = p_from_commit_id) INTO v_from_exists;
    SELECT EXISTS (SELECT 1 FROM public.commits WHERE id = p_to_commit_id)   INTO v_to_exists;

    IF NOT v_from_exists THEN
        RAISE EXCEPTION 'Commit % does not exist.', p_from_commit_id USING ERRCODE = '22023';
    END IF;
    IF NOT v_to_exists THEN
        RAISE EXCEPTION 'Commit % does not exist.', p_to_commit_id USING ERRCODE = '22023';
    END IF;

    RETURN QUERY
    WITH
    -- Record versions from the base commit
    base AS (
        SELECT
            rv.table_name,
            rv.record_id,
            rv.operation,
            rv.old_data,
            rv.new_data
        FROM public.record_versions rv
        WHERE rv.commit_id = p_from_commit_id
    ),
    -- Record versions from the target commit
    target AS (
        SELECT
            rv.table_name,
            rv.record_id,
            rv.operation,
            rv.old_data,
            rv.new_data
        FROM public.record_versions rv
        WHERE rv.commit_id = p_to_commit_id
    )
    SELECT
        COALESCE(b.table_name, t.table_name)                   AS table_name,
        COALESCE(b.record_id,  t.record_id)                    AS record_id,
        b.operation                                            AS operation_from,
        t.operation                                            AS operation_to,
        b.old_data                                             AS old_data_from,
        b.new_data                                             AS new_data_from,
        t.old_data                                             AS old_data_to,
        t.new_data                                             AS new_data_to,
        -- Human-readable summary
        CASE
            WHEN b.record_id IS NULL THEN
                format('[+] %s row %s added in commit %s',
                    t.table_name, t.record_id, p_to_commit_id)
            WHEN t.record_id IS NULL THEN
                format('[-] %s row %s present in commit %s, absent in commit %s',
                    b.table_name, b.record_id, p_from_commit_id, p_to_commit_id)
            WHEN b.new_data IS DISTINCT FROM t.new_data OR b.operation <> t.operation THEN
                format('[~] %s row %s modified between commits %s and %s',
                    b.table_name, b.record_id, p_from_commit_id, p_to_commit_id)
            ELSE
                format('[=] %s row %s unchanged between commits %s and %s',
                    b.table_name, b.record_id, p_from_commit_id, p_to_commit_id)
        END                                                    AS diff_summary
    FROM      base   b
    FULL OUTER JOIN target t
        ON  t.table_name = b.table_name
        AND t.record_id  = b.record_id
    ORDER BY
        COALESCE(b.table_name, t.table_name),
        COALESCE(b.record_id,  t.record_id);
END;
$function$;

COMMENT ON FUNCTION public.compare_versions(BIGINT, BIGINT) IS
    'Returns a side-by-side diff of record versions between two commits (like git diff).';
