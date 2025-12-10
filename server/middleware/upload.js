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

const processPopupImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `popup_${timestamp}_${randomString}.webp`;
    const filepath = path.join(__dirname, '../uploads/popups', filename);

    await fs.mkdir(path.dirname(filepath), { recursive: true });

    // For popups, we might want higher resolution or just different logic
    // Keeping it simple but allowing slightly larger
    await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    req.imagePath = `/uploads/popups/${filename}`;
    next();
  } catch (error) {
    console.error('Errore nel processamento dell\'immagine popup:', error);
    res.status(500).json({ error: 'Errore nel processamento dell\'immagine popup' });
  }
};

module.exports = {
  upload: upload.single('image'),
  processImage,
  processPopupImage,
  uploadVideo: multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Solo file video sono permessi!'), false);
      }
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
  }).single('video'),
  processPopupVideo: async (req, res, next) => {
    if (!req.file) return next();
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const ext = path.extname(req.file.originalname) || '.mp4';
      const filename = `popup_video_${timestamp}_${randomString}${ext}`;
      const filepath = path.join(__dirname, '../uploads/popups', filename);

      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.writeFile(filepath, req.file.buffer);

      req.videoPath = `/uploads/popups/${filename}`;
      next();
    } catch (error) {
      console.error('Errore nel processamento del video popup:', error);
      res.status(500).json({ error: 'Errore nel processamento del video popup' });
    }
  }
};