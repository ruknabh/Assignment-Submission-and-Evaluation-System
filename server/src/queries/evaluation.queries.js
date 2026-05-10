import pool from '../config/db.js';

// Create evaluation record
export const createEvaluation = async ({
  submission_id,
  graded_by,
  marks_obtained,
  letter_grade,
  comment,
  plagiarism_score,
}) => {
  const result = await pool.query(
    `INSERT INTO evaluations
       (submission_id, graded_by, marks_obtained, letter_grade, comment, plagiarism_score)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [submission_id, graded_by, marks_obtained, letter_grade, comment || null, plagiarism_score]
  );
  return result.rows[0];
};

// Check if evaluation already exists for a submission
export const findEvaluationBySubmission = async (submission_id) => {
  const result = await pool.query(
    `SELECT * FROM evaluations WHERE submission_id = $1`,
    [submission_id]
  );
  return result.rows[0] || null;
};

// Get single evaluation by ID — full joined data for all roles
export const getEvaluationById = async (id) => {
  const result = await pool.query(
    `SELECT
       e.id, e.marks_obtained, e.letter_grade, e.comment,
       e.plagiarism_score, e.graded_at,
       grader.id        AS graded_by_id,
       grader.full_name AS graded_by_name,
       s.id             AS submission_id,
       s.file_name,
       s.is_late,
       s.status         AS submission_status,
       student.id       AS student_id,
       student.full_name AS student_name,
       student.email    AS student_email,
       a.id             AS assignment_id,
       a.title          AS assignment_title,
       a.max_marks,
       a.due_date,
       c.id             AS course_id,
       c.code           AS course_code,
       c.name           AS course_name,
       c.instructor_id
     FROM evaluations e
     JOIN submissions s   ON e.submission_id = s.id
     JOIN users student   ON s.student_id    = student.id
     JOIN users grader    ON e.graded_by     = grader.id
     JOIN assignments a   ON s.assignment_id = a.id
     JOIN courses c       ON a.course_id     = c.id
     WHERE e.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Get all evaluations for an assignment — teacher/admin
export const getEvaluationsByAssignment = async (assignment_id) => {
  const result = await pool.query(
    `SELECT
       e.id, e.marks_obtained, e.letter_grade,
       e.plagiarism_score, e.comment, e.graded_at,
       student.id        AS student_id,
       student.full_name AS student_name,
       student.email     AS student_email,
       s.id              AS submission_id,
       s.is_late,
       s.status          AS submission_status
     FROM evaluations e
     JOIN submissions s  ON e.submission_id = s.id
     JOIN users student  ON s.student_id    = student.id
     JOIN assignments a  ON s.assignment_id = a.id
     WHERE a.id = $1
     ORDER BY e.graded_at DESC`,
    [assignment_id]
  );
  return result.rows;
};

// Get all evaluations for a student — student sees their own results
export const getEvaluationsByStudent = async (student_id) => {
  const result = await pool.query(
    `SELECT
       e.id, e.marks_obtained, e.letter_grade,
       e.plagiarism_score, e.comment, e.graded_at,
       a.id    AS assignment_id,
       a.title AS assignment_title,
       a.max_marks,
       c.code  AS course_code,
       c.name  AS course_name,
       s.id    AS submission_id,
       s.is_late,
       s.status AS submission_status
     FROM evaluations e
     JOIN submissions s ON e.submission_id = s.id
     JOIN assignments a ON s.assignment_id = a.id
     JOIN courses c     ON a.course_id     = c.id
     WHERE s.student_id = $1
       AND s.status IN ('evaluated', 'returned')
     ORDER BY e.graded_at DESC`,
    [student_id]
  );
  return result.rows;
};

// Get all evaluations — admin only
export const getAllEvaluations = async () => {
  const result = await pool.query(
    `SELECT
       e.id, e.marks_obtained, e.letter_grade,
       e.plagiarism_score, e.graded_at,
       student.id        AS student_id,
       student.full_name AS student_name,
       grader.full_name  AS graded_by_name,
       a.title           AS assignment_title,
       a.max_marks,
       c.code            AS course_code,
       c.name            AS course_name,
       s.id              AS submission_id,
       s.status          AS submission_status
     FROM evaluations e
     JOIN submissions s  ON e.submission_id = s.id
     JOIN users student  ON s.student_id    = student.id
     JOIN users grader   ON e.graded_by     = grader.id
     JOIN assignments a  ON s.assignment_id = a.id
     JOIN courses c      ON a.course_id     = c.id
     ORDER BY e.graded_at DESC`
  );
  return result.rows;
};

// Partial update — only updates provided fields
export const updateEvaluation = async (id, fields) => {
  const keys   = Object.keys(fields);
  const values = Object.values(fields);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const result = await pool.query(
    `UPDATE evaluations
     SET ${setClause}
     WHERE id = $${keys.length + 1}
     RETURNING *`,
    [...values, id]
  );
  return result.rows[0] || null;
};

// Delete evaluation — admin only
// Returns submission_id so caller can revert submission status
export const deleteEvaluation = async (id) => {
  const result = await pool.query(
    `DELETE FROM evaluations WHERE id = $1
     RETURNING id, submission_id`,
    [id]
  );
  return result.rows[0] || null;
};

// Update submission status — used after evaluate, return, delete
export const updateSubmissionStatus = async (submission_id, status) => {
  await pool.query(
    `UPDATE submissions SET status = $1 WHERE id = $2`,
    [status, submission_id]
  );
};