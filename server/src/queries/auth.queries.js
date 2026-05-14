import pool from '../config/db.js';

// Find a user by email — used during login
// Returns full row including password_hash for bcrypt comparison
export const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, full_name, email, username, password_hash, role, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

// Find a user by username — used to check duplicate on register
export const findUserByUsername = async (username) => {
  const result = await pool.query(
    `SELECT id FROM users WHERE username = $1`,
    [username]
  );
  return result.rows[0] || null;
};

// Create a new user — returns the created user without password_hash
export const createUser = async ({ full_name, email, username, password_hash, role }) => {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, username, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, full_name, email, username, role, created_at`,
    [full_name, email, username, password_hash, role]
  );

// Get all users — admin only, used for enrollment management UI
export const getAllUsers = async () => {
  const result = await pool.query(
    `SELECT id, full_name, email, username, role, created_at
     FROM users
     ORDER BY created_at DESC`
  );
  return result.rows;
};

// Get all students — admin uses this to pick who to enroll
export const getAllStudents = async () => {
  const result = await pool.query(
    `SELECT id, full_name, email, username, created_at
     FROM users
     WHERE role = 'student'
     ORDER BY full_name ASC`
  );
  return result.rows;
};

  return result.rows[0];
};