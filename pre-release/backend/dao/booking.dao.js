// const BetterSqlite3 = require("better-sqlite3");
// const path = require("path");

// DB verbinden
// const db = new BetterSqlite3(path.join(__dirname, "..", "db", "database.sqlite"));

const db = require('../db/db');

// Buchung anlegen
function create({ vorname, nachname, email, telefon, leistung_id, datetime }) {
  const stmt = db.prepare(`
    INSERT INTO Booking (vorname, nachname, email, telefon, leistung_id, datetime)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(vorname, nachname, email, telefon, leistung_id, datetime);
}


// Einzelne Buchung + Leistungsdetails laden
function getById(id) {  
  const stmt = db.prepare(`
      SELECT 
        b.*,
        l.name AS leistung_name,
        l.dauer AS leistung_dauer,
        l.preis AS leistung_preis
      FROM Booking b
      JOIN Leistung l ON b.leistung_id = l.id
      WHERE b.id = ?
  `);
  return stmt.get(id);
};


// Anzahl exakter Buchungen zu einem datetime
function countByDateTime(datetime) {
  const stmt = db.prepare(`
      SELECT COUNT(*) AS cnt
      FROM Booking
      WHERE datetime = ?
  `);
  return stmt.get(datetime).cnt;
}


// Alle Datumswerte eines Tages (optional genutzt)
function getByDate(dateOnly) {
  const stmt = db.prepare(`
      SELECT datetime
      FROM Booking
      WHERE DATE(datetime) = DATE(?)
  `);
  return stmt.all(dateOnly);
}



// NEU: Alle Buchungen eines Tages + jeweilige Leistungsdauer

function getBookingsWithLeistungForDate(date) {
  const stmt = db.prepare(`
      SELECT b.*, l.dauer AS leistung_dauer
      FROM Booking b
      JOIN Leistung l ON b.leistung_id = l.id
      WHERE DATE(b.datetime) = DATE(?)
  `);
  return stmt.all(date);
}


// feedback: backend soll auch löschen, anzeigen, ändern können
// CRUD für booking 
function getAll() {
  return db.prepare(`
    SELECT b.*, l.name AS leistung_name
    FROM Booking b
    JOIN Leistung l ON b.leistung_id = l.id
    ORDER BY b.datetime
  `).all();
}

function remove(id) {
  return db.prepare("DELETE FROM Booking WHERE id = ?").run(id);
}

module.exports = {
  create,
  getById,
  countByDateTime,
  getByDate,
  getBookingsWithLeistungForDate,
  getAll,
  remove
};