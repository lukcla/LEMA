const leistungDao = require('../dao/leistung.dao');

// Liste aller Leistungen
exports.listLeistungen = (req, res) => {
  const list = leistungDao.all();
  res.json(list);
};

// Einzelne Leistung
exports.getLeistungById = (req, res) => {
  const id = req.params.id;
  const leistung = leistungDao.getById(id);

  if (!leistung) {
    return res.status(404).json({ error: "Service not found" });
  }

  res.json(leistung);
};