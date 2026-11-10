-- Sets the active repository/change-set context for the current transaction.
-- The transaction ID marker prevents stale session-level settings from being
-- accepted by the tracking trigger in a later transaction.
CREATE OR REPLACE FUNCTION public.set_change_context(
    p_repository_id BIGINT,
    p_change_set_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_change_set_repository_id BIGINT;
    v_change_set_status TEXT;
BEGIN
    IF p_repository_id IS NULL OR p_change_set_id IS NULL THEN
        RAISE EXCEPTION 'SQLVault repository ID and change-set ID are required.'
            USING ERRCODE = '22023';
    END IF;

    SELECT cs.repository_id, cs.status
      INTO v_change_set_repository_id, v_change_set_status
      FROM public.change_sets AS cs
     WHERE cs.id = p_change_set_id
     FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SQLVault change set % does not exist.', p_change_set_id
            USING ERRCODE = '22023';
    END IF;

    IF v_change_set_repository_id <> p_repository_id THEN
        RAISE EXCEPTION
            'SQLVault change set % does not belong to repository %.',
            p_change_set_id, p_repository_id
            USING ERRCODE = '22023';
    END IF;

    IF v_change_set_status <> 'OPEN' THEN
        RAISE EXCEPTION 'SQLVault change set % is not OPEN.', p_change_set_id
            USING ERRCODE = '22023';
    END IF;

    PERFORM pg_catalog.set_config(
        'sqlvault.repository_id', p_repository_id::TEXT, TRUE
    );
    PERFORM pg_catalog.set_config(
        'sqlvault.change_set_id', p_change_set_id::TEXT, TRUE
    );
    PERFORM pg_catalog.set_config(
        'sqlvault.context_xid', pg_catalog.txid_current()::TEXT, TRUE
    );
END;
$function$;

COMMENT ON FUNCTION public.set_change_context(BIGINT, BIGINT) IS
    'Sets and validates transaction-local SQLVault repository/change-set context.';

-- Reusable AFTER ROW trigger function. The first trigger argument names the
-- affected table's primary-key column; tracked rows must also have repository_id.
CREATE OR REPLACE FUNCTION public.track_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
DECLARE
    v_repository_setting TEXT;
    v_change_set_setting TEXT;
    v_xid_setting TEXT;
    v_repository_id BIGINT;
    v_change_set_id BIGINT;
    v_context_xid BIGINT;
    v_change_set_repository_id BIGINT;
    v_change_set_status TEXT;
    v_old_data JSONB;
    v_new_data JSONB;
    v_record_data JSONB;
    v_record_id TEXT;
    v_row_repository_id BIGINT;
    v_new_repository_id BIGINT;
BEGIN
    IF TG_NARGS <> 1 OR NULLIF(BTRIM(TG_ARGV[0]), '') IS NULL THEN
        RAISE EXCEPTION
            'SQLVault tracking trigger on %.% requires one primary-key column argument.',
            TG_TABLE_SCHEMA, TG_TABLE_NAME
            USING ERRCODE = '22023';
    END IF;

    v_repository_setting := pg_catalog.current_setting(
        'sqlvault.repository_id', TRUE
    );
    v_change_set_setting := pg_catalog.current_setting(
        'sqlvault.change_set_id', TRUE
    );
    v_xid_setting := pg_catalog.current_setting(
        'sqlvault.context_xid', TRUE
    );

    IF NULLIF(BTRIM(v_repository_setting), '') IS NULL
       OR NULLIF(BTRIM(v_change_set_setting), '') IS NULL
       OR NULLIF(BTRIM(v_xid_setting), '') IS NULL THEN
        RAISE EXCEPTION
            'SQLVault change context is missing; call set_change_context(repository_id, change_set_id) in this transaction.'
            USING ERRCODE = '22023';
    END IF;

    BEGIN
        v_repository_id := BTRIM(v_repository_setting)::BIGINT;
        v_change_set_id := BTRIM(v_change_set_setting)::BIGINT;
        v_context_xid := BTRIM(v_xid_setting)::BIGINT;
    EXCEPTION
        WHEN invalid_text_representation OR numeric_value_out_of_range THEN
            RAISE EXCEPTION 'SQLVault change context contains an invalid ID.'
                USING ERRCODE = '22023';
    END;

    IF v_context_xid <> pg_catalog.txid_current() THEN
        RAISE EXCEPTION
            'SQLVault change context is not valid for the current transaction; set it again in this transaction.'
            USING ERRCODE = '22023';
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_new_data := pg_catalog.to_jsonb(NEW);
        v_record_data := v_new_data;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_data := pg_catalog.to_jsonb(OLD);
        v_new_data := pg_catalog.to_jsonb(NEW);
        v_record_data := v_old_data;
    ELSIF TG_OP = 'DELETE' THEN
        v_old_data := pg_catalog.to_jsonb(OLD);
        v_record_data := v_old_data;
    ELSE
        RAISE EXCEPTION 'Unsupported SQLVault tracking operation: %.', TG_OP
            USING ERRCODE = '22023';
    END IF;

    v_record_id := v_record_data ->> TG_ARGV[0];
    IF NULLIF(BTRIM(v_record_id), '') IS NULL THEN
        RAISE EXCEPTION
            'SQLVault could not read primary-key column "%" from %.%.',
            TG_ARGV[0], TG_TABLE_SCHEMA, TG_TABLE_NAME
            USING ERRCODE = '22023';
    END IF;

    BEGIN
        v_row_repository_id :=
            (v_record_data ->> 'repository_id')::BIGINT;
        IF TG_OP = 'UPDATE' THEN
            v_new_repository_id :=
                (v_new_data ->> 'repository_id')::BIGINT;
        END IF;
    EXCEPTION
        WHEN invalid_text_representation OR numeric_value_out_of_range THEN
            RAISE EXCEPTION
                'SQLVault could not read a valid repository_id from %.%.',
                TG_TABLE_SCHEMA, TG_TABLE_NAME
                USING ERRCODE = '22023';
    END;

    IF v_row_repository_id IS NULL THEN
        RAISE EXCEPTION
            'SQLVault tracked row in %.% has no repository_id.',
            TG_TABLE_SCHEMA, TG_TABLE_NAME
            USING ERRCODE = '22023';
    END IF;

    IF v_row_repository_id <> v_repository_id
       OR (TG_OP = 'UPDATE' AND v_new_repository_id IS DISTINCT FROM v_repository_id) THEN
        RAISE EXCEPTION
            'SQLVault tracked row repository does not match the active repository context.'
            USING ERRCODE = '22023';
    END IF;

    SELECT cs.repository_id, cs.status
      INTO v_change_set_repository_id, v_change_set_status
      FROM public.change_sets AS cs
     WHERE cs.id = v_change_set_id
     FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SQLVault change set % does not exist.', v_change_set_id
            USING ERRCODE = '22023';
    END IF;

    IF v_change_set_repository_id <> v_repository_id THEN
        RAISE EXCEPTION
            'SQLVault change set % does not belong to repository %.',
            v_change_set_id, v_repository_id
            USING ERRCODE = '22023';
    END IF;

    IF v_change_set_status <> 'OPEN' THEN
        RAISE EXCEPTION 'SQLVault change set % is not OPEN.', v_change_set_id
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.pending_changes (
        change_set_id,
        operation,
        table_name,
        record_id,
        old_data,
        new_data
    )
    VALUES (
        v_change_set_id,
        TG_OP,
        TG_TABLE_NAME,
        v_record_id,
        v_old_data,
        v_new_data
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.track_changes() IS
    'Records row-level INSERT, UPDATE, and DELETE operations in pending_changes.';
