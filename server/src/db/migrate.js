import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import env from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Execute all pending database migrations against the target database
 * @param {string} [overrideDbName] - Optional database name override
 */
export async function runMigrations(overrideDbName) {
  const targetDb = overrideDbName || (env.NODE_ENV === 'test' ? env.DB_NAME_TEST : env.DB_NAME);

  console.log(`\n🚀 [MIGRATIONS] Starting database migrations on: ${targetDb}`);

  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: targetDb,
    multipleStatements: true,
  });

  try {
    // 1. Ensure schema_migrations table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Fetch already applied migrations
    const [rows] = await connection.query('SELECT migration_name FROM schema_migrations');
    const appliedSet = new Set(rows.map((r) => r.migration_name));

    // 3. Read migration files in directory
    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  ⏩  Skipping already applied: ${file}`);
        continue;
      }

      console.log(`  ⏳  Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.query('INSERT INTO schema_migrations (migration_name) VALUES (?)', [file]);
        await connection.commit();
        console.log(`  ✅  Successfully applied: ${file}`);
        appliedCount++;
      } catch (migrationError) {
        await connection.rollback();
        console.error(`  ❌  Failed applying migration ${file}:`, migrationError.message);
        throw migrationError;
      }
    }

    console.log(`🎉 [MIGRATIONS] Finished. ${appliedCount} migration(s) applied.\n`);
    return { success: true, appliedCount };
  } finally {
    await connection.end();
  }
}

// Allow direct CLI execution: node src/db/migrate.js [optionalDbName]
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const cliDb = process.argv[2];
  runMigrations(cliDb)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal migration error:', err);
      process.exit(1);
    });
}

export default runMigrations;
