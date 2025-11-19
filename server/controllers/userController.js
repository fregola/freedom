const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const database = require('../config/database');

/**
 * Crea un nuovo utente (solo admin)
 */
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array(),
      });
    }

    const { username, email, password, role } = req.body;

    // Controlla se già esiste username o email
    const existing = await database.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Username o email già in uso',
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Inserisci utente con ruolo (di default 'waiter' se non fornito)
    const result = await database.run(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, role || 'waiter']
    );

    const newUser = await database.get(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [result.lastID]
    );

    return res.status(201).json({
      success: true,
      message: 'Utente creato con successo',
      data: { user: newUser },
    });
  } catch (error) {
    console.error('Errore creazione utente:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
};

module.exports = {
  createUser,
  /**
   * Lista tutti gli utenti (solo admin)
   */
  async listUsers(req, res) {
    try {
      const users = await database.select(
        'users',
        'id, username, email, role, is_active, created_at, updated_at'
      );
      return res.json({ success: true, data: { users } });
    } catch (error) {
      console.error('Errore lista utenti:', error);
      return res.status(500).json({ success: false, message: 'Errore interno del server' });
    }
  },

  /**
   * Aggiorna stato attivo/disattivo utente (solo admin)
   */
  async updateUserStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Dati non validi', errors: errors.array() });
      }
      const { id } = req.params;
      const { is_active } = req.body;

      // Normalizza boolean da stringhe/number
      const activeValue = typeof is_active === 'string'
        ? is_active === 'true' || is_active === '1'
        : Boolean(is_active);

      const existing = await database.get('SELECT id FROM users WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Utente non trovato' });
      }

      await database.update('users', { is_active: activeValue ? 1 : 0 }, 'WHERE id = ?', [id]);
      const user = await database.get(
        'SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      return res.json({ success: true, message: 'Stato utente aggiornato', data: { user } });
    } catch (error) {
      console.error('Errore aggiornamento stato utente:', error);
      return res.status(500).json({ success: false, message: 'Errore interno del server' });
    }
  },

  /**
   * Aggiorna email utente (solo admin)
   */
  async updateUserEmail(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Dati non validi', errors: errors.array() });
      }
      const { id } = req.params;
      const { email } = req.body;

      const existing = await database.get('SELECT id FROM users WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Utente non trovato' });
      }

      // Unicità email
      const conflict = await database.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (conflict) {
        return res.status(409).json({ success: false, message: 'Email già in uso' });
      }

      await database.update('users', { email }, 'WHERE id = ?', [id]);
      const user = await database.get(
        'SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      return res.json({ success: true, message: 'Email aggiornata', data: { user } });
    } catch (error) {
      console.error('Errore aggiornamento email utente:', error);
      return res.status(500).json({ success: false, message: 'Errore interno del server' });
    }
  },

  /**
   * Aggiorna password utente (solo admin)
   */
  async updateUserPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Dati non validi', errors: errors.array() });
      }
      const { id } = req.params;
      const { newPassword } = req.body;

      const existing = await database.get('SELECT id FROM users WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Utente non trovato' });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      await database.update('users', { password_hash: passwordHash }, 'WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Password aggiornata' });
    } catch (error) {
      console.error('Errore aggiornamento password utente:', error);
      return res.status(500).json({ success: false, message: 'Errore interno del server' });
    }
  }
  ,
  /**
   * Aggiorna ruolo utente (solo admin)
   */
  async updateUserRole(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Dati non validi', errors: errors.array() });
      }
      const { id } = req.params;
      const { role } = req.body;

      const existing = await database.get('SELECT id FROM users WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Utente non trovato' });
      }

      await database.update('users', { role }, 'WHERE id = ?', [id]);
      const user = await database.get(
        'SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      return res.json({ success: true, message: 'Ruolo utente aggiornato', data: { user } });
    } catch (error) {
      console.error('Errore aggiornamento ruolo utente:', error);
      return res.status(500).json({ success: false, message: 'Errore interno del server' });
    }
  }
};