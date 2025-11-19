const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { translateToEnglish } = require('../services/translationService');

// Validazione per ingredienti
const ingredientValidation = [
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
    .isLength({ max: 255 })
    .withMessage('L\'icona deve essere massimo 255 caratteri')
];

// GET /api/ingredients - Ottieni tutti gli ingredienti
const getIngredients = async (req, res) => {
  try {
    // Ottieni tutti gli ingredienti
    const ingredients = await database.select('ingredients', '*', 'ORDER BY name ASC');
    
    // Aggiungi l'icona di default se necessario
    const ingredientsWithDefaults = ingredients.map(ingredient => ({
      ...ingredient,
      icon: ingredient.icon || '🥄'
    }));
    
    res.json({
      success: true,
      data: { ingredients: ingredientsWithDefaults }
    });
  } catch (error) {
    console.error('Errore nel recupero degli ingredienti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// GET /api/ingredients/:id - Ottieni un ingrediente per ID
const getIngredientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ingredient = await database.select('ingredients', '*', 'WHERE id = ?', [id]);
    
    if (!ingredient || ingredient.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente non trovato'
      });
    }
    
    const result = {
      ...ingredient[0],
      icon: ingredient[0].icon || '🥄'
    };
    
    res.json({
      success: true,
      data: { ingredient: result }
    });
  } catch (error) {
    console.error('Errore nel recupero dell\'ingrediente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// POST /api/ingredients - Crea un nuovo ingrediente
const createIngredient = async (req, res) => {
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
    
    // Verifica se esiste già un ingrediente con lo stesso nome
    const existing = await database.select('ingredients', '*', 'WHERE LOWER(name) = LOWER(?)', [name]);
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Esiste già un ingrediente con questo nome'
      });
    }
    
    // Usa il valore manuale se fornito, altrimenti traduci automaticamente
    const nameEn = name_en && name_en.trim() ? name_en.trim() : await translateToEnglish(name);
    
    // Crea l'ingrediente
    const result = await database.insert('ingredients', {
      name: name.trim(),
      name_en: nameEn,
      icon: icon && icon.trim() ? icon.trim() : null
    });
    
    const ingredientId = result.lastID;
    
    // Ottieni l'ingrediente appena creato
    const newIngredient = await database.select('ingredients', '*', 'WHERE id = ?', [ingredientId]);
    
    res.status(201).json({
      success: true,
      message: 'Ingrediente creato con successo',
      data: { 
        ingredient: {
          ...newIngredient[0],
          icon: newIngredient[0].icon || '🥄'
        }
      }
    });
  } catch (error) {
    console.error('Errore nella creazione dell\'ingrediente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// PUT /api/ingredients/:id - Aggiorna un ingrediente
const updateIngredient = async (req, res) => {
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
    
    // Verifica se l'ingrediente esiste
    const existing = await database.select('ingredients', '*', 'WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente non trovato'
      });
    }
    
    // Verifica se esiste già un altro ingrediente con lo stesso nome
    const duplicate = await database.select('ingredients', '*', 'WHERE LOWER(name) = LOWER(?) AND id != ?', [name, id]);
    if (duplicate && duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Esiste già un ingrediente con questo nome'
      });
    }
    
    // Usa il valore manuale se fornito, altrimenti traduci automaticamente
    const nameEn = name_en && name_en.trim() ? name_en.trim() : await translateToEnglish(name);
    
    // Aggiorna l'ingrediente
    await database.update('ingredients', {
      name: name.trim(),
      name_en: nameEn,
      icon: icon && icon.trim() ? icon.trim() : null
    }, 'WHERE id = ?', [id]);
    
    // Ottieni l'ingrediente aggiornato
    const updatedIngredient = await database.select('ingredients', '*', 'WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Ingrediente aggiornato con successo',
      data: { 
        ingredient: {
          ...updatedIngredient[0],
          icon: updatedIngredient[0].icon || '🥄'
        }
      }
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'ingrediente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// DELETE /api/ingredients/:id - Elimina un ingrediente
const deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica se l'ingrediente esiste
    const existing = await database.select('ingredients', '*', 'WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ingrediente non trovato'
      });
    }
    
    // Elimina l'ingrediente
    await database.delete('ingredients', 'WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Ingrediente eliminato con successo'
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'ingrediente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

module.exports = {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  ingredientValidation
};