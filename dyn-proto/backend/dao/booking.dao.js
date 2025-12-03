const BetterSqlite3 = require('better-sqlite3');
const path = require('path');

const db = new BetterSqlite3(path.join(__dirname, '..', 'db', 'database.sqlite'));

// Booking anlegen
exports.create = ({ vorname, nachname, email, telefon, leistung_id, datetime }) => {
  const stmt = db.prepare(`
    INSERT INTO Booking (vorname, nachname, email, telefon, leistung_id, datetime)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(vorname, nachname, email, telefon, leistung_id, datetime);
};

// Einzelne Buchung + Leistung laden
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

// Anzahl Buchungen zu einem exakten datetime
exports.countByDateTime = (datetime) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM Booking
    WHERE datetime = ?
  `);
  return stmt.get(datetime).cnt;
};

// die funktion soll alle datum+zeit werte eines tages liefern
exports.getByDate = (dateOnly) => {
  const stmt = db.prepare(`
    SELECT datetime 
    FROM Booking
    WHERE DATE(datetime) = DATE(?)
  `);
  return stmt.all(dateOnly);
};
