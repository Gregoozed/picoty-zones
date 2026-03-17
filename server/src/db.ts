import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS communes (
      code_insee VARCHAR(10) PRIMARY KEY,
      nom VARCHAR(255),
      code_postal VARCHAR(10),
      departement VARCHAR(5),
      pp VARCHAR(255),
      adblue VARCHAR(255),
      pellets_liv VARCHAR(255),
      pellets_vrac VARCHAR(255),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✓ Table communes prête');
}

export default pool;
