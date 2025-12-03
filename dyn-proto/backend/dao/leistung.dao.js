const BetterSqlite3 = require("better-sqlite3");
const path = require("path");

const db = new BetterSqlite3(path.join(__dirname, "..", "db", "database.sqlite"));

// Alle Leistungen
exports.all = () => {
  return db.prepare("SELECT * FROM Leistung").all();
};

// Eine Leistung nach ID
exports.getById = (id) => {
  return db.prepare("SELECT * FROM Leistung WHERE id = ?").get(id);
};