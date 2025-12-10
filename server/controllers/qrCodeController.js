const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Validazione
const qrCodeValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Nome richiesto'),
  body('destination_url').trim().isURL({ require_protocol: false }).withMessage('URL non valido'),
];

// Genera un UUID casuale
const generateUUID = () => crypto.randomBytes(16).toString('hex');

// GET /api/qr-codes - Lista di tutti i QR code
const listQrCodes = async (req, res) => {
  try {
    const codes = await database.all('SELECT * FROM qr_codes ORDER BY created_at DESC');
    res.json({ success: true, data: { codes } });
  } catch (err) {
    console.error('Errore listQrCodes:', err);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

// POST /api/qr-codes - Crea nuovo QR code
const createQrCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dati non validi', errors: errors.array() });
    }

    const { name, destination_url } = req.body;
    let url = destination_url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const uuid = generateUUID();
    
    await database.insert('qr_codes', {
      uuid,
      name,
      destination_url: url
    });

    const created = await database.get('SELECT * FROM qr_codes WHERE uuid = ?', [uuid]);
    res.status(201).json({ success: true, message: 'QR Code creato', data: { code: created } });
  } catch (err) {
    console.error('Errore createQrCode:', err);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

// PUT /api/qr-codes/:id - Aggiorna QR code
const updateQrCode = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await database.get('SELECT * FROM qr_codes WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'QR Code non trovato' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Dati non validi', errors: errors.array() });
    }

    const { name, destination_url } = req.body;
    let url = destination_url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    await database.update('qr_codes', {
      name,
      destination_url: url,
      updated_at: new Date().toISOString()
    }, 'WHERE id = ?', [id]);

    const updated = await database.get('SELECT * FROM qr_codes WHERE id = ?', [id]);
    res.json({ success: true, message: 'QR Code aggiornato', data: { code: updated } });
  } catch (err) {
    console.error('Errore updateQrCode:', err);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

// DELETE /api/qr-codes/:id - Elimina QR code
const deleteQrCode = async (req, res) => {
  try {
    const { id } = req.params;
    await database.run('DELETE FROM qr_codes WHERE id = ?', [id]);
    res.json({ success: true, message: 'QR Code eliminato' });
  } catch (err) {
    console.error('Errore deleteQrCode:', err);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

// GET /api/qr-codes/:uuid/image - Genera immagine PNG del QR code
const getQrCodeImage = async (req, res) => {
  try {
    const { uuid } = req.params;
    const code = await database.get('SELECT * FROM qr_codes WHERE uuid = ?', [uuid]);
    if (!code) return res.status(404).json({ success: false, message: 'QR Code non trovato' });

    // Costruisci l'URL di redirect
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host');
    const redirectUrl = `${protocol}://${host}/api/qr-redirect/${uuid}`;

    const buffer = await QRCode.toBuffer(redirectUrl, {
      type: 'png',
      errorCorrectionLevel: 'M',
      width: 512,
      margin: 2,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qr-${code.name}.png"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache per 1 ora
    res.send(buffer);
  } catch (err) {
    console.error('Errore getQrCodeImage:', err);
    res.status(500).json({ success: false, message: 'Errore generazione immagine' });
  }
};

// GET /api/qr-redirect/:uuid - Redirect pubblico
const handleRedirect = async (req, res) => {
  try {
    const { uuid } = req.params;
    const code = await database.get('SELECT * FROM qr_codes WHERE uuid = ?', [uuid]);
    
    if (!code) {
      return res.status(404).send('QR Code non valido o scaduto');
    }

    res.redirect(code.destination_url);
  } catch (err) {
    console.error('Errore handleRedirect:', err);
    res.status(500).send('Errore del server');
  }
};

module.exports = {
  listQrCodes,
  createQrCode,
  updateQrCode,
  deleteQrCode,
  getQrCodeImage,
  handleRedirect,
  qrCodeValidation
};
