const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/roomController');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, controller.listRooms);
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  [body('name').isString().notEmpty(), body('width').isInt({ min: 100 }), body('height').isInt({ min: 100 })],
  controller.createRoom
);
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  [body('name').optional().isString(), body('width').optional().isInt({ min: 100 }), body('height').optional().isInt({ min: 100 })],
  controller.updateRoom
);
router.put(
  '/:id/tables',
  authenticateToken,
  requireAdmin,
  controller.replaceTables
);
router.delete('/:id', authenticateToken, requireAdmin, controller.deleteRoom);

module.exports = router;