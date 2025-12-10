const { body, validationResult } = require('express-validator');
const database = require('../config/database');

const popupValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Nome richiesto'),
  body('title').optional().trim(),
  body('trigger_type').isIn(['onload', 'delay']).withMessage('Trigger non valido'),
  body('trigger_delay').optional().isInt({ min: 0 }).withMessage('Delay deve essere un numero positivo'),
];

// GET /api/popups - List all popups (admin)
const listPopups = async (req, res) => {
  try {
    const popups = await database.all('SELECT * FROM popups ORDER BY created_at DESC');
    res.json({ success: true, data: { popups } });
  } catch (err) {
    console.error('Error listPopups:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/popups/active - Get active popups (public)
const getActivePopups = async (req, res) => {
  try {
    const popups = await database.all('SELECT * FROM popups WHERE is_active = 1');
    res.json({ success: true, data: { popups } });
  } catch (err) {
    console.error('Error getActivePopups:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/popups/:id - Get single popup
const getPopupById = async (req, res) => {
  try {
    const { id } = req.params;
    const popup = await database.get('SELECT * FROM popups WHERE id = ?', [id]);
    if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });
    res.json({ success: true, data: { popup } });
  } catch (err) {
    console.error('Error getPopupById:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/popups - Create popup
const createPopup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Invalid data', errors: errors.array() });
    }

    const { 
      name, is_active, title, body_text, image_url, button_text, button_link,
      style_config, trigger_type, trigger_delay, frequency, blocks
    } = req.body;

    const result = await database.insert('popups', {
      name,
      is_active: is_active ? 1 : 0,
      title,
      body_text,
      image_url,
      button_text,
      button_link,
      style_config: JSON.stringify(style_config || {}),
      trigger_type,
      trigger_delay: trigger_delay || 0,
      frequency,
      blocks: JSON.stringify(blocks || [])
    });

    const created = await database.get('SELECT * FROM popups WHERE id = ?', [result.lastID]);
    res.status(201).json({ success: true, message: 'Popup created', data: { popup: created } });
  } catch (err) {
    console.error('Error createPopup:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/popups/:id - Update popup
const updatePopup = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await database.get('SELECT * FROM popups WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Popup not found' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Invalid data', errors: errors.array() });
    }

    const { 
      name, is_active, title, body_text, image_url, button_text, button_link,
      style_config, trigger_type, trigger_delay, frequency, blocks
    } = req.body;

    await database.update('popups', {
      name,
      is_active: is_active ? 1 : 0,
      title,
      body_text,
      image_url,
      button_text,
      button_link,
      style_config: JSON.stringify(style_config || {}),
      trigger_type,
      trigger_delay: trigger_delay || 0,
      frequency,
      blocks: JSON.stringify(blocks || []),
      updated_at: new Date().toISOString()
    }, 'WHERE id = ?', [id]);

    const updated = await database.get('SELECT * FROM popups WHERE id = ?', [id]);
    res.json({ success: true, message: 'Popup updated', data: { popup: updated } });
  } catch (err) {
    console.error('Error updatePopup:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/popups/:id - Delete popup
const deletePopup = async (req, res) => {
  try {
    const { id } = req.params;
    await database.run('DELETE FROM popups WHERE id = ?', [id]);
    res.json({ success: true, message: 'Popup deleted' });
  } catch (err) {
    console.error('Error deletePopup:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  listPopups,
  getActivePopups,
  getPopupById,
  createPopup,
  updatePopup,
  deletePopup,
  popupValidation
};
