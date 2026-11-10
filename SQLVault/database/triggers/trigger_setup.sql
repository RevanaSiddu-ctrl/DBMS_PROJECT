-- Create the controlled demo table, then install each missing or mismatched
-- row trigger. The \ir paths are relative to this file.
\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS public.students (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repository_id BIGINT NOT NULL
        REFERENCES public.repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.students IS
    'Demo table whose row changes are automatically recorded by SQLVault.';
COMMENT ON COLUMN public.students.repository_id IS
    'Repository that owns this student row and scopes its tracked changes.';

CREATE INDEX IF NOT EXISTS students_repository_id_idx
    ON public.students (repository_id);

SELECT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_trigger AS t
      JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
      JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = 'students'
       AND t.tgname = 'students_track_insert'
       AND t.tgtype = 5
       AND t.tgenabled <> 'D'
       AND t.tgfoid = 'public.track_changes()'::REGPROCEDURE
       AND t.tgargs = pg_catalog.decode('696400', 'hex')
) AS sqlvault_insert_trigger_ok
\gset
\if :sqlvault_insert_trigger_ok
\echo 'INSERT tracking trigger already installed; skipping.'
\else
\ir track_insert.sql
\endif

SELECT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_trigger AS t
      JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
      JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = 'students'
       AND t.tgname = 'students_track_update'
       AND t.tgtype = 17
       AND t.tgenabled <> 'D'
       AND t.tgfoid = 'public.track_changes()'::REGPROCEDURE
       AND t.tgargs = pg_catalog.decode('696400', 'hex')
) AS sqlvault_update_trigger_ok
\gset
\if :sqlvault_update_trigger_ok
\echo 'UPDATE tracking trigger already installed; skipping.'
\else
\ir track_update.sql
\endif

SELECT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_trigger AS t
      JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
      JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = 'students'
       AND t.tgname = 'students_track_delete'
       AND t.tgtype = 9
       AND t.tgenabled <> 'D'
       AND t.tgfoid = 'public.track_changes()'::REGPROCEDURE
       AND t.tgargs = pg_catalog.decode('696400', 'hex')
) AS sqlvault_delete_trigger_ok
\gset
\if :sqlvault_delete_trigger_ok
\echo 'DELETE tracking trigger already installed; skipping.'
\else
\ir track_delete.sql
\endif
