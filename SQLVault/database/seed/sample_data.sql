-- SQLVault: Sample Seed Data
-- Creates the demo repository + branch, seeds 5 student records,
-- and commits the initial snapshot — all within a single transaction.
--
-- Run after: schema.sql, constraints.sql, indexes.sql, students.sql (triggers setup),
-- and all functions/*.sql files.

BEGIN;

-- ─── 1. Create demo owner user ────────────────────────────────────────────────
INSERT INTO public.users (username, email)
VALUES ('revan_siddu', 'revan@sqlvault.dev')
ON CONFLICT (username) DO NOTHING;

-- ─── 2. Create the demo repository + main branch + initial change set ─────────
DO $seed$
DECLARE
    v_user_id       BIGINT;
    v_repo_id       BIGINT;
    v_branch_id     BIGINT;
    v_change_set_id BIGINT;
BEGIN
    SELECT id INTO v_user_id FROM public.users WHERE username = 'revan_siddu';

    -- Idempotent: skip if already seeded
    IF EXISTS (SELECT 1 FROM public.repositories WHERE name = 'student-registry') THEN
        RAISE NOTICE 'Demo repository already exists. Skipping seed.';
        RETURN;
    END IF;

    -- Create repository
    INSERT INTO public.repositories (name, description, owner_id)
    VALUES ('student-registry', 'SQLVault demo — tracks student record changes', v_user_id)
    RETURNING id INTO v_repo_id;

    -- Create main branch
    INSERT INTO public.branches (repository_id, name)
    VALUES (v_repo_id, 'main')
    RETURNING id INTO v_branch_id;

    -- Open initial change set
    INSERT INTO public.change_sets (repository_id, branch_id, user_id, status)
    VALUES (v_repo_id, v_branch_id, v_user_id, 'OPEN')
    RETURNING id INTO v_change_set_id;

    -- Activate SQLVault context so the triggers capture changes
    PERFORM public.set_change_context(v_repo_id, v_change_set_id);

    -- ─── 3. Insert 5 initial student records ─────────────────────────────────
    INSERT INTO public.students (repository_id, name, email, department) VALUES
        (v_repo_id, 'Ada Lovelace',   'ada@example.com',    'Computer Science'),
        (v_repo_id, 'Alan Turing',    'alan@example.com',   'Mathematics'),
        (v_repo_id, 'Grace Hopper',   'grace@example.com',  'Systems Engineering'),
        (v_repo_id, 'Claude Shannon', 'claude@example.com', 'Information Theory'),
        (v_repo_id, 'Donald Knuth',   'donald@example.com', 'Algorithms');

    -- ─── 4. Commit the initial snapshot ──────────────────────────────────────
    PERFORM public.create_commit(
        v_repo_id,
        'Initial students registry seed — 5 records',
        v_branch_id,
        v_user_id
    );

    RAISE NOTICE 'Seed complete. Repository id=%, 5 students inserted and committed.', v_repo_id;
END;
$seed$;

COMMIT;
