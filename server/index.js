const path = require('path');
const fs = require('fs');
// Carica .env dalla cartella server; se non esiste, usa .env.production (versionato)
const envDefault = path.join(__dirname, '.env');
const envProd = path.join(__dirname, '.env.production');
const envPath = fs.existsSync(envDefault) ? envDefault : envProd;
require('dotenv').config({ path: envPath });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const database = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);

// Origini permesse (configurabili via env ALLOWED_ORIGINS)
const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5001'
];
const normalizeOrigin = (s) => {
    if (!s) return '';
    return s
        .trim()
        .replace(/^`+|`+$/g, '')
        .replace(/^"+|"+$/g, '')
        .replace(/^'+|'+$/g, '')
        .replace(/\/$/, '');
};
const ENV_ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
const IS_PROD = (process.env.NODE_ENV || 'development') === 'production';
const IS_DEV = !IS_PROD;
const ALLOWED_ORIGINS = Array.from(new Set(
    ENV_ALLOWED_ORIGINS.length
        ? (IS_PROD ? ENV_ALLOWED_ORIGINS : [...ENV_ALLOWED_ORIGINS, ...DEFAULT_ALLOWED_ORIGINS])
        : DEFAULT_ALLOWED_ORIGINS
));

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for Socket.IO
        methods: ['GET', 'POST'],
        credentials: true
    }
});
const PORT = process.env.PORT || 5001;

// Middleware di sicurezza
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", ...ALLOWED_ORIGINS],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));

// Configurazione CORS
app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins for now to fix connection issues
        // In a real production environment, you might want to be more specific,
        // but for this specific deployment scenario with subdomains/proxies,
        // we'll be permissive to ensure connectivity.
        callback(null, true); 
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 1000, // massimo 1000 richieste per IP ogni 15 minuti (aumentato per testing)
    message: {
        success: false,
        message: 'Troppe richieste da questo IP, riprova più tardi'
    }
});
app.use('/api/', limiter);

// Rate limiting più restrittivo per auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 50, // massimo 50 tentativi di login per IP ogni 15 minuti (aumentato per testing)
    message: {
        success: false,
        message: 'Troppi tentativi di login, riprova più tardi'
    }
});
app.use('/api/auth/login', authLimiter);

// Parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servire file statici con CORS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Alias sotto /api per compatibilità con proxy di produzione
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));


if (IS_DEV) {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Configurazione Socket.IO
io.on('connection', (socket) => {
    if (IS_DEV) console.log('🔌 Client connesso:', socket.id);
    socket.on('disconnect', () => {
        if (IS_DEV) console.log('🔌 Client disconnesso:', socket.id);
    });
});

// Rendi io disponibile globalmente per i controller
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/allergens', require('./routes/allergens'));
app.use('/api/ingredients', require('./routes/ingredients'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/custom-menus', require('./routes/customMenus'));
app.use('/api/business', require('./routes/business'));
app.use('/api/translate', require('./routes/translate'));
app.use('/api/qr-codes', require('./routes/qrCodes'));
app.use('/api/popups', require('./routes/popups'));

// Route pubblica per redirect QR code (definita qui per non richiedere auth)
const { handleRedirect } = require('./controllers/qrCodeController');
app.get('/api/qr-redirect/:uuid', handleRedirect);

// Route per informazioni API
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'API Sistema Gestione Menu Ristorante',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            allergens: '/api/allergens',
            ingredients: '/api/ingredients',
            categories: '/api/categories'
        }
    });
});

// Route di test
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server funzionante',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

const CLIENT_BUILD_DIR = path.join(__dirname, '../client/build');
if (fs.existsSync(CLIENT_BUILD_DIR)) {
    // Serve static files but disable automatic index.html serving
    app.use(express.static(CLIENT_BUILD_DIR, { index: false }));

    // Handler for serving index.html with dynamic meta tags
    const serveIndex = async (req, res) => {
        try {
            const indexPath = path.join(CLIENT_BUILD_DIR, 'index.html');
            let htmlData = await fs.promises.readFile(indexPath, 'utf8');

            try {
                // Fetch business info for meta tags
                const businessInfo = await database.get('SELECT * FROM business_info WHERE id = 1');
                if (businessInfo) {
                    const { name, description, address, city, phone } = businessInfo;

                    const title = name || 'PubFreedom';
                    let metaDesc = description || '';

                    // Build contact info string
                    const parts = [];
                    if (address) parts.push(address);
                    if (city) parts.push(city);
                    if (phone) parts.push(`Tel: ${phone}`);

                    const contactStr = parts.join(' - ');
                    if (contactStr) {
                        metaDesc = metaDesc ? `${metaDesc} | ${contactStr}` : contactStr;
                    }
                    if (!metaDesc) metaDesc = 'Scegli, Prenota, Gusta';

                    // Sanitize
                    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    const safeDesc = metaDesc.replace(/"/g, '&quot;');

                    // Replace Title
                    htmlData = htmlData.replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`);

                    // Replace Description
                    htmlData = htmlData.replace(
                        /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
                        `<meta name="description" content="${safeDesc}" />`
                    );

                    // Add Open Graph tags
                    const ogTags = `
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${safeTitle}" />`;

                    htmlData = htmlData.replace('</head>', `${ogTags}\n  </head>`);
                }
            } catch (dbErr) {
                console.error('Error injecting meta tags:', dbErr);
                // Continue with original HTML if DB fails
            }

            res.send(htmlData);
        } catch (err) {
            console.error('Error reading index.html:', err);
            res.status(500).send('Server Error');
        }
    };

    app.get('/', serveIndex);

    // Handle SPA routing (for non-API routes)
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.includes('.')) {
            return next();
        }
        serveIndex(req, res);
    });

} else {
    app.get('/', (req, res) => {
        res.status(200).send('API server');
    });
}



// Middleware per gestire route non trovate
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint non trovato'
    });
});

// Middleware per gestire errori globali
app.use((error, req, res, next) => {
    console.error('Errore globale:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Errore interno del server',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Inizializzazione server
async function startServer() {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is required');
        }
        // Inizializza il database
        await database.connect();
        console.log('✅ Database connesso');

        // Migrazioni rapide: garantisci colonne necessarie per i controller
        await database.ensureColumn('allergens', 'name_en', 'VARCHAR(100)');
        await database.ensureColumn('ingredients', 'name_en', 'VARCHAR(100)');
        await database.ensureColumn('users', 'is_active', 'BOOLEAN DEFAULT 1');
        // Ordinamento categorie per il menu pubblico
        await database.ensureColumn('categories', 'sort_order', 'INTEGER DEFAULT 0');
        // Unità di prezzo per i prodotti (g, hg, l)
        await database.ensureColumn('products', 'price_unit', 'VARCHAR(20)');
        // Tabelle per menu personalizzati (creazione se mancanti)
        await database.run(`CREATE TABLE IF NOT EXISTS custom_menus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(120) NOT NULL,
            price DECIMAL(10,2),
            start_date DATE,
            end_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        await database.run(`CREATE TABLE IF NOT EXISTS custom_menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            custom_menu_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            position INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (custom_menu_id) REFERENCES custom_menus(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )`);
        await database.run(`CREATE INDEX IF NOT EXISTS idx_custom_menu_items_menu ON custom_menu_items(custom_menu_id)`);
        await database.run(`CREATE INDEX IF NOT EXISTS idx_custom_menu_items_position ON custom_menu_items(custom_menu_id, position)`);
        // Aggiungi colonna visibilità se manca
        await database.ensureColumn('custom_menus', 'is_visible', 'BOOLEAN DEFAULT 0');

        // Tabella popup
        await database.run(`CREATE TABLE IF NOT EXISTS popups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            is_active BOOLEAN DEFAULT 0,
            title VARCHAR(255),
            body_text TEXT,
            image_url VARCHAR(255),
            button_text VARCHAR(100),
            button_link VARCHAR(255),
            style_config TEXT,
            trigger_type VARCHAR(50),
            trigger_delay INTEGER DEFAULT 0,
            frequency VARCHAR(50),
            blocks TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabella QR codes
        await database.run(`CREATE TABLE IF NOT EXISTS qr_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid VARCHAR(36) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            destination_url VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Garantisci che l'utente admin sia attivo se presente
        try {
            await database.run('UPDATE users SET is_active = 1 WHERE username = ? AND (is_active IS NULL OR is_active = 0)', ['admin']);
        } catch (e) {
            console.warn('Impossibile forzare is_active=1 per admin:', e?.message);
        }

        // Avvia il server HTTP con Socket.IO
        server.listen(PORT, () => {
            if (IS_DEV) {
                console.log(`🚀 Server avviato su porta ${PORT}`);
                console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
                console.log(`📡 API disponibili su: http://localhost:${PORT}/api`);
                console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
                console.log(`🔌 Socket.IO attivo per aggiornamenti in tempo reale`);
            }
        });

    } catch (error) {
        console.error('❌ Errore avvio server:', error);
        process.exit(1);
    }
}

// Gestione graceful shutdown
process.on('SIGINT', async () => {
    if (IS_DEV) console.log('\n🛑 Ricevuto SIGINT, chiusura server...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (IS_DEV) console.log('\n🛑 Ricevuto SIGTERM, chiusura server...');
    await database.close();
    process.exit(0);
});

// Avvia il server
startServer();

module.exports = app;