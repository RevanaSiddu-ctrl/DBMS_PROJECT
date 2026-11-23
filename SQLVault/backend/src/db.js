const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  console.error("FATAL: DATABASE_URL is not set in backend/.env");
  process.exit(1);
}

// Strip any sslmode query parameter so pg-connection-string does not override SSL options
const connectionString = rawConnectionString.replace(/[\?&]sslmode=[^&]+/, "");

// Supabase pooler requires SSL. rejectUnauthorized: false prevents self-signed cert chain errors
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
});

/**
 * Execute a standard SQL query.
 * @param {string} text - SQL query text
 * @param {Array} params - Parameterized query arguments
 */
const query = (text, params) => pool.query(text, params);

/**
 * Acquire a client from the pool for multi-statement transactions.
 */
const getClient = () => pool.connect();

/**
 * Set transaction-local SQLVault context (repository and change set).
 * Must be executed within a transaction on the acquired client before modifying tracked tables.
 * @param {import('pg').PoolClient} client
 * @param {number|string} repositoryId
 * @param {number|string} changeSetId
 */
const setChangeContext = async (client, repositoryId, changeSetId) => {
  await client.query("SELECT public.set_change_context($1, $2)", [
    repositoryId,
    changeSetId,
  ]);
};

/**
 * Run a callback inside an atomic transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 * @param {Function} callback - Async function receiving the transaction client
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  getClient,
  setChangeContext,
  withTransaction,
};