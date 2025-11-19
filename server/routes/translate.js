const express = require('express');
const router = express.Router();
const { translateToEnglish } = require('../services/translationService');

/**
 * POST /api/translate
 * Traduce un testo dall'italiano all'inglese
 */
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Testo da tradurre richiesto' 
      });
    }

    const translation = await translateToEnglish(text);
    
    res.json({ 
      original: text,
      translation: translation,
      success: true 
    });
  } catch (error) {
    console.error('Errore nella traduzione:', error);
    res.status(500).json({ 
      error: 'Errore interno del server durante la traduzione',
      success: false 
    });
  }
});

module.exports = router;