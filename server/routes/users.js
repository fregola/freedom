const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Validazione input per creazione utente
const createUserValidation = [
  body('username')
    .notEmpty().withMessage('Username richiesto')
    .isLength({ min: 3, max: 50 }).withMessage('Username deve essere tra 3 e 50 caratteri')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username può contenere solo lettere, numeri e underscore'),
  body('email')
    .isEmail().withMessage('Email non valida')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password deve essere di almeno 6 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password deve contenere almeno una minuscola, una maiuscola e un numero'),
  body('role')
    .optional()
    .isIn(['admin', 'cook', 'waiter']).withMessage('Ruolo non valido')
];

/**
 * @route   POST /api/users
 * @desc    Crea un nuovo utente (admin)
 * @access  Private/Admin
 */
router.post('/', authenticateToken, requireAdmin, createUserValidation, userController.createUser);

// Lista utenti (admin)
router.get('/', authenticateToken, requireAdmin, userController.listUsers);

// Aggiorna stato attivo/disattivo
const updateStatusValidation = [
  body('is_active')
    .not().isEmpty().withMessage('is_active richiesto')
    .isBoolean().withMessage('is_active deve essere boolean')
];
router.put('/:id/status', authenticateToken, requireAdmin, updateStatusValidation, userController.updateUserStatus);

// Aggiorna email utente
const updateEmailValidation = [
  body('email').isEmail().withMessage('Email non valida').normalizeEmail()
];
router.put('/:id/email', authenticateToken, requireAdmin, updateEmailValidation, userController.updateUserEmail);

// Aggiorna password utente
const updatePasswordValidation = [
  body('newPassword')
    .isLength({ min: 6 }).withMessage('Password deve essere di almeno 6 caratteri')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password deve contenere almeno una minuscola, una maiuscola e un numero')
];
router.put('/:id/password', authenticateToken, requireAdmin, updatePasswordValidation, userController.updateUserPassword);

// Aggiorna ruolo utente
const updateRoleValidation = [
  body('role')
    .not().isEmpty().withMessage('Ruolo richiesto')
    .isIn(['admin', 'cook', 'waiter']).withMessage('Ruolo non valido')
];
router.put('/:id/role', authenticateToken, requireAdmin, updateRoleValidation, userController.updateUserRole);

module.exports = router;