const { validationResult } = require('express-validator');
const database = require('../config/database');

const listRooms = async (req, res) => {
  try {
    const rooms = await database.all('SELECT id, name, width, height FROM rooms ORDER BY id ASC');
    const result = [];
    for (const r of rooms) {
      const tables = await database.all('SELECT id, type, x, y, w, h, capacity, status, label FROM room_tables WHERE room_id = ? ORDER BY id ASC', [r.id]);
      result.push({ id: r.id, name: r.name, width: r.width, height: r.height, tables });
    }
    return res.json({ success: true, data: { rooms: result } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

const createRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dati non validi', errors: errors.array() });
    }
    const { name, width, height } = req.body;
    if (!name || !width || !height) {
      return res.status(400).json({ success: false, message: 'Parametri mancanti' });
    }
    const inserted = await database.run('INSERT INTO rooms (name, width, height) VALUES (?, ?, ?)', [name.trim(), Number(width), Number(height)]);
    const room = await database.get('SELECT id, name, width, height FROM rooms WHERE id = ?', [inserted.lastID]);
    return res.json({ success: true, data: { room } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

const updateRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dati non validi', errors: errors.array() });
    }
    const { id } = req.params;
    const { name, width, height } = req.body;
    const existing = await database.get('SELECT id FROM rooms WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Sala non trovata' });
    }
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (width !== undefined) data.width = Number(width);
    if (height !== undefined) data.height = Number(height);
    if (Object.keys(data).length === 0) {
      const room = await database.get('SELECT id, name, width, height FROM rooms WHERE id = ?', [id]);
      return res.json({ success: true, data: { room } });
    }
    await database.update('rooms', data, 'WHERE id = ?', [id]);
    const room = await database.get('SELECT id, name, width, height FROM rooms WHERE id = ?', [id]);
    return res.json({ success: true, data: { room } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

const replaceTables = async (req, res) => {
  try {
    const { id } = req.params;
    const { tables } = req.body;
    const existing = await database.get('SELECT id FROM rooms WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Sala non trovata' });
    }
    await database.run('DELETE FROM room_tables WHERE room_id = ?', [id]);
    if (Array.isArray(tables)) {
      for (const t of tables) {
        await database.run(
          'INSERT INTO room_tables (room_id, type, x, y, w, h, capacity, status, label) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [Number(id), String(t.type), Number(t.x), Number(t.y), Number(t.w), Number(t.h), Number(t.capacity), String(t.status), t.label ? String(t.label) : null]
        );
      }
    }
    const saved = await database.all('SELECT id, type, x, y, w, h, capacity, status, label FROM room_tables WHERE room_id = ? ORDER BY id ASC', [id]);
    return res.json({ success: true, data: { tables: saved } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await database.get('SELECT id FROM rooms WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Sala non trovata' });
    }
    await database.run('DELETE FROM rooms WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Sala eliminata' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

module.exports = {
  listRooms,
  createRoom,
  updateRoom,
  replaceTables,
  deleteRoom
};