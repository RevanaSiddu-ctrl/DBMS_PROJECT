-- SQLVault's relational foundation. Run this file before constraints.sql and
-- indexes.sql.

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Accounts that own repositories and author commits.';
COMMENT ON COLUMN users.username IS 'Unique display/login name for the account.';
COMMENT ON COLUMN users.email IS 'Unique email address for the account.';

CREATE TABLE repositories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT repositories_owner_name_key UNIQUE (owner_id, name)
);

COMMENT ON TABLE repositories IS 'Version-controlled database projects owned by users.';
COMMENT ON COLUMN repositories.owner_id IS 'User who owns this repository.';

CREATE TABLE branches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repository_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    head_commit_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT branches_repository_id_id_key UNIQUE (repository_id, id),
    CONSTRAINT branches_repository_name_key UNIQUE (repository_id, name)
);

COMMENT ON TABLE branches IS 'Named lines of development within a repository.';
COMMENT ON COLUMN branches.repository_id IS 'Repository containing this branch.';
COMMENT ON COLUMN branches.head_commit_id IS 'Most recent commit on the branch; null before its first commit.';

CREATE TABLE commits (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repository_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    parent_commit_id BIGINT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT commits_repository_id_id_key UNIQUE (repository_id, id),
    CONSTRAINT commits_repository_branch_fkey
        FOREIGN KEY (repository_id, branch_id)
        REFERENCES branches(repository_id, id)
        ON DELETE CASCADE,
    CONSTRAINT commits_repository_branch_id_key UNIQUE (repository_id, branch_id, id),
    CONSTRAINT commits_parent_commit_fkey
        FOREIGN KEY (repository_id, parent_commit_id)
        REFERENCES commits(repository_id, id)
        DEFERRABLE INITIALLY DEFERRED
);

COMMENT ON TABLE commits IS 'Immutable snapshots in a repository branch history.';
COMMENT ON COLUMN commits.branch_id IS 'Branch that contains this commit, constrained to the same repository.';
COMMENT ON COLUMN commits.author_id IS 'User who authored this commit.';
COMMENT ON COLUMN commits.parent_commit_id IS 'Previous commit in the history; null for an initial commit.';
COMMENT ON COLUMN commits.message IS 'Human-readable summary of the committed changes.';

-- This reference is added after commits exists to safely resolve the
-- branches <-> commits circular relationship. The composite key ensures a
-- branch can only point to a commit belonging to that same branch.
ALTER TABLE branches
    ADD CONSTRAINT branches_head_commit_fkey
    FOREIGN KEY (repository_id, id, head_commit_id)
    REFERENCES commits(repository_id, branch_id, id)
    DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE change_sets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repository_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT change_sets_repository_branch_fkey
        FOREIGN KEY (repository_id, branch_id)
        REFERENCES branches(repository_id, id)
        ON DELETE CASCADE
);

COMMENT ON TABLE change_sets IS 'A user-created pending or committed group of database changes.';
COMMENT ON COLUMN change_sets.status IS 'Lifecycle state, constrained to OPEN or COMMITTED.';
COMMENT ON COLUMN change_sets.user_id IS 'User who created this change set.';

CREATE TABLE pending_changes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    change_set_id BIGINT NOT NULL REFERENCES change_sets(id) ON DELETE CASCADE,
    operation TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pending_changes IS 'Uncommitted row-level changes belonging to a change set.';
COMMENT ON COLUMN pending_changes.operation IS 'Requested row operation: INSERT, UPDATE, or DELETE.';
COMMENT ON COLUMN pending_changes.table_name IS 'Name of the affected table in the tracked database.';
COMMENT ON COLUMN pending_changes.record_id IS 'Text representation of the affected row identifier.';
COMMENT ON COLUMN pending_changes.old_data IS 'Row state before the operation; null for INSERT.';
COMMENT ON COLUMN pending_changes.new_data IS 'Row state after the operation; null for DELETE.';

CREATE TABLE record_versions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    commit_id BIGINT NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
    operation TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB
);

COMMENT ON TABLE record_versions IS 'Row-level changes permanently recorded by a commit.';
COMMENT ON COLUMN record_versions.commit_id IS 'Commit that records this version change.';
COMMENT ON COLUMN record_versions.operation IS 'Recorded row operation: INSERT, UPDATE, or DELETE.';
COMMENT ON COLUMN record_versions.table_name IS 'Name of the affected table in the tracked database.';
COMMENT ON COLUMN record_versions.record_id IS 'Text representation of the affected row identifier.';
COMMENT ON COLUMN record_versions.old_data IS 'Row state before the operation; null for INSERT.';
COMMENT ON COLUMN record_versions.new_data IS 'Row state after the operation; null for DELETE.';
