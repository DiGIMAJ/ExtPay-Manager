import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize database with schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

export default db;

export const query = (sql: string, params: any[] = []) => {
    return db.prepare(sql).all(params);
};

export const get = (sql: string, params: any[] = []) => {
    return db.prepare(sql).get(params);
};

export const run = (sql: string, params: any[] = []) => {
    return db.prepare(sql).run(params);
};
