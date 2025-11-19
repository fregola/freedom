const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, requireRoles } = require('../middleware/auth');
const { upload, processImage } = require('../middleware/upload');
const {
  getProducts,
  getProductById,
  getProductsByCategory,
  getProductsByIds,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  productValidation
} = require('../controllers/productController');

// GET /api/products - Ottieni tutti i prodotti (pubblico)
router.get('/', getProducts);

// GET /api/products/search/:query - Cerca prodotti (pubblico)
router.get('/search/:query', searchProducts);

// GET /api/products/category/:categoryId - Ottieni prodotti per categoria (pubblico)
router.get('/category/:categoryId', getProductsByCategory);

// GET /api/products/by-ids - Ottieni prodotti per lista di ID (pubblico)
router.get('/by-ids', getProductsByIds);

// GET /api/products/:id - Ottieni un prodotto specifico (pubblico)
router.get('/:id', getProductById);

// POST /api/products - Crea un nuovo prodotto (solo admin)
router.post('/', authenticateToken, requireRoles(['admin', 'cook']), upload, processImage, productValidation, createProduct);

// PUT /api/products/:id - Aggiorna un prodotto (solo admin)
router.put('/:id', authenticateToken, requireRoles(['admin', 'cook']), upload, processImage, productValidation, updateProduct);

// DELETE /api/products/:id - Elimina un prodotto (solo admin)
router.delete('/:id', authenticateToken, requireRoles(['admin', 'cook']), deleteProduct);

module.exports = router;