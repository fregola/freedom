const express = require('express');
const router = express.Router();
const { authenticateToken, requireRoles } = require('../middleware/auth');
const { upload, processPopupImage, uploadVideo, processPopupVideo } = require('../middleware/upload');
const {
  listPopups,
  getActivePopups,
  getPopupById,
  createPopup,
  updatePopup,
  deletePopup,
  popupValidation
} = require('../controllers/popupController');

// Public routes
router.get('/active', getActivePopups);

// Protected routes (Admin only)
router.post('/upload-image', authenticateToken, requireRoles(['admin']), upload, processPopupImage, (req, res) => {
  if (!req.imagePath) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }
  res.json({ success: true, url: req.imagePath });
});

router.post('/upload-video', authenticateToken, requireRoles(['admin']), uploadVideo, processPopupVideo, (req, res) => {
  if (!req.videoPath) {
    return res.status(400).json({ success: false, message: 'No video uploaded' });
  }
  res.json({ success: true, url: req.videoPath });
});

router.get('/', authenticateToken, requireRoles(['admin']), listPopups);
router.get('/:id', authenticateToken, requireRoles(['admin']), getPopupById);
router.post('/', authenticateToken, requireRoles(['admin']), popupValidation, createPopup);
router.put('/:id', authenticateToken, requireRoles(['admin']), popupValidation, updatePopup);
router.delete('/:id', authenticateToken, requireRoles(['admin']), deletePopup);

module.exports = router;
