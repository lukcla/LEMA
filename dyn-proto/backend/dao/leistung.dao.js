// const BetterSqlite3 = require("better-sqlite3");
// const path = require("path");

// const db = new BetterSqlite3(path.join(__dirname, "..", "db", "database.sqlite"));
const db = require('../db/db');

// Alle Leistungen
exports.all = () => {
  return db.prepare("SELECT * FROM Leistung").all();
};

// Eine Leistung nach ID
exports.getById = (id) => {
  return db.prepare("SELECT * FROM Leistung WHERE id = ?").get(id);
};

// feedback: backend soll auch löschen, alles anzeigen und ändern können:
function getAll() {
  return db.prepare("SELECT * FROM Leistung").all();
}

function getById(id) {
  return db.prepare("SELECT * FROM Leistung WHERE id = ?").get(id);
}

function update(id, data) {
  const { name, beschreibung, dauer, preis, bild } = data;
  return db.prepare(`
    UPDATE Leistung
    SET name = ?, beschreibung = ?, dauer = ?, preis = ?, bild = ?
    WHERE id = ?
  `).run(name, beschreibung, dauer, preis, bild, id);
}

function remove(id) {
  return db.prepare("DELETE FROM Leistung WHERE id = ?").run(id);
}


module.exports = {
  getAll,
  getById,
  update,
  remove,
};