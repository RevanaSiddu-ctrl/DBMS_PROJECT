const db = require("../db");
const contextService = require("../services/contextService");

/**
 * Universal raw SQL query runner for the SQL Editor.
 * If query contains mutations (INSERT, UPDATE, DELETE), runs within a transaction
 * and sets SQLVault change context so Revan's triggers capture the row delta!
 */
async function executeQuery(req, res, next) {
  try {
    const { query: sqlText, repository_id = 1 } = req.body;

    if (!sqlText || typeof sqlText !== "string" || sqlText.trim() === "") {
      return res.status(400).json({ error: "Query text cannot be empty." });
    }

    const trimmed = sqlText.trim();
    const isMutation = /^\s*(INSERT|UPDATE|DELETE)\s+/i.test(trimmed);
    const startTime = performance.now();

    let result;

    if (isMutation) {
      result = await db.withTransaction(async (client) => {
        // Establish transaction-safe context for Revan's SQL triggers
        await contextService.ensureChangeContext(client, repository_id);
        return await client.query(trimmed);
      });
    } else {
      result = await db.query(trimmed);
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(3);
    const lastResult = Array.isArray(result) ? result[result.length - 1] : result;

    res.json({
      command: lastResult.command || "SELECT",
      rowCount: lastResult.rowCount || (lastResult.rows ? lastResult.rows.length : 0),
      rows: lastResult.rows || [],
      fields: (lastResult.fields || []).map((f) => f.name),
      duration: `${duration}s`,
      is_mutation: isMutation,
    });
  } catch (error) {
    res.status(400).json({
      error: "SQL Execution Error",
      message: error.message,
      detail: error.detail || error.hint || null,
    });
  }
}

module.exports = {
  executeQuery,
};