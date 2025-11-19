const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Configurazione multer per il caricamento in memoria
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accetta solo immagini
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo file immagine sono permessi!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

// Middleware per processare e salvare l'immagine
const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Genera un nome file unico
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `product_${timestamp}_${randomString}.webp`;
    const filepath = path.join(__dirname, '../uploads/products', filename);

    // Assicurati che la directory esista
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    // Ridimensiona e ottimizza l'immagine
    await sharp(req.file.buffer)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    // Aggiungi il percorso del file alla richiesta
    req.imagePath = `/uploads/products/${filename}`;
    next();
  } catch (error) {
    console.error('Errore nel processamento dell\'immagine:', error);
    res.status(500).json({ error: 'Errore nel processamento dell\'immagine' });
  }
};

module.exports = {
  upload: upload.single('image'),
  processImage
};