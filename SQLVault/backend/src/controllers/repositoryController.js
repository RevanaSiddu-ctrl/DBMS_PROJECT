const db = require("../db");
const contextService = require("../services/contextService");

/**
 * List all repositories with owner name and head commit.
 */
async function listRepositories(req, res, next) {
  try {
    const result = await db.query(`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.created_at,
        u.id AS owner_id,
        u.username AS owner_name,
        b.id AS main_branch_id,
        b.head_commit_id
      FROM public.repositories r
      JOIN public.users u ON u.id = r.owner_id
      LEFT JOIN public.branches b ON b.repository_id = r.id AND b.name = 'main'
      ORDER BY r.created_at DESC;
    `);

    res.json({
      repositories: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new repository and automatically initialize its 'main' branch.
 */
async function createRepository(req, res, next) {
  try {
    const { name, description, owner_id } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Repository name is required." });
    }

    const created = await db.withTransaction(async (client) => {
      let finalOwnerId = owner_id;
      if (!finalOwnerId) {
        finalOwnerId = await contextService.getOrCreateDefaultUser(client);
      }

      // 1. Insert repository
      const repoRes = await client.query(
        `INSERT INTO public.repositories (name, description, owner_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name.trim(), description || null, finalOwnerId]
      );
      const repo = repoRes.rows[0];

      // 2. Initialize default 'main' branch
      const branchRes = await client.query(
        `INSERT INTO public.branches (repository_id, name)
         VALUES ($1, 'main')
         RETURNING *`,
        [repo.id]
      );
      const branch = branchRes.rows[0];

      return {
        ...repo,
        main_branch: branch,
      };
    });

    res.status(201).json({
      message: "Repository created successfully.",
      repository: created,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "A repository with this name already exists for this owner.",
      });
    }
    next(error);
  }
}

/**
 * Get single repository details.
 */
async function getRepositoryById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT r.*, u.username as owner_name, b.id as main_branch_id, b.head_commit_id
       FROM public.repositories r
       JOIN public.users u ON u.id = r.owner_id
       LEFT JOIN public.branches b ON b.repository_id = r.id AND b.name = 'main'
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Repository ${id} not found.` });
    }

    res.json({ repository: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRepositories,
  createRepository,
  getRepositoryById,
};