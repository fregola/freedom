# Sistema Portale Gestione Menu Ristorante

Un sistema completo per la gestione del menu di un ristorante con autenticazione sicura, gestione allergeni, ingredienti e struttura gerarchica delle categorie.

## Caratteristiche Principali

- 🔐 **Autenticazione sicura** con JWT
- 🥜 **Gestione allergeni** con icone personalizzabili
- 🥕 **Gestione ingredienti** con icone personalizzabili
- 📂 **Struttura gerarchica categorie** (padre-figlio)
- 🎨 **Design moderno e responsive**
- 🚀 **API RESTful** ben strutturate
- 🧪 **Testing** completo

## Architettura Tecnica

### Backend
- **Framework**: Express.js
- **Database**: SQLite3
- **Autenticazione**: JWT (JSON Web Tokens)
- **Validazione**: express-validator
- **Sicurezza**: helmet, bcryptjs, rate limiting

### Frontend
- **Framework**: React 18 con TypeScript
- **Styling**: styled-components (CSS-in-JS)
- **Routing**: React Router
- **HTTP Client**: Axios
- **Design**: Responsive e moderno

## Installazione

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd menu
   ```

2. **Installa tutte le dipendenze**
   ```bash
   npm run install:all
   ```

3. **Configura le variabili d'ambiente**
   - Modifica `server/.env` con le tue configurazioni

4. **Inizializza il database**
   ```bash
   cd server
   npm run migrate
   ```

## Utilizzo

### Sviluppo
```bash
# Avvia sia backend che frontend in modalità sviluppo
npm run dev
```

### Produzione
```bash
# Build del frontend
npm run client:build

# Avvia il server
npm run server:start
```

## Testing

```bash
# Test backend
npm test

# Test frontend
npm run test:client
```

## Struttura del Progetto

```
menu/
├── server/                 # Backend API
│   ├── controllers/        # Controller delle API
│   ├── models/            # Modelli database
│   ├── routes/            # Route delle API
│   ├── middleware/        # Middleware personalizzati
│   ├── database/          # File database SQLite
│   └── tests/             # Test backend
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # Componenti riutilizzabili
│   │   ├── pages/         # Pagine principali
│   │   ├── services/      # Servizi API
│   │   ├── styles/        # Stili globali
│   │   └── utils/         # Utility functions
│   └── public/            # Asset statici
└── README.md
```

## API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente
- `POST /api/auth/register` - Registrazione utente

### Allergeni
- `GET /api/allergens` - Lista allergeni
- `POST /api/allergens` - Crea allergene
- `PUT /api/allergens/:id` - Aggiorna allergene
- `DELETE /api/allergens/:id` - Elimina allergene

### Ingredienti
- `GET /api/ingredients` - Lista ingredienti
- `POST /api/ingredients` - Crea ingrediente
- `PUT /api/ingredients/:id` - Aggiorna ingrediente
- `DELETE /api/ingredients/:id` - Elimina ingrediente

### Categorie
- `GET /api/categories` - Lista categorie (struttura ad albero)
- `POST /api/categories` - Crea categoria
- `PUT /api/categories/:id` - Aggiorna categoria
- `DELETE /api/categories/:id` - Elimina categoria

## Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## Licenza

Questo progetto è sotto licenza MIT - vedi il file [LICENSE](LICENSE) per i dettagli.