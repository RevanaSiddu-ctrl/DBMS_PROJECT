\set ON_ERROR_STOP on

-- This test is intentionally rolled back so it leaves no SQLVault test data.
BEGIN;

DO $test$
DECLARE
    v_suffix TEXT := pg_catalog.txid_current()::TEXT;
    v_user_id BIGINT;
    v_repository_id BIGINT;
    v_other_repository_id BIGINT;
    v_branch_id BIGINT;
    v_other_branch_id BIGINT;
    v_change_set_id BIGINT;
    v_other_change_set_id BIGINT;
    v_student_id BIGINT;
    v_error TEXT;
    v_count BIGINT;
BEGIN
    INSERT INTO public.users (username, email)
    VALUES (
        'sqlvault_tracking_test_' || v_suffix,
        'sqlvault_tracking_test_' || v_suffix || '@example.test'
    )
    RETURNING id INTO v_user_id;

    INSERT INTO public.repositories (name, owner_id)
    VALUES ('sqlvault_tracking_test_' || v_suffix, v_user_id)
    RETURNING id INTO v_repository_id;

    INSERT INTO public.repositories (name, owner_id)
    VALUES ('sqlvault_tracking_other_' || v_suffix, v_user_id)
    RETURNING id INTO v_other_repository_id;

    INSERT INTO public.branches (repository_id, name)
    VALUES (v_repository_id, 'main')
    RETURNING id INTO v_branch_id;

    INSERT INTO public.branches (repository_id, name)
    VALUES (v_other_repository_id, 'main')
    RETURNING id INTO v_other_branch_id;

    INSERT INTO public.change_sets (
        repository_id, branch_id, user_id, status
    )
    VALUES (v_repository_id, v_branch_id, v_user_id, 'OPEN')
    RETURNING id INTO v_change_set_id;

    INSERT INTO public.change_sets (
        repository_id, branch_id, user_id, status
    )
    VALUES (v_other_repository_id, v_other_branch_id, v_user_id, 'OPEN')
    RETURNING id INTO v_other_change_set_id;

    -- Empty transaction-local values simulate a request with no context.
    PERFORM pg_catalog.set_config('sqlvault.repository_id', '', TRUE);
    PERFORM pg_catalog.set_config('sqlvault.change_set_id', '', TRUE);
    PERFORM pg_catalog.set_config('sqlvault.context_xid', '', TRUE);

    BEGIN
        INSERT INTO public.students (repository_id, name, email, department)
        VALUES (
            v_repository_id, 'No Context', 'no-context@example.test', 'Testing'
        );
        RAISE EXCEPTION 'Expected an INSERT without context to be rejected.';
    EXCEPTION
        WHEN SQLSTATE '22023' THEN
            GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
            IF v_error NOT LIKE 'SQLVault change context is missing%' THEN
                RAISE;
            END IF;
    END;

    RAISE NOTICE 'PASS: INSERT without a change context is rejected.';

    -- Bypass the helper deliberately to verify that the trigger independently
    -- rejects a change set belonging to a different repository.
    PERFORM pg_catalog.set_config(
        'sqlvault.repository_id', v_repository_id::TEXT, TRUE
    );
    PERFORM pg_catalog.set_config(
        'sqlvault.change_set_id', v_other_change_set_id::TEXT, TRUE
    );
    PERFORM pg_catalog.set_config(
        'sqlvault.context_xid', pg_catalog.txid_current()::TEXT, TRUE
    );

    BEGIN
        INSERT INTO public.students (repository_id, name, email, department)
        VALUES (
            v_repository_id, 'Wrong Change Set', 'wrong@example.test', 'Testing'
        );
        RAISE EXCEPTION
            'Expected an INSERT with a cross-repository change set to be rejected.';
    EXCEPTION
        WHEN SQLSTATE '22023' THEN
            GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
            IF v_error NOT LIKE 'SQLVault change set % does not belong to repository %' THEN
                RAISE;
            END IF;
    END;

    RAISE NOTICE 'PASS: A change set from another repository is rejected.';

    PERFORM public.set_change_context(v_repository_id, v_change_set_id);

    INSERT INTO public.students (repository_id, name, email, department)
    VALUES (
        v_repository_id, 'Ada Student', 'ada@example.test', 'Mathematics'
    )
    RETURNING id INTO v_student_id;

    UPDATE public.students
       SET name = 'Ada Updated', department = 'Computer Science'
     WHERE id = v_student_id;

    DELETE FROM public.students
     WHERE id = v_student_id;

    SELECT count(*)
      INTO v_count
      FROM public.pending_changes
     WHERE change_set_id = v_change_set_id
       AND table_name = 'students'
       AND record_id = v_student_id::TEXT;

    IF v_count <> 3 THEN
        RAISE EXCEPTION 'Expected 3 tracked operations, found %.', v_count;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM public.pending_changes AS pc
         WHERE pc.change_set_id = v_change_set_id
           AND pc.table_name = 'students'
           AND pc.record_id = v_student_id::TEXT
           AND pc.operation = 'INSERT'
           AND pc.old_data IS NULL
           AND pc.new_data ->> 'name' = 'Ada Student'
           AND pc.new_data ->> 'email' = 'ada@example.test'
           AND pc.new_data ->> 'department' = 'Mathematics'
           AND pc.new_data ->> 'repository_id' = v_repository_id::TEXT
           AND pc.new_data ->> 'id' = v_student_id::TEXT
    ) THEN
        RAISE EXCEPTION 'INSERT tracking data did not match the inserted row.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM public.pending_changes AS pc
         WHERE pc.change_set_id = v_change_set_id
           AND pc.table_name = 'students'
           AND pc.record_id = v_student_id::TEXT
           AND pc.operation = 'UPDATE'
           AND pc.old_data ->> 'name' = 'Ada Student'
           AND pc.old_data ->> 'department' = 'Mathematics'
           AND pc.new_data ->> 'name' = 'Ada Updated'
           AND pc.new_data ->> 'department' = 'Computer Science'
    ) THEN
        RAISE EXCEPTION 'UPDATE tracking data did not match the old/new rows.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM public.pending_changes AS pc
         WHERE pc.change_set_id = v_change_set_id
           AND pc.table_name = 'students'
           AND pc.record_id = v_student_id::TEXT
           AND pc.operation = 'DELETE'
           AND pc.old_data ->> 'name' = 'Ada Updated'
           AND pc.old_data ->> 'department' = 'Computer Science'
           AND pc.old_data ->> 'repository_id' = v_repository_id::TEXT
           AND pc.new_data IS NULL
    ) THEN
        RAISE EXCEPTION 'DELETE tracking data did not match the deleted row.';
    END IF;

    RAISE NOTICE 'PASS: INSERT, UPDATE, and DELETE snapshots are correct.';

    UPDATE public.change_sets
       SET status = 'COMMITTED'
     WHERE id = v_change_set_id;

    BEGIN
        INSERT INTO public.students (repository_id, name, email, department)
        VALUES (
            v_repository_id, 'Closed Change Set', 'closed@example.test', 'Testing'
        );
        RAISE EXCEPTION
            'Expected an INSERT with a non-OPEN change set to be rejected.';
    EXCEPTION
        WHEN SQLSTATE '22023' THEN
            GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
            IF v_error NOT LIKE 'SQLVault change set % is not OPEN%' THEN
                RAISE;
            END IF;
    END;

    RAISE NOTICE 'PASS: A non-OPEN change set is rejected.';
END;
$test$;

ROLLBACK;

BEGIN;

DO $context_cleanup$
BEGIN
    IF NULLIF(pg_catalog.current_setting('sqlvault.repository_id', TRUE), '') IS NOT NULL
       OR NULLIF(pg_catalog.current_setting('sqlvault.change_set_id', TRUE), '') IS NOT NULL
       OR NULLIF(pg_catalog.current_setting('sqlvault.context_xid', TRUE), '') IS NOT NULL THEN
        RAISE EXCEPTION 'SQLVault transaction context leaked after rollback.';
    END IF;

    RAISE NOTICE 'PASS: Transaction-local context is cleared after rollback.';
END;
$context_cleanup$;

ROLLBACK;
