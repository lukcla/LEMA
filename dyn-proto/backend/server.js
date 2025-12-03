const express = require('express');
const path = require('path');
const cors = require("cors");

const app = express();

// CORS aktivierenfür fetch von anderem Port
app.use(cors());

// Middleware → damit Backend JSON versteht
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routen importieren 
const bookingRoutes = require('./routes/booking.routes');
const leistungRoutes = require('./routes/leistung.routes');
const messageRoutes = require("./routes/message.routes");

// Routen registrieren
app.use('/api/booking', bookingRoutes);
app.use('/api/leistung', leistungRoutes);
app.use("/api/message", messageRoutes);

// Fehlerbehandlung – wichtig für saubere Struktur
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  // Falls Fehler bereits HTTP-Status enthält
  if (err.status) {
    return res.status(err.status).json({ error: err.message || "Error" });
  }

  // Allgemeiner Fehler
  res.status(500).json({ error: "Internal Server Error" });
});

// Server starten
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`API läuft auf Port ${PORT}`);
});




// ---- Globale Fehlerbehandlung (wichtig!) --- 
// funktion fängt alle fehler ab, wir gehen nicht mehr einfach davon aus dass alles klappt (feedback)
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  // falls Fehler bereits HTTP-Status enthält
  if (err.status) {
    return res.status(err.status).json({ error: err.message || "Error" });
  }

  // allgemeiner fehler (500)
  res.status(500).json({ error: "Internal Server Error" });
});