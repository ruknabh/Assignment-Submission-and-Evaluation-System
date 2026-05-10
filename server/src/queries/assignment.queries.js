import pool from '../config/db.js';

// Create a new assignment inside a course
export const createAssignment = async ({
  course_id,
  created_by,
  title,
  description,
  max_marks,
  due_date,
  allowed_file_types,
  max_file_size_mb,
}) => {
  const result = await pool.query(
    `INSERT INTO assignments
       (course_id, created_by, title, description, max_marks, due_date, allowed_file_types, max_file_size_mb)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      course_id,
      created_by,
      title,
      description || null,
      max_marks,
      due_date,
      JSON.stringify(allowed_file_types),
      max_file_size_mb,
    ]
  );
  return result.rows[0];
};

// Get all assignments for a specific course
// Used by teacher (own course) and admin
export const getAssignmentsByCourse = async (course_id) => {
  const result = await pool.query(
    `SELECT a.id, a.title, a.description, a.max_marks, a.due_date,
            a.allowed_file_types, a.max_file_size_mb, a.created_at,
            u.id AS created_by_id, u.full_name AS created_by_name,
            c.id AS course_id, c.code AS course_code, c.name AS course_name
     FROM assignments a
     JOIN users   u ON a.created_by  = u.id
     JOIN courses c ON a.course_id   = c.id
     WHERE a.course_id = $1
     ORDER BY a.due_date ASC`,
    [course_id]
  );
  return result.rows;
};

// Get all assignments for courses a student is actively enrolled in
export const getAssignmentsForStudent = async (student_id) => {
  const result = await pool.query(
    `SELECT a.id, a.title, a.description, a.max_marks, a.due_date,
            a.allowed_file_types, a.max_file_size_mb, a.created_at,
            c.id AS course_id, c.code AS course_code, c.name AS course_name,
            u.full_name AS created_by_name
     FROM assignments a
     JOIN courses     c  ON a.course_id   = c.id
     JOIN enrollments e  ON e.course_id   = c.id
     JOIN users       u  ON a.created_by  = u.id
     WHERE e.student_id = $1
       AND e.status = 'active'
     ORDER BY a.due_date ASC`,
    [student_id]
  );
  return result.rows;
};

// Get all assignments across all courses — admin only
export const getAllAssignments = async () => {
  const result = await pool.query(
    `SELECT a.id, a.title, a.description, a.max_marks, a.due_date,
            a.allowed_file_types, a.max_file_size_mb, a.created_at,
            c.id AS course_id, c.code AS course_code, c.name AS course_name,
            u.id AS created_by_id, u.full_name AS created_by_name
     FROM assignments a
     JOIN courses c ON a.course_id  = c.id
     JOIN users   u ON a.created_by = u.id
     ORDER BY a.created_at DESC`
  );
  return result.rows;
};

// Get a single assignment by ID with full joined info
export const getAssignmentById = async (id) => {
  const result = await pool.query(
    `SELECT a.id, a.title, a.description, a.max_marks, a.due_date,
            a.allowed_file_types, a.max_file_size_mb, a.created_at,
            a.created_by,
            c.id AS course_id, c.code AS course_code, c.name AS course_name,
            c.instructor_id,
            u.full_name AS created_by_name
     FROM assignments a
     JOIN courses c ON a.course_id  = c.id
     JOIN users   u ON a.created_by = u.id
     WHERE a.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Update assignment — only updates fields that are provided
export const updateAssignment = async (id, fields) => {
  const keys   = Object.keys(fields);
  const values = Object.values(fields);

  // Wrap allowed_file_types array as JSON string for JSONB column
  const processedValues = values.map((val, i) =>
    keys[i] === 'allowed_file_types' ? JSON.stringify(val) : val
  );

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const result = await pool.query(
    `UPDATE assignments
     SET ${setClause}
     WHERE id = $${keys.length + 1}
     RETURNING *`,
    [...processedValues, id]
  );
  return result.rows[0] || null;
};

// Delete an assignment — cascade removes all submissions
export const deleteAssignment = async (id) => {
  const result = await pool.query(
    `DELETE FROM assignments WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
};

// Check if a student is actively enrolled in the course this assignment belongs to
// Used to gate student access to individual assignments
export const checkStudentAccessToAssignment = async (student_id, assignment_id) => {
  const result = await pool.query(
    `SELECT e.id
     FROM enrollments e
     JOIN assignments a ON a.course_id = e.course_id
     WHERE a.id = $1
       AND e.student_id = $2
       AND e.status = 'active'`,
    [assignment_id, student_id]
  );
  return result.rows[0] || null;
};