-- Demo records tracked by SQLVault's row-level change triggers.
CREATE TABLE IF NOT EXISTS public.students (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repository_id BIGINT NOT NULL
        REFERENCES public.repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.students IS
    'Demo table whose row changes are automatically recorded by SQLVault.';
COMMENT ON COLUMN public.students.id IS
    'Primary key used by the tracking trigger as the record identifier.';
COMMENT ON COLUMN public.students.repository_id IS
    'Repository that owns this student row and scopes its tracked changes.';
COMMENT ON COLUMN public.students.name IS
    'Student name.';
COMMENT ON COLUMN public.students.email IS
    'Student email address.';
COMMENT ON COLUMN public.students.department IS
    'Student department; optional.';
COMMENT ON COLUMN public.students.created_at IS
    'Timestamp when the student row was created.';
