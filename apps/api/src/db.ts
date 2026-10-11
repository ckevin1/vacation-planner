import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function initializeDatabase(db: Database.Database) {
  db.pragma('foreign_keys = ON');
  db.exec(`CREATE TABLE IF NOT EXISTS trips (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', start_date TEXT NOT NULL, end_date TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS destinations (id TEXT PRIMARY KEY, trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE, name TEXT NOT NULL, location TEXT NOT NULL DEFAULT '', latitude REAL, longitude REAL, arrival_date TEXT, departure_date TEXT, display_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS itinerary_days (id TEXT PRIMARY KEY, trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE, date TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', UNIQUE(trip_id, date));
    CREATE TABLE IF NOT EXISTS itinerary_items (id TEXT PRIMARY KEY, trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE, day_id TEXT NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE, title TEXT NOT NULL, category TEXT NOT NULL, start_time TEXT, end_time TEXT, location TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', reference TEXT NOT NULL DEFAULT '', status TEXT NOT NULL, cost REAL, details_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS optional_activities (id TEXT PRIMARY KEY, trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE, title TEXT NOT NULL, suggested_date TEXT, end_date TEXT, location TEXT NOT NULL DEFAULT '', latitude REAL, longitude REAL, estimated_duration INTEGER NOT NULL DEFAULT 60, estimated_commute INTEGER NOT NULL DEFAULT 0, tags_json TEXT NOT NULL DEFAULT '[]', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS loyalty_records (id TEXT PRIMARY KEY, trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE, program_name TEXT NOT NULL, membership_number TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  return db;
}

export function createDatabase(filename = process.env.DATABASE_FILE ?? './data/vacation-planner.sqlite') {
  mkdirSync(dirname(filename), { recursive: true });
  return initializeDatabase(new Database(filename));
}