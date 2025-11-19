const express = require('express');
const router = express.Router();
const { authenticateToken, requireRoles } = require('../middleware/auth');
const {
  listMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  menuValidation,
} = require('../controllers/customMenuController');

// GET /api/custom-menus - Lista menu personalizzati (pubblico)
router.get('/', listMenus);

// GET /api/custom-menus/:id - Dettaglio menu (pubblico)
router.get('/:id', getMenuById);

// POST /api/custom-menus - Crea menu (admin/cook)
router.post('/', authenticateToken, requireRoles(['admin', 'cook']), menuValidation, createMenu);

// PUT /api/custom-menus/:id - Aggiorna menu (admin/cook)
router.put('/:id', authenticateToken, requireRoles(['admin', 'cook']), menuValidation, updateMenu);

// DELETE /api/custom-menus/:id - Elimina menu (admin/cook)
router.delete('/:id', authenticateToken, requireRoles(['admin', 'cook']), deleteMenu);

module.exports = router;