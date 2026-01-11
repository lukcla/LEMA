const express = require('express');
const router = express.Router();

const bookingService = require('../services/booking.service');

// Slots holen
router.get('/slots', bookingService.getSlots);

// Buchung speichern
router.post('/', bookingService.createBooking);

// Buchung anzeigen
router.get('/:id', bookingService.getBookingById);

module.exports = router;

// nach feedback routes ergänzt 
router.get('/', bookingService.getAllBookings);
router.delete('/:id', bookingService.deleteBooking);


// was passiert jetzt? user klickt auf ein datum, frontend ruft "/api/booking/slots?date=..." auf,
// backend liefert so was wie: { "booked": ["14:00", "15:30"] }
// frontend kann dann diese slots/buttons deaktivieren

