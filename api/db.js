/**
 * Database connection module
 * Creates and exports a PostgreSQL connection pool for database operations.
 * Uses environment variables for configuration.
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE
});

/**
 * Executes a SQL query with optional parameters
 * @param {string} text - The SQL query text
 * @param {Array} params - Optional parameters for the query
 * @returns {Promise} A promise that resolves with the query result
 */
export async function query(text, params) {
  return pool.query(text, params);
}

export default pool;
