import pool from '../config/db.js';

// Create a new submission record
export const createSubmission = async ({
  assignment_id,
  student_id,
  file_name,
  file_path,
  file_size_kb,
  is_late,
}) => {
  const result = await pool.query(
    `INSERT INTO submissions
       (assignment_id, student_id, file_name, file_path, file_size_kb, is_late, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'submitted')
     RETURNING *`,
    [assignment_id, student_id, file_name, file_path, file_size_kb, is_late]
  );
  return result.rows[0];
};

// Update an existing submission — used for re-submission
// Updates file info, timestamp, is_late, and resets status to submitted
export const updateSubmissionFile = async ({
  id,
  file_name,
  file_path,
  file_size_kb,
  is_late,
}) => {
  const result = await pool.query(
    `UPDATE submissions
     SET file_name    = $1,
         file_path    = $2,
         file_size_kb = $3,
         is_late      = $4,
         submitted_at = NOW(),
         status       = 'submitted'
     WHERE id = $5
     RETURNING *`,
    [file_name, file_path, file_size_kb, is_late, id]
  );
  return result.rows[0];
};

// Find a submission by assignment + student — check if one already exists
export const findSubmission = async (assignment_id, student_id) => {
  const result = await pool.query(
    `SELECT * FROM submissions
     WHERE assignment_id = $1 AND student_id = $2`,
    [assignment_id, student_id]
  );
  return result.rows[0] || null;
};

// Get submission by its own ID — full joined info
export const getSubmissionById = async (id) => {
  const result = await pool.query(
    `SELECT s.id, s.file_name, s.file_path, s.file_size_kb,
            s.submitted_at, s.is_late, s.status,
            u.id   AS student_id,    u.full_name AS student_name,
            u.email AS student_email,
            a.id   AS assignment_id, a.title AS assignment_title,
            a.due_date, a.max_marks,
            c.id   AS course_id,     c.code AS course_code,
            c.name AS course_name,   c.instructor_id
     FROM submissions s
     JOIN users       u ON s.student_id    = u.id
     JOIN assignments a ON s.assignment_id = a.id
     JOIN courses     c ON a.course_id     = c.id
     WHERE s.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Get all submissions for a specific assignment — teacher/admin use this
export const getSubmissionsByAssignment = async (assignment_id) => {
  const result = await pool.query(
    `SELECT s.id, s.file_name, s.file_size_kb, s.submitted_at, s.is_late, s.status,
            u.id AS student_id, u.full_name AS student_name, u.email AS student_email
     FROM submissions s
     JOIN users u ON s.student_id = u.id
     WHERE s.assignment_id = $1
     ORDER BY s.submitted_at DESC`,
    [assignment_id]
  );
  return result.rows;
};

// Get all submissions by a student — student sees their own history
export const getSubmissionsByStudent = async (student_id) => {
  const result = await pool.query(
    `SELECT s.id, s.file_name, s.file_size_kb, s.submitted_at, s.is_late, s.status,
            a.id    AS assignment_id, a.title AS assignment_title, a.due_date,
            c.code  AS course_code,   c.name  AS course_name
     FROM submissions s
     JOIN assignments a ON s.assignment_id = a.id
     JOIN courses     c ON a.course_id     = c.id
     WHERE s.student_id = $1
     ORDER BY s.submitted_at DESC`,
    [student_id]
  );
  return result.rows;
};

// Get all submissions — admin only
export const getAllSubmissions = async () => {
  const result = await pool.query(
    `SELECT s.id, s.file_name, s.file_size_kb, s.submitted_at, s.is_late, s.status,
            u.id    AS student_id,    u.full_name AS student_name,
            a.id    AS assignment_id, a.title     AS assignment_title,
            c.code  AS course_code,   c.name      AS course_name
     FROM submissions s
     JOIN users       u ON s.student_id    = u.id
     JOIN assignments a ON s.assignment_id = a.id
     JOIN courses     c ON a.course_id     = c.id
     ORDER BY s.submitted_at DESC`
  );
  return result.rows;
};

// Update submission status — teacher/admin manually change status
export const updateSubmissionStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE submissions SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
};

// Delete submission — admin only, cascade removes evaluation
export const deleteSubmission = async (id) => {
  const result = await pool.query(
    `DELETE FROM submissions WHERE id = $1 RETURNING id, file_path`,
    [id]
  );
  return result.rows[0] || null;
};