const db = require("../db");
const contextService = require("../services/contextService");

/**
 * Fetch all student records for a specific repository.
 */
async function getStudents(req, res, next) {
  try {
    const { repo_id } = req.query;

    if (!repo_id) {
      return res.status(400).json({ error: "Query parameter 'repo_id' is required." });
    }

    const result = await db.query(
      `SELECT * FROM public.students 
       WHERE repository_id = $1 
       ORDER BY id ASC;`,
      [repo_id]
    );

    res.json({
      repository_id: Number(repo_id),
      students: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Insert a new student row.
 * Runs inside a transaction with set_change_context so Revan's SQL trigger
 * automatically records the INSERT snapshot into pending_changes!
 */
async function createStudent(req, res, next) {
  try {
    const { repository_id, name, email, department } = req.body;

    if (!repository_id || !name || !email || !department) {
      return res.status(400).json({
        error: "Fields 'repository_id', 'name', 'email', and 'department' are required.",
      });
    }

    const newStudent = await db.withTransaction(async (client) => {
      // 1. Establish transaction-safe context for SQLVault triggers
      const { changeSetId } = await contextService.ensureChangeContext(
        client,
        repository_id
      );

      // 2. Perform the INSERT (the trigger intercepts this automatically)
      const insertRes = await client.query(
        `INSERT INTO public.students (repository_id, name, email, department)
         VALUES ($1, $2, $3, $4)
         RETURNING *;`,
        [repository_id, name.trim(), email.trim(), department.trim()]
      );

      return {
        student: insertRes.rows[0],
        change_set_id: changeSetId,
      };
    });

    res.status(201).json({
      message: "Student added. Change automatically tracked in staging.",
      ...newStudent,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing student row.
 * Runs inside a transaction with set_change_context so Revan's SQL trigger
 * automatically records the UPDATE diff (old_data vs new_data) into pending_changes!
 */
async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, department } = req.body;

    // Check if student exists to obtain repository_id
    const findRes = await db.query(
      "SELECT * FROM public.students WHERE id = $1",
      [id]
    );

    if (findRes.rows.length === 0) {
      return res.status(404).json({ error: `Student with ID ${id} not found.` });
    }

    const currentStudent = findRes.rows[0];
    const repositoryId = currentStudent.repository_id;

    const updated = await db.withTransaction(async (client) => {
      // 1. Set change context
      await contextService.ensureChangeContext(client, repositoryId);

      // 2. Perform UPDATE (trigger intercepts and stores old + new row data)
      const updateRes = await client.query(
        `UPDATE public.students 
         SET 
           name = COALESCE($1, name),
           email = COALESCE($2, email),
           department = COALESCE($3, department)
         WHERE id = $4
         RETURNING *;`,
        [
          name !== undefined ? name.trim() : null,
          email !== undefined ? email.trim() : null,
          department !== undefined ? department.trim() : null,
          id,
        ]
      );

      return updateRes.rows[0];
    });

    res.json({
      message: "Student updated. Diff automatically recorded in staging.",
      student: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a student row.
 * Trigger automatically logs the DELETE snapshot (old_data) into pending_changes!
 */
async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;

    const findRes = await db.query(
      "SELECT * FROM public.students WHERE id = $1",
      [id]
    );

    if (findRes.rows.length === 0) {
      return res.status(404).json({ error: `Student with ID ${id} not found.` });
    }

    const currentStudent = findRes.rows[0];
    const repositoryId = currentStudent.repository_id;

    const deleted = await db.withTransaction(async (client) => {
      // 1. Set change context
      await contextService.ensureChangeContext(client, repositoryId);

      // 2. Perform DELETE (trigger intercepts and stores old data)
      const delRes = await client.query(
        `DELETE FROM public.students WHERE id = $1 RETURNING *;`,
        [id]
      );

      return delRes.rows[0];
    });

    res.json({
      message: "Student deleted. Deletion snapshot tracked in staging.",
      student: deleted,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};