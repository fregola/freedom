const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const database = require('../config/database');

/**
 * Genera un token JWT per l'utente
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

/**
 * Login utente
 */
const login = async (req, res) => {
    try {
        // Verifica errori di validazione
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dati non validi',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // Cerca l'utente nel database
        const user = await database.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenziali non valide'
            });
        }

        // Blocca utenti disattivati
        if (user.is_active === 0 || user.is_active === false) {
            return res.status(403).json({
                success: false,
                message: 'Account disattivato'
            });
        }

        // Verifica la password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenziali non valide'
            });
        }

        // Genera il token
        const token = generateToken(user.id);

        // Rimuovi la password dalla risposta
        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login effettuato con successo',
            data: {
                user: userWithoutPassword,
                token
            }
        });

    } catch (error) {
        console.error('Errore login:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
};

/**
 * Registrazione nuovo utente
 */
const register = async (req, res) => {
    try {
        // Verifica errori di validazione
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dati non validi',
                errors: errors.array()
            });
        }

        const { username, email, password } = req.body;

        // Verifica se l'utente esiste già
        const existingUser = await database.get(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username o email già in uso'
            });
        }

        // Hash della password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Inserisci il nuovo utente
        const result = await database.run(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        // Recupera l'utente appena creato
        const newUser = await database.get(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [result.id]
        );

        // Genera il token
        const token = generateToken(newUser.id);

        res.status(201).json({
            success: true,
            message: 'Utente registrato con successo',
            data: {
                user: newUser,
                token
            }
        });

    } catch (error) {
        console.error('Errore registrazione:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
};

/**
 * Verifica token e restituisce info utente
 */
const me = async (req, res) => {
    try {
        // L'utente è già disponibile tramite il middleware auth
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('Errore verifica utente:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
};

/**
 * Logout (lato client, il token viene semplicemente rimosso)
 */
const logout = (req, res) => {
    res.json({
        success: true,
        message: 'Logout effettuato con successo'
    });
};

/**
 * Cambia password utente
 */
const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dati non validi',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Recupera l'utente con la password
        const user = await database.get(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        // Verifica la password attuale
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Password attuale non corretta'
            });
        }

        // Hash della nuova password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Aggiorna la password
        await database.run(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, userId]
        );

        res.json({
            success: true,
            message: 'Password cambiata con successo'
        });

    } catch (error) {
        console.error('Errore cambio password:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
};

/**
 * Cambia email utente corrente
 */
const changeEmail = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dati non validi',
                errors: errors.array()
            });
        }

        const userId = req.user.id;
        const { email } = req.body;

        // Controllo unicità email
        const conflict = await database.get(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, userId]
        );
        if (conflict) {
            return res.status(409).json({
                success: false,
                message: 'Email già in uso'
            });
        }

        await database.run(
            'UPDATE users SET email = ? WHERE id = ?',
            [email, userId]
        );

        const updatedUser = await database.get(
            'SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Email cambiata con successo',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Errore cambio email:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
};

module.exports = {
    login,
    register,
    me,
    logout,
    changePassword,
    changeEmail
};