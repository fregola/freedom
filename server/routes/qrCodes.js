const express = require('express');
const router = express.Router();
const { authenticateToken, requireRoles } = require('../middleware/auth');
const {
  listQrCodes,
  createQrCode,
  updateQrCode,
  deleteQrCode,
  getQrCodeImage,
  handleRedirect,
  qrCodeValidation
} = require('../controllers/qrCodeController');

// Route pubbliche per redirect (nota: in index.js verranno montate su /api)
// Ma per pulizia, il redirect dovrebbe essere fuori dall'auth. 
// Qui definiamo le route protette di gestione e quella pubblica immagine

// Gestione (solo admin)
router.get('/', authenticateToken, requireRoles(['admin']), listQrCodes);
router.post('/', authenticateToken, requireRoles(['admin']), qrCodeValidation, createQrCode);
router.put('/:id', authenticateToken, requireRoles(['admin']), qrCodeValidation, updateQrCode);
router.delete('/:id', authenticateToken, requireRoles(['admin']), deleteQrCode);

// Immagine QR (accessibile agli admin, o pubblica? Meglio pubblica se deve essere embeddata ovunque, ma qui proteggiamo per coerenza)
// In realtà se l'admin vuole scaricarla, deve essere autenticato.
router.get('/:uuid/image', authenticateToken, requireRoles(['admin']), getQrCodeImage);

module.exports = router;
