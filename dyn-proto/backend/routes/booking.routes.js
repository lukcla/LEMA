const express = require('express');
const router = express.Router();

const bookingService = require('../services/booking.service');

// POST -> neue Buchung speichern
router.get('/slots', bookingService.getSlotsForDate);
router.post('/', bookingService.createBooking);

// GET -> Buchung anzeigen
router.get('/:id', bookingService.getBookingById);

module.exports = router;

router.get("/slots", bookingService.getSlots);


// was passiert jetzt? user klickt auf ein datum, frontend ruft "/api/booking/slots?date=..." auf,
// backend liefert so was wie: { "booked": ["14:00", "15:30"] }
// frontend kann dann diese slots/buttons deaktivieren