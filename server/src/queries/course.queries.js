import pool from '../config/db.js';

// Create a new course — instructor_id comes from logged in teacher
export const createCourse = async ({ code, name, semester, section, instructor_id }) => {
  const result = await pool.query(
    `INSERT INTO courses (code, name, semester, section, instructor_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, code, name, semester, section, instructor_id, created_at`,
    [code, name, semester, section || null, instructor_id]
  );
  return result.rows[0];
};

// Get all courses — admin only
export const getAllCourses = async () => {
  const result = await pool.query(
    `SELECT c.id, c.code, c.name, c.semester, c.section, c.created_at,
            u.id AS instructor_id, u.full_name AS instructor_name, u.email AS instructor_email
     FROM courses c
     JOIN users u ON c.instructor_id = u.id
     ORDER BY c.created_at DESC`
  );
  return result.rows;
};

// Get courses owned by a specific teacher
export const getCoursesByInstructor = async (instructor_id) => {
  const result = await pool.query(
    `SELECT c.id, c.code, c.name, c.semester, c.section, c.created_at,
            u.id AS instructor_id, u.full_name AS instructor_name, u.email AS instructor_email
     FROM courses c
     JOIN users u ON c.instructor_id = u.id
     WHERE c.instructor_id = $1
     ORDER BY c.created_at DESC`,
    [instructor_id]
  );
  return result.rows;
};

// Get courses a student is actively enrolled in
export const getCoursesByStudent = async (student_id) => {
  const result = await pool.query(
    `SELECT c.id, c.code, c.name, c.semester, c.section, c.created_at,
            u.id AS instructor_id, u.full_name AS instructor_name, u.email AS instructor_email
     FROM courses c
     JOIN users u ON c.instructor_id = u.id
     JOIN enrollments e ON e.course_id = c.id
     WHERE e.student_id = $1 AND e.status = 'active'
     ORDER BY c.created_at DESC`,
    [student_id]
  );
  return result.rows;
};

// Get a single course by ID with instructor info
export const getCourseById = async (id) => {
  const result = await pool.query(
    `SELECT c.id, c.code, c.name, c.semester, c.section, c.created_at,
            u.id AS instructor_id, u.full_name AS instructor_name, u.email AS instructor_email
     FROM courses c
     JOIN users u ON c.instructor_id = u.id
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Update course — only updates fields that are provided
export const updateCourse = async (id, fields) => {
  // Build dynamic SET clause from only the provided fields
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  // e.g. "code = $1, name = $2"
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const result = await pool.query(
    `UPDATE courses
     SET ${setClause}
     WHERE id = $${keys.length + 1}
     RETURNING id, code, name, semester, section, instructor_id, created_at`,
    [...values, id]
  );
  return result.rows[0] || null;
};

// Delete a course by ID — cascade handles enrollments and assignments
export const deleteCourse = async (id) => {
  const result = await pool.query(
    `DELETE FROM courses WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
};

// Check if a student is actively enrolled in a course
export const checkEnrollment = async (student_id, course_id) => {
  const result = await pool.query(
    `SELECT id FROM enrollments
     WHERE student_id = $1 AND course_id = $2 AND status = 'active'`,
    [student_id, course_id]
  );
  return result.rows[0] || null;
};

// Search courses by code — used by student join course feature
// Returns all courses matching the code (case-insensitive)
export const searchCoursesByCode = async (code) => {
  const result = await pool.query(
    `SELECT c.id, c.code, c.name, c.semester, c.section, c.created_at,
            u.id AS instructor_id, u.full_name AS instructor_name, u.email AS instructor_email
     FROM courses c
     JOIN users u ON c.instructor_id = u.id
     WHERE UPPER(c.code) = UPPER($1)
     ORDER BY c.created_at DESC`,
    [code]
  );
  return result.rows;
};