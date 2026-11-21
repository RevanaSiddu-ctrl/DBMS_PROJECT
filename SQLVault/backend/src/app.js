const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

// Standard Middleware
app.use(cors());
app.use(express.json());

// API Root Info
app.get("/api", (req, res) => {
  res.json({
    project: "SQLVault",
    version: "1.0.0",
    description: "Database Version Control Backend API",
    status: "online",
  });
});

// Database Healthcheck Endpoint
app.get("/api/health", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        NOW() AS server_time,
        current_database() AS database_name,
        version() AS pg_version
    `);

    // Check which SQLVault tables exist in Supabase
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'repositories', 'branches', 'commits', 'change_sets', 'pending_changes', 'record_versions', 'students');
    `);

    const existingTables = tablesResult.rows.map((row) => row.table_name);

    res.json({
      status: "healthy",
      database: "connected",
      details: result.rows[0],
      sqlvault_tables_found: existingTables,
      schema_status:
        existingTables.length >= 7
          ? "complete"
          : `${existingTables.length}/8 tables detected`,
    });
  } catch (error) {
    console.error("Database healthcheck failed:", error);
    res.status(500).json({
      status: "error",
      database: "connection_failed",
      error: error.message,
    });
  }
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

module.exports = app;