const db = require("../db");

/**
 * Ensures a default system demo user exists and returns its ID.
 */
async function getOrCreateDefaultUser(client) {
  const existing = await client.query(
    "SELECT id FROM public.users WHERE username = $1",
    ["demo_user"]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const created = await client.query(
    `INSERT INTO public.users (username, email)
     VALUES ($1, $2)
     RETURNING id`,
    ["demo_user", "demo_user@sqlvault.local"]
  );
  return created.rows[0].id;
}

/**
 * Retrieves the ID of the 'main' branch for a repository.
 */
async function getMainBranchId(client, repositoryId) {
  const result = await client.query(
    `SELECT id FROM public.branches 
     WHERE repository_id = $1 AND name = 'main' 
     LIMIT 1`,
    [repositoryId]
  );
  if (result.rows.length === 0) {
    throw new Error(`Repository ${repositoryId} has no 'main' branch.`);
  }
  return result.rows[0].id;
}

/**
 * Retrieves or creates an active 'OPEN' change set for the given repository and branch,
 * then initializes the transaction-local SQLVault context (set_change_context).
 * MUST be called inside an active transaction.
 *
 * @param {import('pg').PoolClient} client
 * @param {number|string} repositoryId
 * @param {number|string} [branchId]
 * @param {number|string} [userId]
 * @returns {Promise<number>} changeSetId
 */
async function ensureChangeContext(client, repositoryId, branchId, userId) {
  if (!branchId) {
    branchId = await getMainBranchId(client, repositoryId);
  }

  if (!userId) {
    userId = await getOrCreateDefaultUser(client);
  }

  // Check for an existing OPEN change set on this repo and branch
  const existingCs = await client.query(
    `SELECT id FROM public.change_sets
     WHERE repository_id = $1 AND branch_id = $2 AND status = 'OPEN'
     ORDER BY created_at DESC
     LIMIT 1
     FOR UPDATE`,
    [repositoryId, branchId]
  );

  let changeSetId;
  if (existingCs.rows.length > 0) {
    changeSetId = existingCs.rows[0].id;
  } else {
    const newCs = await client.query(
      `INSERT INTO public.change_sets (repository_id, branch_id, user_id, status)
       VALUES ($1, $2, $3, 'OPEN')
       RETURNING id`,
      [repositoryId, branchId, userId]
    );
    changeSetId = newCs.rows[0].id;
  }

  // Activate transaction-safe context for Revan's SQL triggers
  await client.query("SELECT public.set_change_context($1, $2)", [
    repositoryId,
    changeSetId,
  ]);

  return { changeSetId, branchId, userId };
}

module.exports = {
  getOrCreateDefaultUser,
  getMainBranchId,
  ensureChangeContext,
};