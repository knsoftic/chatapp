import fs from 'fs';
import path from 'path';
import pool from '../config/database';
import { logger } from '../utils/logger';

async function migrate() {
  const migrationFile = path.join(process.cwd(), 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(migrationFile, 'utf-8');

  // Split by semicolon, filter empty statements
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  const conn = await pool.getConnection();
  try {
    for (const statement of statements) {
      await conn.execute(statement);
      logger.info(`Executed: ${statement.substring(0, 60)}...`);
    }
    logger.info('✅ Migration complete');
  } catch (err) {
    logger.error('Migration failed', err);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
