const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, requireRoles } = require('../middleware/auth');
const {
  getCategories,
  getPublicCategories,
  getConcatenatedCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryValidation
} = require('../controllers/categoryController');

// GET /api/categories - Ottieni tutte le categorie (pubblico)
// Supporta il parametro ?tree=true per ottenere la struttura ad albero
// Supporta il parametro ?concatenated=true per ottenere solo le categorie concatenate
router.get('/', getCategories);

// GET /api/categories/public - Ottieni solo le categorie parent con prodotti (pubblico)
router.get('/public', getPublicCategories);

// GET /api/categories/concatenated - Ottieni solo le categorie concatenate (pubblico)
router.get('/concatenated', getConcatenatedCategories);

// GET /api/categories/:id - Ottieni una categoria specifica (pubblico)
router.get('/:id', getCategoryById);

// POST /api/categories - Crea una nuova categoria (solo admin)
router.post('/', authenticateToken, requireRoles(['admin', 'cook']), categoryValidation, createCategory);

// PUT /api/categories/:id - Aggiorna una categoria (solo admin)
router.put('/:id', authenticateToken, requireRoles(['admin', 'cook']), categoryValidation, updateCategory);

// DELETE /api/categories/:id - Elimina una categoria (solo admin)
router.delete('/:id', authenticateToken, requireRoles(['admin', 'cook']), deleteCategory);

module.exports = router;