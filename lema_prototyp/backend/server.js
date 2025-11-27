const express = require('express');
const BetterSqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function formatToEuro(val) {
  if (val === null || val === undefined) val = 0.0;
  const asString = val.toFixed(2).toString();
  return asString.replace('.', ',') + ' €';
}

console.log('Starting WebServer');
const app = express();

// -------------------------------
// Middleware
// -------------------------------

// Formulardaten (POST) einlesen
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Statische Dateien aus dem Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// -------------------------------
// Datenbank
// -------------------------------
console.log('Connecting Database');
const dbOptions = { verbose: console.log };
const dbFile = path.join(__dirname, 'db', 'database.sqlite');
const dbConnection = new BetterSqlite3(dbFile, dbOptions);

// Tabelle für Buchungen anlegen (falls noch nicht vorhanden)
dbConnection
  .prepare(`
    CREATE TABLE IF NOT EXISTS Booking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vorname TEXT NOT NULL,
      nachname TEXT NOT NULL,
      email TEXT NOT NULL,
      telefon TEXT,
      datum TEXT NOT NULL,
      uhrzeit TEXT NOT NULL,
      dauer INTEGER
    );
  `)
  .run();


console.log('Setting up port');
const PORT = 3000;

// -------------------------------
// Produkte-Seite (DB -> HTML)
// -------------------------------
app.get('/products.html', (req, res) => {
  console.log('Endpoint products called');

  const templatePath = path.join(__dirname, 'templates', 'products.html');
  const template = fs.readFileSync(templatePath).toString();
  console.log('loaded template file', template.length);

  const stmt = dbConnection.prepare('SELECT * FROM Product');
  const records = stmt.all();
  console.log('loaded ' + records.length + ' from database');

  let dynHTML = '';
  for (let i = 0; i < records.length; i++) {
    dynHTML += '<tr>';
    dynHTML += '<td>' + records[i].id + '</td>';
    dynHTML += '<td>' + records[i].category + '</td>';
    dynHTML += '<td>' + records[i].name + '</td>';
    dynHTML += '<td>' + records[i].description + '</td>';
    dynHTML += '<td>' + formatToEuro(records[i].price) + '</td>';
    dynHTML += '</tr>';
  }

  const payload = template.replace('[DATEN]', dynHTML);
  console.log('created combined html', payload.length);

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(payload);
  res.end();
});

// -------------------------------
// Startseite
// -------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// -------------------------------
// API: Buchung speichern + Slot prüfen
// -------------------------------
app.post('/api/buchen', (req, res) => {
  console.log('POST /api/buchen', req.body);

  const data = req.body;

  // 1) prüfen, ob der Slot bereits belegt ist
  const checkStmt = dbConnection.prepare(`
    SELECT COUNT(*) AS cnt
    FROM Booking
    WHERE datum = @datum AND uhrzeit = @uhrzeit
  `);

  const existing = checkStmt.get({
    datum: data.date,
    uhrzeit: data.time,
  });

  if (existing.cnt > 0) {
    console.log('Zeitslot bereits belegt:', data.date, data.time);
    return res.status(409).send('Dieser Zeitslot ist bereits gebucht.');
  }

  // 2) Wenn der Slot frei ist → eintragen
  const insertStmt = dbConnection.prepare(`
  INSERT INTO Booking
  (vorname, nachname, email, telefon, datum, uhrzeit, dauer)
  VALUES
  (@vorname, @nachname, @email, @telefon, @datum, @uhrzeit, @dauer)
`);


  const info = insertStmt.run({
  vorname: data.vorname,
  nachname: data.nachname,
  email: data.email,
  telefon: data.telefon,
  datum: data.date,
  uhrzeit: data.time,
  dauer: data.dauer
});


  const bookingId = info.lastInsertRowid;

  // Weiterleitung auf Bestätigungsseite mit ID
  res.redirect('/bestaetigung.html?bookingId=' + bookingId);
});

// Ausgabe auf bestaetigung.html
app.get('/api/booking/:id', (req, res) => {
  const id = req.params.id;

  const stmt = dbConnection.prepare('SELECT * FROM Booking WHERE id = ?');
  const booking = stmt.get(id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json(booking);
});


// -------------------------------
// (optional) einzelne Buchung als JSON
// -------------------------------
app.get('/api/booking/:id', (req, res) => {
  const id = req.params.id;
  const stmt = dbConnection.prepare('SELECT * FROM Booking WHERE id = ?');
  const booking = stmt.get(id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json(booking);
});


// -------------------------------
// Server starten
// -------------------------------
app.listen(PORT, () => {
  console.log('Server listening on port', PORT);
  console.log('Use Browser to call http://localhost:' + PORT + '/');
});
