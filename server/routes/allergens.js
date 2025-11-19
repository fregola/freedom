const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, requireRoles } = require('../middleware/auth');
const {
  getAllergens,
  getAllergenById,
  createAllergen,
  updateAllergen,
  deleteAllergen,
  allergenValidation
} = require('../controllers/allergenController');

// GET /api/allergens - Ottieni tutti gli allergeni (pubblico)
router.get('/', getAllergens);

// GET /api/allergens/:id - Ottieni un allergene specifico (pubblico)
router.get('/:id', getAllergenById);

// POST /api/allergens - Crea un nuovo allergene (solo admin)
router.post('/', authenticateToken, requireRoles(['admin', 'cook']), allergenValidation, createAllergen);

// PUT /api/allergens/:id - Aggiorna un allergene (solo admin)
router.put('/:id', authenticateToken, requireRoles(['admin', 'cook']), allergenValidation, updateAllergen);

// DELETE /api/allergens/:id - Elimina un allergene (solo admin)
router.delete('/:id', authenticateToken, requireRoles(['admin', 'cook']), deleteAllergen);

module.exports = router;