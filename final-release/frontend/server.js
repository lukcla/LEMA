const express = require("express");
const path = require("path");

const app = express();

/* 
   Statische Dateien bereitstellen/
   Alle HTML-, CSS-, JS- und Bilddateien im Frontend-Ordner 
   werden automatisch ausgeliefert.
*/
app.use(express.static(path.join(__dirname)));

// frontend starten
app.listen(3000, () => {
  console.log("Frontend läuft auf http://localhost:3000");
});