-- Indexes for repository, branch, commit-history, and change-set lookups.
-- Primary-key and UNIQUE constraints already create their own indexes.

CREATE INDEX repositories_owner_idx
    ON repositories (owner_id);

CREATE INDEX branches_head_commit_idx
    ON branches (head_commit_id)
    WHERE head_commit_id IS NOT NULL;

CREATE INDEX commits_repository_created_idx
    ON commits (repository_id, created_at DESC);

CREATE INDEX commits_branch_created_idx
    ON commits (repository_id, branch_id, created_at DESC);

CREATE INDEX commits_parent_commit_idx
    ON commits (parent_commit_id)
    WHERE parent_commit_id IS NOT NULL;

CREATE INDEX commits_author_created_idx
    ON commits (author_id, created_at DESC);

CREATE INDEX change_sets_repository_branch_created_idx
    ON change_sets (repository_id, branch_id, created_at DESC);

CREATE INDEX change_sets_user_created_idx
    ON change_sets (user_id, created_at DESC);

CREATE INDEX pending_changes_change_set_created_idx
    ON pending_changes (change_set_id, created_at);

CREATE INDEX record_versions_commit_idx
    ON record_versions (commit_id);
