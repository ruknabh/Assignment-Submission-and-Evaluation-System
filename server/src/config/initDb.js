// Initialize Database
import pool from './db.js';
import { readFileSync } from 'fs';                       //Used to read files(from Node.js filesystem module)
import { fileURLToPath } from 'url';                     //Path Utilities needed because type-module
import { dirname, join } from 'path';


const __filename = fileURLToPath(import.meta.url);     //import.meta.url gives current file URL & fileURLToPath() Converts URL → actual filesystem path.      
const __dirname  = dirname(__filename);                //dirname() extracts path


const initDb = async () => {                            //Actual asyn funtion, because database operations are asynchronous
  try {                                      
    const schema = readFileSync(                        //Safely creates file path
      join(__dirname, '../queries/schema.sql'),         //Read file as text (Without this raw binary)
      'utf8'
    );

    await pool.query(schema);                           //Executes SQL (sends the ENTIRE SQL schema to PostgreSQL)

    console.log('Database schema ready');

  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};


export default initDb;