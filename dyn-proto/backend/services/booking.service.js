const bookingDao = require('../dao/booking.dao');
const leistungDao = require('../dao/leistung.dao');

// Hilfsfunktionen, (damit man zb. bei Telefonnr keine Buchstaben eingeben kann usw.)
function isNotEmpty(value) {
  return value !== undefined && value !== null && value.toString().trim() !== "";
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return regex.test(email);
}

function isValidPhone(phone) {
  const regex = /^[0-9\-\+\s\(\)]{6,20}$/;
  return regex.test(phone);
}

function isISODateTime(dt) {
  return !isNaN(Date.parse(dt));
}

exports.createBooking = (req, res, next) => {
  try {  
    const b = req.body;

  // 1) Pflichtfelder prüfen
  if (
    !isNotEmpty(b.vorname) ||
    !isNotEmpty(b.nachname) ||
    !isNotEmpty(b.email) ||
    !isNotEmpty(b.leistung_id) ||
    !isNotEmpty(b.datetime)
  ) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // 2) Email prüfen
  if (!isValidEmail(b.email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // 3) Telefon prüfen (optional)
  if (b.telefon && !isValidPhone(b.telefon)) {
    return res.status(400).json({ error: "Invalid phone format" });
  }

  // 4) Leistung ID prüfen
  if (isNaN(parseInt(b.leistung_id)) || parseInt(b.leistung_id) <= 0) {
    return res.status(400).json({ error: "Invalid service id" });
  }

  // 5) Leistung existiert?
  const leistung = leistungDao.getById(b.leistung_id);
  if (!leistung) {
    return res.status(404).json({ error: "Service not found" });
  }

  // 6) datetime prüfen
  if (!isISODateTime(b.datetime)) {
    return res.status(400).json({ error: "Invalid datetime" });
  }

  // 7) datetime muss in Zukunft liegen
  const dt = new Date(b.datetime);
  const now = new Date();
  if (dt < now) {
    return res.status(400).json({ error: "Date must be in the future" });
  }

  // 8) Arbeitszeiten prüfen
  const hour = dt.getHours();
  if (hour < 10 || hour >= 18) {
    return res.status(400).json({ error: "Outside working hours (10-18)" });
  }

  // 9) Slot bereits gebucht?
  const slotCount = bookingDao.countByDateTime(b.datetime);
  if (slotCount > 0) {
    return res.status(409).json({ error: "Slot already booked" });
  }

  // 10) Buchung anlegen
  const info = bookingDao.create({
    vorname: b.vorname,
    nachname: b.nachname,
    email: b.email,
    telefon: b.telefon || "",
    leistung_id: b.leistung_id,
    datetime: b.datetime
  });

  return res.status(201).json({ bookingId: info.lastInsertRowid });
}   catch (err) {
    next(err);
  }
};

// GET /api/booking/:id
exports.getBookingById = (req, res, next) => {
  try {  
  const id = req.params.id;
  const booking = bookingDao.getById(id);

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  // Datum formatieren
  const d = new Date(booking.datetime);
  const datum = d.toLocaleDateString("de-DE");
  const uhrzeit = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  // JSON zurückgeben – genau so, wie die HTML-Seite es braucht
  res.json({
    id: booking.id,
    vorname: booking.vorname,
    nachname: booking.nachname,
    email: booking.email,
    telefon: booking.telefon,
    datum: datum,
    uhrzeit: uhrzeit,
    dauer: booking.leistung_dauer,
    preis: booking.leistung_preis,
    leistung: booking.leistung_name
  });
}   catch (err) {
    next(err);
  }
};


exports.getSlotsForDate = (req, res, next) => {
  try {  
  const date = req.query.date;

  if (!date) {
    return res.status(400).json({ error: "date parameter required (YYYY-MM-DD)" });
  
  }

  // einfache Datumsprüfung
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Invalid date format (YYYY-MM-DD expected)" });
  }

  // bookings des Tages holen
  const bookings = bookingDao.getByDate(date);

  // Uhrzeiten extrahieren
  const bookedTimes = bookings.map(entry => {
    const d = new Date(entry.datetime);
    return d.toISOString().slice(11, 16); // HH:MM
  });

  res.json({ booked: bookedTimes });
} catch (err) {
    next(err);
  }
};