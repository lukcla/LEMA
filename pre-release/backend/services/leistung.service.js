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

// Neue Leistungen erstellen 
exports.createLeistung = (req, res) => {
  try {
    const result = leistungDao.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
 
// Leistung ändern
exports.updateLeistung = (req, res) => {
  leistungDao.update(req.params.id, req.body);
  res.json({ success: true });
};

// Leistung löschen
exports.deleteLeistung = (req, res) => {
  const result = leistungDao.remove(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Leistung nicht gefunden" });
  }
  res.json({ success: true });
};