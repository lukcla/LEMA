const BetterSqlite3 = require("better-sqlite3");
const path = require("path");

// DB verbinden
const db = new BetterSqlite3(path.join(__dirname, "..", "db", "database.sqlite"));


// Buchung anlegen
exports.create = ({ vorname, nachname, email, telefon, leistung_id, datetime }) => {
  const stmt = db.prepare(`
      INSERT INTO Booking (vorname, nachname, email, telefon, leistung_id, datetime)
      VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(vorname, nachname, email, telefon, leistung_id, datetime);
};


// Einzelne Buchung + Leistungsdetails laden
exports.getById = (id) => {
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
exports.countByDateTime = (datetime) => {
  const stmt = db.prepare(`
      SELECT COUNT(*) AS cnt
      FROM Booking
      WHERE datetime = ?
  `);
  return stmt.get(datetime).cnt;
};


// Alle Datumswerte eines Tages (optional genutzt)
exports.getByDate = (dateOnly) => {
  const stmt = db.prepare(`
      SELECT datetime
      FROM Booking
      WHERE DATE(datetime) = DATE(?)
  `);
  return stmt.all(dateOnly);
};


// NEU: Alle Buchungen eines Tages + jeweilige Leistungsdauer
exports.getBookingsWithLeistungForDate = (date) => {
  const stmt = db.prepare(`
      SELECT b.*, l.dauer AS leistung_dauer
      FROM Booking b
      JOIN Leistung l ON b.leistung_id = l.id
      WHERE DATE(b.datetime) = DATE(?)
  `);
  return stmt.all(date);
};