const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { translateToEnglish } = require('../services/translationService');

// Validazione per allergeni
const allergenValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Il nome deve essere tra 1 e 100 caratteri'),
  body('name_en')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Il nome inglese non può superare i 100 caratteri'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('L\'icona non può superare i 50 caratteri')
];

// GET /api/allergens - Ottieni tutti gli allergeni
const getAllergens = async (req, res) => {
  try {
    const allergens = await database.select('allergens', '*', 'ORDER BY name ASC');
    
    // Aggiungi icona di default se mancante
    const allergensWithDefaultIcon = allergens.map(allergen => ({
      ...allergen,
      icon: allergen.icon || '⚠️' // Triangolo giallo come emoji di default
    }));
    
    res.json({
      success: true,
      data: { allergens: allergensWithDefaultIcon }
    });
  } catch (error) {
    console.error('Errore nel recupero degli allergeni:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// GET /api/allergens/:id - Ottieni un allergene specifico
const getAllergenById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const allergen = await database.select('allergens', '*', 'WHERE id = ?', [id]);
    
    if (!allergen || allergen.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Allergene non trovato'
      });
    }
    
    // Aggiungi icona di default se mancante
    const allergenWithDefaultIcon = {
      ...allergen[0],
      icon: allergen[0].icon || '⚠️' // Triangolo giallo come emoji di default
    };
    
    res.json({
      success: true,
      data: { allergen: allergenWithDefaultIcon }
    });
  } catch (error) {
    console.error('Errore nel recupero dell\'allergene:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// POST /api/allergens - Crea un nuovo allergene
const createAllergen = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }
    
    const { name, name_en, icon } = req.body;
    
    // Verifica se esiste già un allergene con lo stesso nome
    const existing = await database.select('allergens', '*', 'WHERE LOWER(name) = LOWER(?)', [name]);
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Esiste già un allergene con questo nome'
      });
    }
    
    // Usa il valore manuale se fornito, altrimenti traduci automaticamente
    const nameEn = name_en && name_en.trim() ? name_en.trim() : await translateToEnglish(name);
    if (!name_en) {
      console.log(`Traduzione per "${name}": "${nameEn}"`);
    }
    
    const result = await database.insert('allergens', {
      name: name.trim(),
      name_en: nameEn,
      icon: icon ? icon.trim() : null
    });
    
    console.log('Dati inseriti nel database:', {
      name: name.trim(),
      name_en: nameEn,
      icon: icon ? icon.trim() : null
    });
    
    const newAllergen = await database.select('allergens', '*', 'WHERE id = ?', [result.lastID]);
    
    // Aggiungi icona di default se mancante
    const allergenWithDefaultIcon = {
      ...newAllergen[0],
      icon: newAllergen[0].icon || '⚠️' // Triangolo giallo come emoji di default
    };
    
    res.status(201).json({
      success: true,
      message: 'Allergene creato con successo',
      data: { allergen: allergenWithDefaultIcon }
    });
  } catch (error) {
    console.error('Errore nella creazione dell\'allergene:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// PUT /api/allergens/:id - Aggiorna un allergene
const updateAllergen = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { name, name_en, icon } = req.body;
    
    // Verifica se l'allergene esiste
    const existing = await database.select('allergens', '*', 'WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Allergene non trovato'
      });
    }
    
    // Verifica se esiste già un altro allergene con lo stesso nome
    const duplicate = await database.select('allergens', '*', 'WHERE LOWER(name) = LOWER(?) AND id != ?', [name, id]);
    if (duplicate && duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Esiste già un allergene con questo nome'
      });
    }
    
    // Usa il valore manuale se fornito, altrimenti traduci automaticamente
    const nameEn = name_en && name_en.trim() ? name_en.trim() : await translateToEnglish(name);
    
    await database.update('allergens', {
      name: name.trim(),
      name_en: nameEn,
      icon: icon ? icon.trim() : null
    }, 'WHERE id = ?', [id]);
    
    const updatedAllergen = await database.select('allergens', '*', 'WHERE id = ?', [id]);
    
    // Aggiungi icona di default se mancante
    const allergenWithDefaultIcon = {
      ...updatedAllergen[0],
      icon: updatedAllergen[0].icon || '⚠️' // Triangolo giallo come emoji di default
    };
    
    res.json({
      success: true,
      message: 'Allergene aggiornato con successo',
      data: { allergen: allergenWithDefaultIcon }
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'allergene:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// DELETE /api/allergens/:id - Elimina un allergene
const deleteAllergen = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se l'allergene esiste
    const existing = await database.select('allergens', '*', 'WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Allergene non trovato'
      });
    }
    
    await database.delete('allergens', 'WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Allergene eliminato con successo'
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'allergene:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

module.exports = {
  getAllergens,
  getAllergenById,
  createAllergen,
  updateAllergen,
  deleteAllergen,
  allergenValidation
};