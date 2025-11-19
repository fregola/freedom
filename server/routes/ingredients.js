const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, requireRoles } = require('../middleware/auth');
const {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  ingredientValidation
} = require('../controllers/ingredientController');

// GET /api/ingredients - Ottieni tutti gli ingredienti (pubblico)
router.get('/', getIngredients);

// GET /api/ingredients/:id - Ottieni un ingrediente specifico (pubblico)
router.get('/:id', getIngredientById);

// POST /api/ingredients - Crea un nuovo ingrediente (solo admin)
router.post('/', authenticateToken, requireRoles(['admin', 'cook']), ingredientValidation, createIngredient);

// PUT /api/ingredients/:id - Aggiorna un ingrediente (solo admin)
router.put('/:id', authenticateToken, requireRoles(['admin', 'cook']), ingredientValidation, updateIngredient);

// DELETE /api/ingredients/:id - Elimina un ingrediente (solo admin)
router.delete('/:id', authenticateToken, requireRoles(['admin', 'cook']), deleteIngredient);

module.exports = router;