const db = require("../db");

async function testConnection() {
  console.log("\n🔍 Testing Supabase PostgreSQL Connection...");
  console.log("--------------------------------------------------");

  try {
    const timeRes = await db.query("SELECT NOW() AS current_time, current_database() AS db_name;");
    console.log("✅ Successfully connected to Supabase!");
    console.log("   Database Name:", timeRes.rows[0].db_name);
    console.log("   Current Timestamp:", timeRes.rows[0].current_time);

    console.log("\n🔍 Checking for SQLVault Schema Tables...");
    console.log("--------------------------------------------------");
    const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'repositories', 'branches', 'commits', 'change_sets', 'pending_changes', 'record_versions', 'students')
      ORDER BY table_name;
    `);

    const expected = [
      "users",
      "repositories",
      "branches",
      "commits",
      "change_sets",
      "pending_changes",
      "record_versions",
      "students",
    ];

    const found = tablesRes.rows.map((r) => r.table_name);

    expected.forEach((tbl) => {
      if (found.includes(tbl)) {
        console.log(`   [✓] ${tbl}`);
      } else {
        console.log(`   [ ] ${tbl} (Not yet created in Supabase)`);
      }
    });

    console.log("\n--------------------------------------------------");
    if (found.length === expected.length) {
      console.log("🎉 All SQLVault database tables are present in Supabase!");
    } else {
      console.log(`ℹ️  Found ${found.length}/${expected.length} tables.`);
      console.log("   To set up missing tables, run Revan's schema.sql in the Supabase SQL Editor.");
    }
  } catch (error) {
    console.error("❌ Connection failed!");
    console.error("   Error:", error.message);
  } finally {
    await db.pool.end();
    console.log("\nConnection closed.\n");
  }
}

testConnection();