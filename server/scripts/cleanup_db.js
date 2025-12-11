const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/restaurant.db');
const db = new sqlite3.Database(dbPath);

console.log('🧹 Inizio pulizia database (Rimozione tabelle Sala)...');

db.serialize(() => {
    // Lista tabelle da rimuovere
    const tables = ['room_walls', 'room_tables', 'rooms'];
    
    tables.forEach(table => {
        db.run(`DROP TABLE IF EXISTS ${table}`, (err) => {
            if (err) {
                console.error(`❌ Errore rimozione ${table}:`, err.message);
            } else {
                console.log(`✅ Tabella rimossa: ${table}`);
            }
        });
    });
});

db.close((err) => {
    if (err) {
        console.error('❌ Errore chiusura connessione:', err.message);
    } else {
        console.log('🏁 Pulizia completata.');
    }
});
