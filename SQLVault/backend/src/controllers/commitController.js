const db = require("../db");
const contextService = require("../services/contextService");

/**
 * Fetch all uncommitted / staged changes for a repository (like `git status`).
 */
async function getPendingChanges(req, res, next) {
  try {
    const { repo_id } = req.query;

    if (!repo_id) {
      return res.status(400).json({ error: "Query parameter 'repo_id' is required." });
    }

    const result = await db.query(
      `SELECT 
         pc.id AS pending_change_id,
         pc.change_set_id,
         pc.operation,
         pc.table_name,
         pc.record_id,
         pc.old_data,
         pc.new_data,
         pc.created_at,
         cs.branch_id,
         b.name AS branch_name
       FROM public.pending_changes pc
       JOIN public.change_sets cs ON cs.id = pc.change_set_id
       JOIN public.branches b ON b.id = cs.branch_id
       WHERE cs.repository_id = $1 AND cs.status = 'OPEN'
       ORDER BY pc.created_at ASC;`,
      [repo_id]
    );

    res.json({
      repository_id: Number(repo_id),
      pending_changes: result.rows,
      uncommitted_count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Commit all pending changes with a message (like `git commit -m "..."`).
 * Atomically:
 *  1. Inserts into `commits`.
 *  2. Copies from `pending_changes` into `record_versions`.
 *  3. Clears `pending_changes` for that change set.
 *  4. Sets `change_sets.status = 'COMMITTED'`.
 *  5. Advances `branches.head_commit_id`.
 */
async function createCommit(req, res, next) {
  try {
    const { repository_id, branch_id, author_id, message } = req.body;

    if (!repository_id || !message || message.trim() === "") {
      return res.status(400).json({
        error: "Fields 'repository_id' and a non-empty 'message' are required.",
      });
    }

    const commitResult = await db.withTransaction(async (client) => {
      let finalBranchId = branch_id;
      if (!finalBranchId) {
        finalBranchId = await contextService.getMainBranchId(client, repository_id);
      }

      let finalAuthorId = author_id;
      if (!finalAuthorId) {
        finalAuthorId = await contextService.getOrCreateDefaultUser(client);
      }

      // 1. Locate the OPEN change set for this repo and branch
      const csRes = await client.query(
        `SELECT id FROM public.change_sets
         WHERE repository_id = $1 AND branch_id = $2 AND status = 'OPEN'
         FOR UPDATE`,
        [repository_id, finalBranchId]
      );

      if (csRes.rows.length === 0) {
        return { error: "No open change set found. Make modifications before committing.", status: 400 };
      }

      const changeSetId = csRes.rows[0].id;

      // 2. Fetch pending changes
      const pendingRes = await client.query(
        `SELECT * FROM public.pending_changes
         WHERE change_set_id = $1
         ORDER BY created_at ASC`,
        [changeSetId]
      );

      if (pendingRes.rows.length === 0) {
        return { error: "No changes to commit. Working directory is clean.", status: 400 };
      }

      // 3. Find current head commit as parent
      const branchRes = await client.query(
        "SELECT head_commit_id FROM public.branches WHERE id = $1 FOR UPDATE",
        [finalBranchId]
      );
      const parentCommitId = branchRes.rows[0]?.head_commit_id || null;

      // 4. Create the new commit record
      const commitRes = await client.query(
        `INSERT INTO public.commits (repository_id, branch_id, author_id, parent_commit_id, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [repository_id, finalBranchId, finalAuthorId, parentCommitId, message.trim()]
      );
      const newCommit = commitRes.rows[0];

      // 5. Transfer pending changes into immutable record_versions
      for (const change of pendingRes.rows) {
        await client.query(
          `INSERT INTO public.record_versions (commit_id, operation, table_name, record_id, old_data, new_data)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            newCommit.id,
            change.operation,
            change.table_name,
            change.record_id,
            change.old_data,
            change.new_data,
          ]
        );
      }

      // 6. Delete the pending changes
      await client.query(
        "DELETE FROM public.pending_changes WHERE change_set_id = $1",
        [changeSetId]
      );

      // 7. Mark the change set as COMMITTED
      await client.query(
        "UPDATE public.change_sets SET status = 'COMMITTED' WHERE id = $1",
        [changeSetId]
      );

      // 8. Advance the branch head pointer to the new commit
      await client.query(
        "UPDATE public.branches SET head_commit_id = $1 WHERE id = $2",
        [newCommit.id, finalBranchId]
      );

      return {
        commit: newCommit,
        changes_recorded: pendingRes.rows.length,
      };
    });

    if (commitResult.error) {
      return res.status(commitResult.status).json({ error: commitResult.error });
    }

    res.status(201).json({
      message: "Changes committed successfully.",
      ...commitResult,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch commit log history for a repository (like `git log`).
 */
async function getCommitHistory(req, res, next) {
  try {
    const { repo_id } = req.query;

    if (!repo_id) {
      return res.status(400).json({ error: "Query parameter 'repo_id' is required." });
    }

    const result = await db.query(
      `SELECT 
         c.id,
         c.message,
         c.parent_commit_id,
         c.created_at,
         u.username AS author_name,
         u.email AS author_email,
         b.name AS branch_name,
         (SELECT count(*) FROM public.record_versions rv WHERE rv.commit_id = c.id) AS total_changes
       FROM public.commits c
       JOIN public.users u ON u.id = c.author_id
       JOIN public.branches b ON b.id = c.branch_id
       WHERE c.repository_id = $1
       ORDER BY c.created_at DESC;`,
      [repo_id]
    );

    res.json({
      repository_id: Number(repo_id),
      commits: result.rows,
      total_commits: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Fetch details of a specific commit including all modified record versions.
 */
async function getCommitById(req, res, next) {
  try {
    const { id } = req.params;

    const commitRes = await db.query(
      `SELECT c.*, u.username AS author_name, b.name AS branch_name
       FROM public.commits c
       JOIN public.users u ON u.id = c.author_id
       JOIN public.branches b ON b.id = c.branch_id
       WHERE c.id = $1`,
      [id]
    );

    if (commitRes.rows.length === 0) {
      return res.status(404).json({ error: `Commit ${id} not found.` });
    }

    const versionsRes = await db.query(
      `SELECT * FROM public.record_versions WHERE commit_id = $1 ORDER BY id ASC`,
      [id]
    );

    res.json({
      commit: commitRes.rows[0],
      record_versions: versionsRes.rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Compare two commits and return differences (like `git diff`).
 */
async function compareCommits(req, res, next) {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: "Query parameters 'from' and 'to' commit IDs are required.",
      });
    }

    const [vFrom, vTo] = await Promise.all([
      db.query("SELECT * FROM public.record_versions WHERE commit_id = $1", [from]),
      db.query("SELECT * FROM public.record_versions WHERE commit_id = $1", [to]),
    ]);

    res.json({
      from_commit_id: Number(from),
      to_commit_id: Number(to),
      from_versions: vFrom.rows,
      to_versions: vTo.rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Rollback table records to a previous commit state (like `git checkout <commit>`).
 */
async function rollbackToCommit(req, res, next) {
  try {
    const { id } = req.params; // Target commit ID
    const { repository_id } = req.body;

    if (!repository_id) {
      return res.status(400).json({ error: "Field 'repository_id' is required." });
    }

    // Verify commit belongs to repository
    const checkCommit = await db.query(
      "SELECT id, message FROM public.commits WHERE id = $1 AND repository_id = $2",
      [id, repository_id]
    );

    if (checkCommit.rows.length === 0) {
      return res.status(404).json({
        error: `Commit ${id} does not exist in repository ${repository_id}.`,
      });
    }

    const rollbackResult = await db.withTransaction(async (client) => {
      // 1. Find all commits that happened AFTER the target commit
      const laterCommitsRes = await client.query(
        `SELECT id FROM public.commits 
         WHERE repository_id = $1 AND id > $2 
         ORDER BY id DESC`,
        [repository_id, id]
      );

      // Revert in reverse order
      for (const c of laterCommitsRes.rows) {
        const rvRes = await client.query(
          `SELECT * FROM public.record_versions WHERE commit_id = $1 ORDER BY id DESC`,
          [c.id]
        );

        for (const rv of rvRes.rows) {
          if (rv.table_name === "students") {
            if (rv.operation === "INSERT") {
              // Revert INSERT -> DELETE
              await client.query("DELETE FROM public.students WHERE id = $1", [
                rv.record_id,
              ]);
            } else if (rv.operation === "UPDATE") {
              // Revert UPDATE -> Restore old_data
              const old = rv.old_data;
              await client.query(
                `UPDATE public.students 
                 SET name = $1, email = $2, department = $3 
                 WHERE id = $4`,
                [old.name, old.email, old.department, rv.record_id]
              );
            } else if (rv.operation === "DELETE") {
              // Revert DELETE -> Re-insert old_data
              const old = rv.old_data;
              await client.query(
                `INSERT INTO public.students (id, repository_id, name, email, department, created_at)
                 OVERRIDING SYSTEM VALUE
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO UPDATE 
                 SET name = EXCLUDED.name, email = EXCLUDED.email, department = EXCLUDED.department`,
                [
                  old.id,
                  old.repository_id,
                  old.name,
                  old.email,
                  old.department,
                  old.created_at,
                ]
              );
            }
          }
        }
      }

      // Update branch head to target commit
      await client.query(
        "UPDATE public.branches SET head_commit_id = $1 WHERE repository_id = $2 AND name = 'main'",
        [id, repository_id]
      );

      return {
        target_commit_id: Number(id),
        reverted_commits_count: laterCommitsRes.rows.length,
      };
    });

    res.json({
      message: `Successfully rolled back to commit #${id}.`,
      ...rollbackResult,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPendingChanges,
  createCommit,
  getCommitHistory,
  getCommitById,
  compareCommits,
  rollbackToCommit,
};