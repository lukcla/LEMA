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
  return /^[0-9+\s()\-]{5,20}$/.test(phone);
}

function isISODateTime(dt) {
  return !isNaN(Date.parse(dt));
}

function isAlpha(str) {
  return /^[A-Za-zÄÖÜäöüß\s\-]+$/.test(str);
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
      return res.status(400).json({ error: "Alle Felder müssen ausgefüllt sein" });
    }

    if (!isAlpha(b.vorname) || !isAlpha(b.nachname)) {
    return res.status(400).json({ error: "Name darf nur Buchstaben enthalten." });
    }

    // 2) Email
    if (!isValidEmail(b.email)) {
      return res.status(400).json({ error: "Bitte überprüfen Sie die Emailadresse" });
    }

    // 3) Telefon
    if (!isValidPhone(b.telefon)) {
    return res.status(400).json({ error: "Bitte überprüfen Sie die Telefonnummer." });
    }

    // 4) Leistung prüfen
    const leistung = leistungDao.getById(b.leistung_id);
    if (!leistung) {
      return res.status(404).json({ error: "Service not found" });
    }

    // 5) Datumsformat prüfen
    if (!isISODateTime(b.datetime)) {
      return res.status(400).json({ error: "ungültiges Datum" });
    }

    const startNew = new Date(b.datetime);

    // 6) Datum darf nicht in der Vergangenheit liegen (Uhrzeit ignorieren)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingDate = new Date(startNew);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({ error: "Das Datum muss in der Zukunft liegen" });
    }

    // 7) Öffnungszeiten (10–18 Uhr)
    const hour = startNew.getHours();
    if (hour < 10 || hour >= 18) {
      return res.status(400).json({ error: "Außerhalb der Öffnungszeiten (10–18)" });
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
      return res.status(409).json({ error: "Zeitraum ist schon belegt" });
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
    return res.status(404).json({ error: "Buchung nicht gefunden" });
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



// Neue Slot-API: Dauer-Behandlung + 15 Min Puffer

// GET /api/booking/slots?date=YYYY-MM-DD&leistung_id=ID
exports.getSlots = (req, res, next) => {
  try {
    const date = req.query.date;
    const leistungId = req.query.leistung_id;

    if (!date || !leistungId) {
      return res.status(400).json({ error: "date und leistung_id erforderlich" });
    }

    const leistung = leistungDao.getById(leistungId);
    if (!leistung) {
      return res.status(404).json({ error: "Leistung nicht gefunden" });
    }

    const PUFFER = 15;                  // unsichtbarer Puffer
    const dauerAnzeige = leistung.dauer; // reine Behandlungsdauer
    const blockDauer = dauerAnzeige + PUFFER; // Blockzeit im Backend

    const day = new Date(date + "T00:00:00");
    const open = new Date(day);  open.setHours(10, 0, 0, 0);
    const close = new Date(day); close.setHours(18, 0, 0, 0);

    // alle Buchungen des Tages mit jeweiliger Leistungsdauer
    const existing = bookingDao.getBookingsWithLeistungForDate(date).map(b => {
      const start = new Date(b.datetime);
      start.setSeconds(0, 0);
      const end = new Date(start.getTime() + (b.leistung_dauer + PUFFER) * 60000);
      return { start, end };
    });

    const STEP = 15;
    const blocked = [];

    function fmt(d) {
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }

    for (let t = new Date(open); t < close; t = new Date(t.getTime() + STEP * 60000)) {
      t.setSeconds(0, 0);

      const start = new Date(t);
      const endBlock = new Date(start.getTime() + blockDauer * 60000);

      // wenn Anzeige-Ende schon außerhalb der Öffnungszeit wäre → überspringen
      const endAnzeige = new Date(start.getTime() + dauerAnzeige * 60000);
      if (endAnzeige > close) continue;

      let overlaps = false;
      for (const ex of existing) {
        if (start < ex.end && endBlock > ex.start) {
          overlaps = true;
          break;
        }
      }

      if (overlaps) {
        blocked.push(fmt(start));
      }
    }

    return res.json({ booked: blocked });

  } catch (err) {
    console.error(err);
    next(err);
  }
};
