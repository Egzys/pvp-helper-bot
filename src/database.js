const Database = require("better-sqlite3");
const db = new Database("events.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS signups (
  event TEXT,
  user TEXT,
  character TEXT,
  class TEXT,
  role TEXT,
  rating INTEGER
)`).run();

module.exports = db;