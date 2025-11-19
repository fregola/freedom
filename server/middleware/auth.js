const jwt = require('jsonwebtoken');
const database = require('../config/database');

/**
 * Middleware per verificare il token JWT
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token di accesso richiesto'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verifica che l'utente esista ancora nel database
        const user = await database.get(
            'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utente non trovato'
            });
        }

        // Blocca utenti disattivati
        if (user.is_active === 0 || user.is_active === false) {
            return res.status(403).json({
                success: false,
                message: 'Account disattivato'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token scaduto'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token non valido'
            });
        } else {
            console.error('Errore verifica token:', error);
            return res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }
};

/**
 * Middleware per verificare il ruolo admin
 */
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Accesso negato: privilegi amministratore richiesti'
        });
    }
};

/**
 * Middleware per verificare ruoli ammessi
 */
const requireRoles = (roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Accesso negato: ruolo insufficiente'
        });
    }
};

/**
 * Middleware opzionale per autenticazione (non blocca se non c'è token)
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await database.get(
            'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        req.user = user || null;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireRoles,
    optionalAuth
};