const bookingDao = require('../dao/booking.dao');
const leistungDao = require('../dao/leistung.dao');

// Validierungshilfen
function isNotEmpty(value) {
  return value !== undefined && value !== null && value.toString().trim() !== "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isValidPhone(phone) {
  return /^[0-9\-\+\s\(\)]{6,20}$/.test(phone);
}

function isISODateTime(dt) {
  return !isNaN(Date.parse(dt));
}

exports.createBooking = (req, res, next) => {
  try {
    const b = req.body;

    // 1) Pflichtfelder
    if (
      !isNotEmpty(b.vorname) ||
      !isNotEmpty(b.nachname) ||
      !isNotEmpty(b.email) ||
      !isNotEmpty(b.leistung_id) ||
      !isNotEmpty(b.datetime)
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 2) Email
    if (!isValidEmail(b.email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // 3) Telefon
    if (b.telefon && !isValidPhone(b.telefon)) {
      return res.status(400).json({ error: "Invalid phone format" });
    }

    // 4) Leistung prüfen
    const leistung = leistungDao.getById(b.leistung_id);
    if (!leistung) {
      return res.status(404).json({ error: "Service not found" });
    }

    // 5) Datumsformat prüfen
    if (!isISODateTime(b.datetime)) {
      return res.status(400).json({ error: "Invalid datetime" });
    }

    const startNew = new Date(b.datetime);

    // 6) Datum darf nicht in der Vergangenheit liegen (Uhrzeit ignorieren)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingDate = new Date(startNew);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({ error: "date must be in the future" });
    }

    // 7) Öffnungszeiten (10–18 Uhr)
    const hour = startNew.getHours();
    if (hour < 10 || hour >= 18) {
      return res.status(400).json({ error: "Outside working hours (10–18)" });
    }

    const PUFFER_MIN = 15;
    const dauerMinuten = leistung.dauer;

    // 8) Endzeit inkl. Puffer
    const endNew = new Date(startNew.getTime() + (dauerMinuten + PUFFER_MIN) * 60000);

    // 9) Existierende Buchungen des Tages laden (inkl. deren Dauer)
    const dayStr = startNew.toISOString().slice(0, 10);
    const existing = bookingDao.getBookingsWithLeistungForDate(dayStr);

    for (let ex of existing) {
      const startEx = new Date(ex.datetime);
      const endEx = new Date(startEx.getTime() + (ex.leistung_dauer + PUFFER_MIN) * 60000);

      const overlap = (startNew < endEx) && (endNew > startEx);
      if (overlap) {
        return res.status(409).json({
          error: "Dieser Zeitraum überschneidet sich mit einer bestehenden Buchung."
        });
      }
    }

    // 10) Optional: exakten Slot nochmal prüfen
    const slotCount = bookingDao.countByDateTime(b.datetime);
    if (slotCount > 0) {
      return res.status(409).json({ error: "Slot already booked" });
    }

    // 11) Buchung speichern
    const info = bookingDao.create({
      vorname: b.vorname,
      nachname: b.nachname,
      email: b.email,
      telefon: b.telefon || "",
      leistung_id: b.leistung_id,
      datetime: b.datetime
    });

    return res.status(201).json({ bookingId: info.lastInsertRowid });

  } catch (err) {
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