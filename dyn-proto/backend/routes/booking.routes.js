const express = require('express');
const router = express.Router();

const bookingService = require('../services/booking.service');

// Slots für ein Datum + Leistung abrufen
router.get('/slots', bookingService.getSlots);

// Neue Buchung speichern
router.post('/', bookingService.createBooking);

// Buchung nach ID abrufen
router.get('/:id', bookingService.getBookingById);

module.exports = router;


// was passiert jetzt? user klickt auf ein datum, frontend ruft "/api/booking/slots?date=..." auf,
// backend liefert so was wie: { "booked": ["14:00", "15:30"] }
// frontend kann dann diese slots/buttons deaktivieren