import bcrypt from 'bcryptjs';
import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  const email    = 'admin@test.com';
  const username = 'admin_user';
  const password = 'admin123';
  const fullName = 'Admin User';

  // Generate hash using the same bcryptjs used in auth — guaranteed to match
  const password_hash = await bcrypt.hash(password, 10);

  // Delete existing admin with this email if present — clean re-seed
  await pool.query(`DELETE FROM users WHERE email = $1`, [email]);

  const result = await pool.query(
    `INSERT INTO users (full_name, email, username, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin')
     RETURNING id, full_name, email, username, role`,
    [fullName, email, username, password_hash]
  );

  console.log('Admin seeded successfully:');
  console.log(result.rows[0]);
  console.log(`\nLogin with:`);
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);

  await pool.end();
};

seedAdmin().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});