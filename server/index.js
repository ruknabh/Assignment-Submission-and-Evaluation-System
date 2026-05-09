import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import pool from './src/config/db.js';
import initDb from './src/config/initDb.js';

const PORT = process.env.PORT || 5000;

pool.connect()
  .then( async (client) => {
    client.release();
    console.log('PostgreSQL connected successfully');

    await initDb();

    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  });