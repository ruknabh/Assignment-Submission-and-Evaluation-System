import pool from '../config/db.js';

// Create enrollment with a given status
// Used for both student requests (pending) and admin direct enrollments (active)
export const createEnrollment = async (student_id, course_id, status = 'active') => {
  const result = await pool.query(
    `INSERT INTO enrollments (student_id, course_id, status)
     VALUES ($1, $2, $3)
     RETURNING id, student_id, course_id, status, enrolled_at`,
    [student_id, course_id, status]
  );
  return result.rows[0];
};

// Find enrollment by student + course — regardless of status
// Used to prevent duplicate requests
export const findEnrollment = async (student_id, course_id) => {
  const result = await pool.query(
    `SELECT id, student_id, course_id, status, enrolled_at
     FROM enrollments
     WHERE student_id = $1 AND course_id = $2`,
    [student_id, course_id]
  );
  return result.rows[0] || null;
};

// Get single enrollment by ID with full joined info
export const findEnrollmentById = async (id) => {
  const result = await pool.query(
    `SELECT e.id, e.status, e.enrolled_at,
            u.id  AS student_id,    u.full_name AS student_name,
            u.email AS student_email,
            c.id  AS course_id,     c.code AS course_code,
            c.name AS course_name,  c.instructor_id
     FROM enrollments e
     JOIN users   u ON e.student_id = u.id
     JOIN courses c ON e.course_id  = c.id
     WHERE e.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Get all enrollments for a course — teacher uses this to see requests + active students
export const getEnrollmentsByCourse = async (course_id) => {
  const result = await pool.query(
    `SELECT e.id, e.status, e.enrolled_at,
            u.id AS student_id, u.full_name AS student_name, u.email AS student_email
     FROM enrollments e
     JOIN users u ON e.student_id = u.id
     WHERE e.course_id = $1
     ORDER BY
       CASE e.status WHEN 'pending' THEN 1 WHEN 'active' THEN 2 ELSE 3 END,
       e.enrolled_at DESC`,
    [course_id]
  );
  return result.rows;
};

// Get enrollments for a course filtered by status — e.g. only pending requests
export const getEnrollmentsByCourseAndStatus = async (course_id, status) => {
  const result = await pool.query(
    `SELECT e.id, e.status, e.enrolled_at,
            u.id AS student_id, u.full_name AS student_name, u.email AS student_email
     FROM enrollments e
     JOIN users u ON e.student_id = u.id
     WHERE e.course_id = $1 AND e.status = $2
     ORDER BY e.enrolled_at DESC`,
    [course_id, status]
  );
  return result.rows;
};

// Get all enrollments for a student — student sees their own requests + active courses
export const getEnrollmentsByStudent = async (student_id) => {
  const result = await pool.query(
    `SELECT e.id, e.status, e.enrolled_at,
            c.id AS course_id, c.code AS course_code,
            c.name AS course_name, c.semester, c.section,
            u.full_name AS instructor_name
     FROM enrollments e
     JOIN courses c ON e.course_id  = c.id
     JOIN users   u ON c.instructor_id = u.id
     WHERE e.student_id = $1
     ORDER BY e.enrolled_at DESC`,
    [student_id]
  );
  return result.rows;
};

// Get all enrollments — admin only
export const getAllEnrollments = async () => {
  const result = await pool.query(
    `SELECT e.id, e.status, e.enrolled_at,
            u.id  AS student_id,  u.full_name AS student_name,
            u.email AS student_email,
            c.id  AS course_id,   c.code AS course_code,
            c.name AS course_name, c.instructor_id
     FROM enrollments e
     JOIN users   u ON e.student_id = u.id
     JOIN courses c ON e.course_id  = c.id
     ORDER BY e.enrolled_at DESC`
  );
  return result.rows;
};

// Update enrollment status by ID
export const updateEnrollmentStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE enrollments
     SET status = $1
     WHERE id = $2
     RETURNING id, student_id, course_id, status, enrolled_at`,
    [status, id]
  );
  return result.rows[0] || null;
};

// Re-enroll — reset a rejected/withdrawn/completed enrollment back to pending
// Student uses this to re-request after being rejected or withdrawn
export const resetEnrollmentToPending = async (student_id, course_id) => {
  const result = await pool.query(
    `UPDATE enrollments
     SET status = 'pending', enrolled_at = NOW()
     WHERE student_id = $1 AND course_id = $2
     RETURNING id, student_id, course_id, status, enrolled_at`,
    [student_id, course_id]
  );
  return result.rows[0];
};

// Admin re-enroll — directly set back to active
export const reEnrollDirect = async (student_id, course_id) => {
  const result = await pool.query(
    `UPDATE enrollments
     SET status = 'active', enrolled_at = NOW()
     WHERE student_id = $1 AND course_id = $2
     RETURNING id, student_id, course_id, status, enrolled_at`,
    [student_id, course_id]
  );
  return result.rows[0];
};

// Hard delete — admin only
export const deleteEnrollment = async (id) => {
  const result = await pool.query(
    `DELETE FROM enrollments WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
};

// Verify user exists and is a student
export const findStudentById = async (id) => {
  const result = await pool.query(
    `SELECT id, full_name, email, role FROM users WHERE id = $1 AND role = 'student'`,
    [id]
  );
  return result.rows[0] || null;
};