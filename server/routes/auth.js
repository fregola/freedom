const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Validatori per i dati di input
 */
const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('Username o email richiesto')
        .isLength({ min: 3 })
        .withMessage('Username deve essere di almeno 3 caratteri'),
    body('password')
        .notEmpty()
        .withMessage('Password richiesta')
        .isLength({ min: 6 })
        .withMessage('Password deve essere di almeno 6 caratteri')
];

const registerValidation = [
    body('username')
        .notEmpty()
        .withMessage('Username richiesto')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username deve essere tra 3 e 50 caratteri')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username può contenere solo lettere, numeri e underscore'),
    body('email')
        .isEmail()
        .withMessage('Email non valida')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password deve essere di almeno 6 caratteri')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password deve contenere almeno una lettera minuscola, una maiuscola e un numero')
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Password attuale richiesta'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Nuova password deve essere di almeno 6 caratteri')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Nuova password deve contenere almeno una lettera minuscola, una maiuscola e un numero')
];

// Validazione cambio email
const changeEmailValidation = [
    body('email')
        .isEmail()
        .withMessage('Email non valida')
        .normalizeEmail()
];

/**
 * @route   POST /api/auth/login
 * @desc    Login utente
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   POST /api/auth/register
 * @desc    Registrazione nuovo utente
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   GET /api/auth/me
 * @desc    Ottieni informazioni utente corrente
 * @access  Private
 */
router.get('/me', authenticateToken, authController.me);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout utente
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambia password utente
 * @access  Private
 */
router.put('/change-password', authenticateToken, changePasswordValidation, authController.changePassword);

/**
 * @route   PUT /api/auth/change-email
 * @desc    Cambia email utente corrente
 * @access  Private
 */
router.put('/change-email', authenticateToken, changeEmailValidation, authController.changeEmail);

module.exports = router;