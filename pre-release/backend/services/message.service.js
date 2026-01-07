const messageDao = require("../dao/message.dao");

exports.sendMessage = (req, res, next) => {
  try {
    const { name, email, nachricht } = req.body;

    if (!name || !email || !nachricht) {
      return res.status(400).json({ error: "Alle Felder erforderlich" });
    }

    const info = messageDao.create({ name, email, nachricht });

    return res.status(201).json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    next(err);
  }
};