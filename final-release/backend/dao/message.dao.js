// const BetterSqlite3 = require("better-sqlite3");
// const path = require("path");

// const db = new BetterSqlite3(path.join(__dirname, "..", "db", "database.sqlite"));

const db = require('../db/db');

//nachriten erstellen
function create({ name, email, nachricht }) {
  //prüfung der pflicht feldern
  if (!name || !email || !nachricht) {
    throw new Error("Alle Felder müssen ausgefüllt sein");
  }
  const stmt = db.prepare(`
    INSERT INTO Message (name, email, nachricht, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);
  const result = stmt.run(name, email, nachricht);
  return { id: result.lastInsertRowid, changes: result.changes };
}

//alle nachrichten abrufen
function getAll() {
  return db.prepare("SELECT * FROM Message").all();
}

//einzelne nachriten abrufen
function getById(id) {
  return db.prepare("SELECT * FROM Message WHERE id = ?").get(id);
}

//nachriten aktualisieren
function update(id, data) {
  const { name, email, nachricht } = data;
  return db.prepare(`
    UPDATE Message
    SET name = ?, email = ?, nachricht = ?
    WHERE id = ?
  `).run(name, email, nachricht, id);
}

//nachriten löschen
function remove(id) {
  const result = db.prepare("DELETE FROM Message WHERE id = ?").run(id);
  return result.changes;
}

//export der funktionen
module.exports = {
  create,
  getAll,
  getById,
  update,
  remove
};