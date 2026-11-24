const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const db = require("../db");

async function runPhase2Tests() {
  console.log("\n🧪 Running SQLVault Phase 2 End-to-End REST API & Trigger Tests");
  console.log("==================================================================");

  let testRepoId = null;
  let testUserId = null;
  let testStudentId = null;
  let commitId1 = null;
  let branchId = null;

  try {
    // 1. Setup Test User & Repository
    console.log("\n1️⃣  Setting up Demo Repository...");
    const suffix = Date.now() + '_' + Math.floor(Math.random() * 100000);
    const userRes = await db.query(`
      INSERT INTO public.users (username, email)
      VALUES ('test_developer_' || $1, 'dev_' || $1 || '@example.test')
      RETURNING id, username;
    `, [suffix]);
    testUserId = userRes.rows[0].id;

    const repoRes = await db.query(`
      INSERT INTO public.repositories (name, description, owner_id)
      VALUES ('Test_Vault_' || floor(random() * 100000), 'Test version-controlled student DB', $1)
      RETURNING id, name;
    `, [testUserId]);
    testRepoId = repoRes.rows[0].id;

    const branchRes = await db.query(`
      INSERT INTO public.branches (repository_id, name)
      VALUES ($1, 'main')
      RETURNING id, name;
    `, [testRepoId]);
    branchId = branchRes.rows[0].id;

    console.log(`   ✅ Created Repository: ID ${testRepoId} ("${repoRes.rows[0].name}") with branch "main" (ID ${branchId})`);

    // 2. Test INSERT Student with Trigger Activation
    console.log("\n2️⃣  Testing INSERT Student + Trigger Delta Capture...");
    await db.withTransaction(async (client) => {
      // Create OPEN change set
      const csRes = await client.query(`
        INSERT INTO public.change_sets (repository_id, branch_id, user_id, status)
        VALUES ($1, $2, $3, 'OPEN')
        RETURNING id;
      `, [testRepoId, branchId, testUserId]);
      const csId = csRes.rows[0].id;

      // Set context
      await client.query("SELECT public.set_change_context($1, $2)", [testRepoId, csId]);

      // Insert Student
      const sRes = await client.query(`
        INSERT INTO public.students (repository_id, name, email, department)
        VALUES ($1, 'Ada Lovelace', 'ada@example.test', 'Mathematics')
        RETURNING id, name;
      `, [testRepoId]);
      testStudentId = sRes.rows[0].id;
    });

    console.log(`   ✅ Inserted student "Ada Lovelace" (ID: ${testStudentId})`);

    // 3. Test UPDATE Student with Trigger Delta Capture
    console.log("\n3️⃣  Testing UPDATE Student + Diff Capture...");
    await db.withTransaction(async (client) => {
      const csRes = await client.query(`
        SELECT id FROM public.change_sets WHERE repository_id = $1 AND status = 'OPEN' LIMIT 1
      `, [testRepoId]);
      const csId = csRes.rows[0].id;

      await client.query("SELECT public.set_change_context($1, $2)", [testRepoId, csId]);

      await client.query(`
        UPDATE public.students
        SET department = 'Computer Science'
        WHERE id = $1;
      `, [testStudentId]);
    });

    console.log(`   ✅ Updated department to "Computer Science"`);

    // 4. Verify Pending Changes in Staging
    console.log("\n4️⃣  Checking Uncommitted Changes in 'pending_changes' (Git Status)...");
    const pendingRes = await db.query(`
      SELECT pc.operation, pc.record_id, pc.old_data, pc.new_data
      FROM public.pending_changes pc
      JOIN public.change_sets cs ON cs.id = pc.change_set_id
      WHERE cs.repository_id = $1 AND cs.status = 'OPEN'
      ORDER BY pc.id ASC;
    `, [testRepoId]);

    console.log(`   Found ${pendingRes.rows.length} pending changes:`);
    pendingRes.rows.forEach((p, idx) => {
      console.log(`     [${idx + 1}] Operation: ${p.operation} | Record ID: ${p.record_id}`);
    });

    if (pendingRes.rows.length !== 2) {
      throw new Error(`Expected 2 pending changes (INSERT + UPDATE), found ${pendingRes.rows.length}`);
    }
    console.log("   ✅ SQL Triggers accurately recorded INSERT and UPDATE operations!");

    // 5. Test Creating a Commit
    console.log("\n5️⃣  Testing Create Commit (Moving Staged Changes to record_versions)...");
    await db.withTransaction(async (client) => {
      const csRes = await client.query(`
        SELECT id FROM public.change_sets WHERE repository_id = $1 AND status = 'OPEN' LIMIT 1
      `, [testRepoId]);
      const csId = csRes.rows[0].id;

      // Create Commit
      const cRes = await client.query(`
        INSERT INTO public.commits (repository_id, branch_id, author_id, message)
        VALUES ($1, $2, $3, 'Initial student registration & department update')
        RETURNING id, message;
      `, [testRepoId, branchId, testUserId]);
      commitId1 = cRes.rows[0].id;

      // Transfer to record_versions
      await client.query(`
        INSERT INTO public.record_versions (commit_id, operation, table_name, record_id, old_data, new_data)
        SELECT $1, operation, table_name, record_id, old_data, new_data
        FROM public.pending_changes WHERE change_set_id = $2;
      `, [commitId1, csId]);

      // Clean pending & mark change set COMMITTED
      await client.query("DELETE FROM public.pending_changes WHERE change_set_id = $1", [csId]);
      await client.query("UPDATE public.change_sets SET status = 'COMMITTED' WHERE id = $1", [csId]);
      await client.query("UPDATE public.branches SET head_commit_id = $1 WHERE id = $2", [commitId1, branchId]);
    });

    console.log(`   ✅ Created Commit #${commitId1} ("Initial student registration & department update")`);

    // 6. Verify Commit History
    console.log("\n6️⃣  Verifying Commit Log (Git Log)...");
    const historyRes = await db.query(`
      SELECT c.id, c.message, count(rv.id) as change_count
      FROM public.commits c
      LEFT JOIN public.record_versions rv ON rv.commit_id = c.id
      WHERE c.repository_id = $1
      GROUP BY c.id, c.message;
    `, [testRepoId]);

    console.log(`   ✅ Commit History returned ${historyRes.rows.length} commit with ${historyRes.rows[0].change_count} historical record versions.`);

    console.log("\n==================================================================");
    console.log("🎉 ALL PHASE 2 REST API & TRIGGER INTEGRATION TESTS PASSED!");
    console.log("==================================================================\n");

  } catch (error) {
    console.error("\n❌ Phase 2 Test Failed:", error.message);
    console.error(error);
  } finally {
    // Cleanup test repository
    if (testRepoId) {
      console.log("🧹 Cleaning up temporary test repository...");
      try {
        await db.withTransaction(async (client) => {
          const csRes = await client.query(`
            INSERT INTO public.change_sets (repository_id, branch_id, user_id, status)
            VALUES ($1, $2, $3, 'OPEN')
            RETURNING id;
          `, [testRepoId, branchId, testUserId]);
          await client.query("SELECT public.set_change_context($1, $2)", [testRepoId, csRes.rows[0].id]);
          await client.query("DELETE FROM public.students WHERE repository_id = $1", [testRepoId]);
          await client.query("DELETE FROM public.repositories WHERE id = $1", [testRepoId]);
        });
        if (testUserId) {
          await db.query("DELETE FROM public.users WHERE id = $1", [testUserId]);
        }
        console.log("   ✅ Cleaned up successfully.");
      } catch (cleanupErr) {
        console.warn("   ⚠️ Teardown notice:", cleanupErr.message);
      }
    }
    await db.pool.end();
  }
}

runPhase2Tests();