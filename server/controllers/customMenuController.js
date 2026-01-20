const { body, validationResult } = require('express-validator');
const database = require('../config/database');

const menuValidation = [
  body('name').trim().isLength({ min: 1, max: 120 }).withMessage('Nome menu richiesto'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Prezzo non valido'),
  body('start_date').optional(),
  body('end_date').optional(),
  body('is_visible').optional().isBoolean().withMessage('is_visible deve essere boolean'),
  body('items').optional().isArray().withMessage('Items deve essere un array'),
];

const listMenus = async (req, res) => {
  try {
    const menus = await database.all('SELECT * FROM custom_menus ORDER BY created_at DESC');
    const result = [];
    for (const m of menus) {
      const items = await database.all(`
        SELECT cmi.id, cmi.position, p.id as product_id, p.name, p.image_path, p.category_id, p.price, p.description, p.description_en
        , (SELECT name FROM categories WHERE id = p.category_id) as category_name
        FROM custom_menu_items cmi
        JOIN products p ON p.id = cmi.product_id
        WHERE cmi.custom_menu_id = ?
        ORDER BY cmi.position ASC, cmi.id ASC
      `, [m.id]);
      result.push({ ...m, items });
    }
    res.json({ success: true, data: { menus: result } });
  } catch (err) {
    console.error('Errore listMenus:', err);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

const getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await database.get('SELECT * FROM custom_menus WHERE id = ?', [id]);
    if (!menu) return res.status(404).json({ success: false, message: 'Menu non trovato' });
    const items = await database.all(`
      SELECT cmi.id, cmi.position, p.id as product_id, p.name, p.image_path, p.category_id, p.price, p.description, p.description_en,
      (SELECT name FROM categories WHERE id = p.category_id) as category_name
      FROM custom_menu_items cmi
      JOIN products p ON p.id = cmi.product_id
      WHERE cmi.custom_menu_id = ?
      ORDER BY cmi.position ASC, cmi.id ASC
    `, [id]);
    res.json({ success: true, data: { menu: { ...menu, items } } });
  } catch (err) {
    console.error('Errore getMenuById:', err);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

const createMenu = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dati non validi', errors: errors.array() });
    }
    const { name, price, start_date, end_date, is_visible, items } = req.body;
    const visibleValue = typeof is_visible === 'string' ? (is_visible === 'true' || is_visible === '1') : Boolean(is_visible);
    const result = await database.insert('custom_menus', {
      name: name.trim(),
      price: price ?? null,
      start_date: start_date || null,
      end_date: end_date || null,
      is_visible: visibleValue ? 1 : 0,
    });
    const menuId = result.lastID;
    if (Array.isArray(items)) {
      let pos = 0;
      for (const it of items) {
        const productId = typeof it === 'object' ? it.product_id || it.id : it;
        if (productId) {
          await database.insert('custom_menu_items', {
            custom_menu_id: menuId,
            product_id: productId,
            position: pos++,
          });
        }
      }
    }
    const created = await database.get('SELECT * FROM custom_menus WHERE id = ?', [menuId]);
    res.status(201).json({ success: true, message: 'Menu creato', data: { menu: created } });
  } catch (err) {
    console.error('Errore createMenu:', err);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await database.get('SELECT * FROM custom_menus WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Menu non trovato' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dati non validi', errors: errors.array() });
    }
    const { name, price, start_date, end_date, is_visible, items } = req.body;
    const visibleValue = is_visible === undefined ? existing.is_visible : (typeof is_visible === 'string' ? (is_visible === 'true' || is_visible === '1') : Boolean(is_visible));
    await database.update('custom_menus', {
      name: name ?? existing.name,
      price: price !== undefined ? price : existing.price,
      start_date: start_date !== undefined ? start_date : existing.start_date,
      end_date: end_date !== undefined ? end_date : existing.end_date,
      is_visible: visibleValue ? 1 : 0,
      updated_at: new Date().toISOString(),
    }, 'WHERE id = ?', [id]);
    if (Array.isArray(items)) {
      await database.run('DELETE FROM custom_menu_items WHERE custom_menu_id = ?', [id]);
      let pos = 0;
      for (const it of items) {
        const productId = typeof it === 'object' ? it.product_id || it.id : it;
        if (productId) {
          await database.insert('custom_menu_items', {
            custom_menu_id: id,
            product_id: productId,
            position: pos++,
          });
        }
      }
    }
    const updated = await database.get('SELECT * FROM custom_menus WHERE id = ?', [id]);
    res.json({ success: true, message: 'Menu aggiornato', data: { menu: updated } });
  } catch (err) {
    console.error('Errore updateMenu:', err);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await database.get('SELECT * FROM custom_menus WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Menu non trovato' });
    await database.run('DELETE FROM custom_menu_items WHERE custom_menu_id = ?', [id]);
    await database.run('DELETE FROM custom_menus WHERE id = ?', [id]);
    res.json({ success: true, message: 'Menu eliminato' });
  } catch (err) {
    console.error('Errore deleteMenu:', err);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

module.exports = {
  listMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  menuValidation,
};