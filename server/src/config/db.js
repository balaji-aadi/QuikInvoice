import mysql from 'mysql2/promise';
import env from './env.js';

const activeDbName = env.NODE_ENV === 'test' ? env.DB_NAME_TEST : env.DB_NAME;

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: activeDbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  decimalNumbers: true, // Parse MySQL DECIMAL as JavaScript numbers where precision allows
});

/**
 * Execute parameterized query
 * @param {string} sql - SQL statement with '?' placeholders
 * @param {Array} params - Array of parameter values
 * @returns {Promise<[Array, Object]>}
 */
export async function query(sql, params = []) {
  return pool.query(sql, params);
}

/**
 * Acquire a connection from the pool
 * @returns {Promise<mysql.PoolConnection>}
 */
export async function getConnection() {
  return pool.getConnection();
}

/**
 * Execute work inside an atomic database transaction
 * Automatically begins, commits, or rolls back on error.
 * @param {Function} callback - async (connection) => result
 * @returns {Promise<any>}
 */
export async function withTransaction(callback) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Verify database connection health
 */
export async function checkDbConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 as is_alive, DATABASE() as current_db');
    return {
      connected: true,
      database: rows[0]?.current_db || activeDbName,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
}

/**
 * Close database pool (useful in test teardown)
 */
export async function closePool() {
  await pool.end();
}

export default {
  pool,
  query,
  getConnection,
  withTransaction,
  checkDbConnection,
  closePool,
};
