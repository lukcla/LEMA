const BetterSqlite3 = require("better-sqlite3");
const path = require("path");

const db = new BetterSqlite3(path.join(__dirname, "..", "db", "database.sqlite"));

exports.create = ({ name, email, nachricht }) => {
  const stmt = db.prepare(`
    INSERT INTO Message (name, email, nachricht, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);
  return stmt.run(name, email, nachricht);
};