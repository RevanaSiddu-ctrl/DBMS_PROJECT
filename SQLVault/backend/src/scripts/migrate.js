const fs = require("fs");
const path = require("path");
const db = require("../db");

const SQL_FILES = [
  "schema.sql",
  "constraints.sql",
  "indexes.sql",
  "students.sql",
  "functions/track_changes.sql",
  "triggers/track_insert.sql",
  "triggers/track_update.sql",
  "triggers/track_delete.sql",
];

async function runMigration() {
  console.log("\n🚀 Starting SQLVault Database Schema Migration to Supabase...");
  console.log("============================================================");

  const databaseDir = path.resolve(__dirname, "../../../database");

  for (const relativePath of SQL_FILES) {
    const fullPath = path.join(databaseDir, relativePath);
    console.log(`\n📄 Applying: ${relativePath}...`);

    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(fullPath, "utf-8");

    try {
      await db.query(sqlContent);
      console.log(`   ✅ Successfully applied ${relativePath}`);
    } catch (error) {
      console.error(`   ❌ Failed applying ${relativePath}`);
      console.error(`      Error: ${error.message}`);
      await db.pool.end();
      process.exit(1);
    }
  }

  console.log("\n============================================================");
  console.log("🎉 All schema, constraints, indexes, and triggers migrated!");
  console.log("============================================================\n");

  await db.pool.end();
}

runMigration();