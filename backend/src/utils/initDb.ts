import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

async function initDb() {
  console.log('Connecting to MySQL host:', env.db.host);

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  console.log('Creating database chat_app if not exists...');
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await connection.query(`USE \`${env.db.name}\`;`);

  const sqlPath = path.join(process.cwd(), 'migrations', '001_initial_schema.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

  // Strip SQL single-line comments (-- ...) and block comments
  const cleanSql = sqlContent
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Executing ${statements.length} SQL statements...`);

  for (const statement of statements) {
    try {
      await connection.query(statement);
      console.log('Executed statement successfully:', statement.substring(0, 40).replace(/\n/g, ' '));
    } catch (err: any) {
      console.error('SQL Error on statement:', statement.substring(0, 40), err.message);
    }
  }

  console.log('✅ Database initialization completed!');
  await connection.end();
}

initDb().catch((err) => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});
