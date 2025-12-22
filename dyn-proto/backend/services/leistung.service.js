const leistungDao = require('../dao/leistung.dao');

// Alle Leistungen laden
exports.getAllLeistungen = (req, res) => {
  const list = leistungDao.getAll();
  res.json(list);
};

// Einzelne Leistung laden
exports.getLeistungById = (req, res) => {
  const id = req.params.id;
  const leistung = leistungDao.getById(id);

  if (!leistung) {
    return res.status(404).json({ error: "Leistung nicht gefunden" });
  }

  res.json(leistung);
};

// Leistung ändern
exports.updateLeistung = (req, res) => {
  leistungDao.update(req.params.id, req.body);
  res.json({ success: true });
};

// Leistung löschen
exports.deleteLeistung = (req, res) => {
  leistungDao.remove(req.params.id);
  res.json({ success: true });
};