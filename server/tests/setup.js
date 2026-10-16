import { runMigrations } from '../src/db/migrate.js';
import { pool, query, closePool } from '../src/config/db.js';
import env from '../src/config/env.js';

// Safety Guard: Ensure tests ONLY run against the dedicated test database!
if (env.NODE_ENV !== 'test' || !env.DB_NAME_TEST.includes('test')) {
  throw new Error(`CRITICAL TEST SAFETY ERROR: Attempted to run tests against non-test database: ${env.DB_NAME_TEST}`);
}

beforeAll(async () => {
  // Ensure test database migrations are applied
  await runMigrations(env.DB_NAME_TEST);
});

beforeEach(async () => {
  // Clean test tables in reverse dependency order to ensure isolation without FK conflicts
  await query('DELETE FROM invoice_payments');
  await query('DELETE FROM invoice_items');
  await query('DELETE FROM invoices');
  await query('DELETE FROM clients');
  await query('DELETE FROM users');
});

afterAll(async () => {
  // Drain connection pool
  await closePool();
});
