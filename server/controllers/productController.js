const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { translateToEnglish } = require('../services/translationService');

// Helper function per convertire correttamente i valori booleani da SQLite
const convertSQLiteBoolean = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') return value === 1;
  return Boolean(value);
};

// Validazione per prodotti
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Il nome deve essere tra 1 e 100 caratteri'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Il prezzo deve essere un numero positivo'),
  body('price_unit')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // Consenti null o stringa vuota per rimuovere l'unità
      if (value === null || value === '') return true;
      if (['g', 'hg', 'l'].includes(value)) return true;
      throw new Error("L'unità di prezzo deve essere una tra: g, hg, l");
    }),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID categoria deve essere un numero intero positivo'),
  body('image_path')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Il percorso immagine deve essere massimo 255 caratteri'),
  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('La disponibilità deve essere true o false'),
  body('ingredient_ids')
    .optional()
    .isArray()
    .withMessage('Gli ingredienti devono essere un array'),
  body('ingredient_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ogni ID ingrediente deve essere un numero intero positivo')
];

// GET /api/products/search/:query - Cerca prodotti per nome, descrizione o categoria
const searchProducts = async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La ricerca deve contenere almeno 2 caratteri'
      });
    }
    
    const searchTerm = `%${query.trim()}%`;
    
    // Query per cercare prodotti per nome, nome inglese, descrizione o categoria
    const searchQuery = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE (
          p.name LIKE ? COLLATE NOCASE
          OR p.name_en LIKE ? COLLATE NOCASE
          OR p.description LIKE ? COLLATE NOCASE
          OR c.name LIKE ? COLLATE NOCASE
        )
        AND p.is_available = 1
      ORDER BY 
        CASE 
          WHEN p.name LIKE ? COLLATE NOCASE THEN 1
          WHEN p.name_en LIKE ? COLLATE NOCASE THEN 2
          WHEN c.name LIKE ? COLLATE NOCASE THEN 3
          ELSE 4
        END,
        p.name ASC
    `;
    
    const products = await database.all(searchQuery, [
      searchTerm, searchTerm, searchTerm, searchTerm,
      searchTerm, searchTerm, searchTerm
    ]);
    
    // Per ogni prodotto, ottieni allergeni e ingredienti associati
    const productsWithRelations = await Promise.all(
      products.map(async (product) => {
        // Ottieni gli allergeni associati al prodotto
        const allergens = await database.all(`
          SELECT a.* 
          FROM allergens a
          JOIN product_allergens pa ON a.id = pa.allergen_id
          WHERE pa.product_id = ?
        `, [product.id]);
        
        // Ottieni gli ingredienti associati al prodotto
        const ingredients = await database.all(`
          SELECT i.* 
          FROM ingredients i
          JOIN product_ingredients pi ON i.id = pi.ingredient_id
          WHERE pi.product_id = ?
        `, [product.id]);
        
        return {
          ...product,
          price: product.price || 0,
          is_available: convertSQLiteBoolean(product.is_available),
          allergens,
          ingredients
        };
      })
    );
    
    res.json({
      success: true,
      data: { 
        products: productsWithRelations,
        query: query.trim(),
        count: productsWithRelations.length
      }
    });
  } catch (error) {
    console.error('Errore nella ricerca dei prodotti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// GET /api/products - Ottieni tutti i prodotti
const getProducts = async (req, res) => {
  try {
    // Query per ottenere prodotti con informazioni categoria
    const query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name ASC
    `;
    
    const products = await database.all(query);
    
    // Per ogni prodotto, ottieni allergeni e ingredienti associati
    const productsWithRelations = await Promise.all(
      products.map(async (product) => {
        // Ottieni gli allergeni associati al prodotto
        const allergens = await database.all(`
          SELECT a.* 
          FROM allergens a
          JOIN product_allergens pa ON a.id = pa.allergen_id
          WHERE pa.product_id = ?
        `, [product.id]);
        
        // Ottieni gli ingredienti associati al prodotto
        const ingredients = await database.all(`
          SELECT i.* 
          FROM ingredients i
          JOIN product_ingredients pi ON i.id = pi.ingredient_id
          WHERE pi.product_id = ?
        `, [product.id]);
        
        return {
          ...product,
          price: product.price || 0,
          is_available: convertSQLiteBoolean(product.is_available),
          allergens,
          ingredients
        };
      })
    );
    
    res.json({
      success: true,
      data: { products: productsWithRelations }
    });
  } catch (error) {
    console.error('Errore nel recupero dei prodotti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// GET /api/products/:id - Ottieni un prodotto per ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    
    const product = await database.get(query, [id]);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Prodotto non trovato'
      });
    }
    
    // Ottieni gli allergeni associati al prodotto
    const allergens = await database.all(`
      SELECT a.* 
      FROM allergens a
      JOIN product_allergens pa ON a.id = pa.allergen_id
      WHERE pa.product_id = ?
    `, [id]);
    
    // Ottieni gli ingredienti associati al prodotto
    const ingredients = await database.all(`
      SELECT i.* 
      FROM ingredients i
      JOIN product_ingredients pi ON i.id = pi.ingredient_id
      WHERE pi.product_id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: { 
        product: {
          ...product,
          price: product.price || 0,
          is_available: convertSQLiteBoolean(product.is_available),
          allergens,
          ingredients
        }
      }
    });
  } catch (error) {
    console.error('Errore nel recupero del prodotto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// GET /api/products/category/:categoryId - Ottieni prodotti per categoria
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Query per ottenere solo prodotti disponibili di una categoria specifica (incluse sottocategorie ricorsivamente)
    const query = `
      WITH RECURSIVE category_tree AS (
        SELECT id FROM categories WHERE id = ?
        UNION ALL
        SELECT c.id FROM categories c
        JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id IN (SELECT id FROM category_tree)
      AND p.is_available = 1
      ORDER BY p.name ASC
    `;
    
    const products = await database.all(query, [categoryId]);
    
    // Per ogni prodotto, ottieni allergeni e ingredienti associati
    const productsWithRelations = await Promise.all(
      products.map(async (product) => {
        // Ottieni gli allergeni associati al prodotto
        const allergens = await database.all(`
          SELECT a.* 
          FROM allergens a
          JOIN product_allergens pa ON a.id = pa.allergen_id
          WHERE pa.product_id = ?
        `, [product.id]);
        
        // Ottieni gli ingredienti associati al prodotto
        const ingredients = await database.all(`
          SELECT i.* 
          FROM ingredients i
          JOIN product_ingredients pi ON i.id = pi.ingredient_id
          WHERE pi.product_id = ?
        `, [product.id]);
        
        return {
          ...product,
          price: product.price || 0,
          is_available: convertSQLiteBoolean(product.is_available),
          allergens,
          ingredients
        };
      })
    );
    
    // Ottieni anche le informazioni della categoria
    const categoryInfo = await database.get(`
      SELECT * FROM categories WHERE id = ?
    `, [categoryId]);
    
    res.json({
      success: true,
      data: { 
        products: productsWithRelations,
        category: categoryInfo
      }
    });
  } catch (error) {
    console.error('Errore nel recupero dei prodotti per categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// GET /api/products/by-ids?ids=1,2,3 - Ottieni prodotti per lista di ID
const getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.query;
    const raw = Array.isArray(ids) ? ids.join(',') : String(ids || '').trim();
    if (!raw) {
      return res.status(400).json({ success: false, message: 'Parametro ids richiesto' });
    }
    const idList = raw.split(',').map((s) => parseInt(s, 10)).filter((n) => Number.isFinite(n));
    if (idList.length === 0) {
      return res.status(400).json({ success: false, message: 'Nessun ID valido fornito' });
    }
    const placeholders = idList.map(() => '?').join(',');
    const query = `
      SELECT 
        p.*, 
        c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id IN (${placeholders}) 
      ORDER BY p.name ASC
    `;
    const products = await database.all(query, idList);
    const productsWithRelations = await Promise.all(
      products.map(async (product) => {
        const allergens = await database.all(
          `SELECT a.* FROM allergens a JOIN product_allergens pa ON a.id = pa.allergen_id WHERE pa.product_id = ?`,
          [product.id]
        );
        const ingredients = await database.all(
          `SELECT i.* FROM ingredients i JOIN product_ingredients pi ON i.id = pi.ingredient_id WHERE pi.product_id = ?`,
          [product.id]
        );
        return {
          ...product,
          price: product.price || 0,
          is_available: convertSQLiteBoolean(product.is_available),
          allergens,
          ingredients,
        };
      })
    );
    res.json({ success: true, data: { products: productsWithRelations } });
  } catch (error) {
    console.error('Errore nel recupero prodotti per IDs:', error);
    res.status(500).json({ success: false, message: 'Errore interno del server' });
  }
};

// POST /api/products - Crea un nuovo prodotto
const createProduct = async (req, res) => {
  try {
    // Validazione input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }
    
    const { name, name_en: provided_name_en, description, description_en, price, price_unit, category_id, is_available, allergen_ids, ingredient_ids } = req.body;
    
    // Debug: log dei dati ricevuti
    console.log('Dati ricevuti nel body:', {
      name,
      provided_name_en,
      description,
      description_en,
      price,
      price_unit,
      category_id,
      is_available,
      allergen_ids,
      ingredient_ids,
      'allergen_ids[]': req.body['allergen_ids[]'],
      'ingredient_ids[]': req.body['ingredient_ids[]']
    });
    
    // Gestione corretta degli array da FormData
    const processedAllergenIds = req.body['allergen_ids[]'] || allergen_ids || [];
    const processedIngredientIds = req.body['ingredient_ids[]'] || ingredient_ids || [];
    
    console.log('Array processati:', {
      processedAllergenIds,
      processedIngredientIds
    });
    
    // Gestione del nome inglese
    let name_en;
    if (provided_name_en !== undefined && provided_name_en !== '') {
      // Se l'utente ha fornito un name_en, usalo
      name_en = provided_name_en;
    } else {
      // Altrimenti genera traduzione automatica
      name_en = await translateToEnglish(name);
    }
    
    // Usa il percorso dell'immagine caricata se disponibile
    const image_path = req.imagePath || null;
    
    // Converti is_available da stringa a boolean se necessario
    let availableValue = true; // default
    if (is_available !== undefined) {
      if (typeof is_available === 'string') {
        availableValue = is_available === 'true';
      } else {
        availableValue = Boolean(is_available);
      }
    }

    // Inserisci il prodotto
    const productData = {
      name,
      name_en,
      description: description || null,
      description_en: description_en || null,
      price: price || null,
      price_unit: price_unit || null,
      category_id: category_id || null,
      image_path,
      is_available: availableValue
    };
    
    const result = await database.insert('products', productData);
    const productId = result.lastID;
    
    // Associa allergeni se forniti
    if (processedAllergenIds && Array.isArray(processedAllergenIds) && processedAllergenIds.length > 0) {
      for (const allergenId of processedAllergenIds) {
        await database.insert('product_allergens', {
          product_id: productId,
          allergen_id: allergenId
        });
      }
    }
    
    // Associa ingredienti se forniti
    if (processedIngredientIds && Array.isArray(processedIngredientIds) && processedIngredientIds.length > 0) {
      for (const ingredientId of processedIngredientIds) {
        await database.insert('product_ingredients', {
          product_id: productId,
          ingredient_id: ingredientId
        });
      }
    }
    
    // Recupera il prodotto creato con le relazioni
    const createdProduct = await database.get(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [productId]);

    // Emetti evento Socket.IO per notificare l'aggiunta del prodotto
    const io = req.app.get('io');
    if (io) {
      io.emit('product_added', {
        product: createdProduct,
        timestamp: new Date().toISOString()
      });
      console.log('🔌 Evento product_added emesso per prodotto:', createdProduct.name);
    }

    res.status(201).json({
      success: true,
      message: 'Prodotto creato con successo',
      data: { product: createdProduct }
    });
  } catch (error) {
    console.error('Errore nella creazione del prodotto:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        success: false,
        message: 'Un prodotto con questo nome esiste già nella stessa categoria'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// PUT /api/products/:id - Aggiorna un prodotto
const updateProduct = async (req, res) => {
  try {
    // Validazione input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const { name, name_en: provided_name_en, price, price_unit, category_id, is_available, allergen_ids, ingredient_ids } = req.body;
    
    // Debug: log dei dati ricevuti per update
    console.log('Dati ricevuti nel body (update):', {
      name,
      provided_name_en,
      price,
      price_unit,
      category_id,
      is_available,
      allergen_ids,
      ingredient_ids,
      'allergen_ids[]': req.body['allergen_ids[]'],
      'ingredient_ids[]': req.body['ingredient_ids[]']
    });
    
    // Gestione corretta degli array da FormData per update
    const processedAllergenIds = req.body['allergen_ids[]'] || allergen_ids || [];
    const processedIngredientIds = req.body['ingredient_ids[]'] || ingredient_ids || [];
    
    console.log('Array processati (update):', {
      processedAllergenIds,
      processedIngredientIds
    });
    
    // Verifica che il prodotto esista
    const existingProduct = await database.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Prodotto non trovato'
      });
    }
    
    // Gestione del nome inglese
    let name_en = existingProduct.name_en;
    
    // Se l'utente ha fornito un name_en, usalo
    if (provided_name_en !== undefined) {
      name_en = provided_name_en;
    }
    // Altrimenti, se il nome è cambiato e non c'è un name_en fornito, genera traduzione automatica
    else if (name && name !== existingProduct.name) {
      name_en = await translateToEnglish(name);
    }
    
    // Usa il nuovo percorso dell'immagine se caricata, altrimenti mantieni quello esistente
    const image_path = req.imagePath || existingProduct.image_path;
    
    // Converti is_available da stringa a boolean se necessario
    let availableValue = existingProduct.is_available; // mantieni il valore esistente come default
    if (is_available !== undefined) {
      if (typeof is_available === 'string') {
        availableValue = is_available === 'true';
      } else {
        availableValue = Boolean(is_available);
      }
    }
    
    // Normalizza price_unit: stringa vuota -> null se fornita
    const normalizedPriceUnit = (price_unit !== undefined && (price_unit === '' || price_unit === null))
      ? null
      : price_unit;

    // Aggiorna il prodotto
    const updateData = {
      name: name || existingProduct.name,
      name_en,
      description: description !== undefined ? description : existingProduct.description,
      description_en: description_en !== undefined ? description_en : existingProduct.description_en,
      price: price !== undefined ? price : existingProduct.price,
      price_unit: price_unit !== undefined ? normalizedPriceUnit : existingProduct.price_unit,
      category_id: category_id !== undefined ? category_id : existingProduct.category_id,
      image_path,
      is_available: availableValue
    };
    
    await database.update('products', updateData, 'WHERE id = ?', [id]);
    
    // Aggiorna associazioni allergeni se fornite
    if (processedAllergenIds !== undefined && Array.isArray(processedAllergenIds)) {
      // Rimuovi associazioni esistenti
      await database.run('DELETE FROM product_allergens WHERE product_id = ?', [id]);
      
      // Aggiungi nuove associazioni
      for (const allergenId of processedAllergenIds) {
        await database.insert('product_allergens', {
          product_id: id,
          allergen_id: allergenId
        });
      }
    }
    
    // Aggiorna associazioni ingredienti se fornite
    if (processedIngredientIds !== undefined && Array.isArray(processedIngredientIds)) {
      // Rimuovi associazioni esistenti
      await database.run('DELETE FROM product_ingredients WHERE product_id = ?', [id]);
      
      // Aggiungi nuove associazioni
      for (const ingredientId of processedIngredientIds) {
        await database.insert('product_ingredients', {
          product_id: id,
          ingredient_id: ingredientId
        });
      }
    }
    
    // Recupera il prodotto aggiornato
    const updatedProduct = await database.get(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    // Emetti evento Socket.IO per notificare l'aggiornamento del prodotto
    const io = req.app.get('io');
    if (io) {
      io.emit('product_updated', {
        product: updatedProduct,
        timestamp: new Date().toISOString()
      });
      console.log('🔌 Evento product_updated emesso per prodotto:', updatedProduct.name);
    }

    res.json({
      success: true,
      message: 'Prodotto aggiornato con successo',
      data: { product: updatedProduct }
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del prodotto:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        success: false,
        message: 'Un prodotto con questo nome esiste già nella stessa categoria'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// DELETE /api/products/:id - Elimina un prodotto
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica che il prodotto esista
    const existingProduct = await database.get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Prodotto non trovato'
      });
    }
    
    // Elimina il prodotto (le associazioni allergeni verranno eliminate automaticamente per CASCADE)
    await database.run('DELETE FROM products WHERE id = ?', [id]);

    // Emetti evento Socket.IO per notificare l'eliminazione del prodotto
    const io = req.app.get('io');
    if (io) {
      io.emit('product_deleted', {
        productId: id,
        productName: existingProduct.name,
        timestamp: new Date().toISOString()
      });
      console.log('🔌 Evento product_deleted emesso per prodotto:', existingProduct.name);
    }

    res.json({
      success: true,
      message: 'Prodotto eliminato con successo'
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione del prodotto:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductsByCategory,
  getProductsByIds,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  productValidation
};
