const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DB_PATH || path.join(__dirname, '../database/restaurant.db');
        this.schemaPath = path.join(__dirname, '../database/schema.sql');
        this.seedsPath = path.join(__dirname, '../database/seeds.sql');
    }

    /**
     * Inizializza la connessione al database
     */
    async connect() {
        return new Promise((resolve, reject) => {
            // Crea la directory del database se non esiste
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Errore connessione database:', err.message);
                    reject(err);
                } else {
                    console.log('Connesso al database SQLite:', this.dbPath);
                    // Abilita le foreign keys
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve();
                }
            });
        });
    }

    /**
     * Esegue lo schema del database
     */
    async runSchema() {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(this.schemaPath)) {
                reject(new Error(`File schema non trovato: ${this.schemaPath}`));
                return;
            }

            const schema = fs.readFileSync(this.schemaPath, 'utf8');
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Errore esecuzione schema:', err.message);
                    reject(err);
                } else {
                    console.log('Schema database eseguito con successo');
                    resolve();
                }
            });
        });
    }

    /**
     * Esegue i seed del database
     */
    async runSeeds() {
        return new Promise((resolve, reject) => {
            if (process.env.NODE_ENV === 'production') {
                console.log('Ambiente produzione rilevato: seeds non eseguiti');
                resolve();
                return;
            }
            if (!fs.existsSync(this.seedsPath)) {
                console.log('File seeds non trovato, saltando...');
                resolve();
                return;
            }

            const seeds = fs.readFileSync(this.seedsPath, 'utf8');
            this.db.exec(seeds, (err) => {
                if (err) {
                    console.error('Errore esecuzione seeds:', err.message);
                    reject(err);
                } else {
                    console.log('Seeds database eseguiti con successo');
                    resolve();
                }
            });
        });
    }

    /**
     * Inizializza completamente il database
     */
    async initialize() {
        try {
            await this.connect();
            await this.runSchema();
            await this.runSeeds();
            console.log('Database inizializzato completamente');
        } catch (error) {
            console.error('Errore inizializzazione database:', error);
            throw error;
        }
    }

    /**
     * Esegue una query SELECT
     */
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Esegue una query SELECT che restituisce più righe
     */
    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Esegue una query INSERT, UPDATE o DELETE
     */
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    /**
     * Helper per SELECT con sintassi semplificata
     */
    async select(table, columns = '*', whereClause = '', params = []) {
        let sql = `SELECT ${columns} FROM ${table}`;
        if (whereClause) {
            sql += ` ${whereClause}`;
        }
        return this.all(sql, params);
    }

    /**
     * Helper per INSERT con sintassi semplificata
     */
    async insert(table, data) {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        
        const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
        return this.run(sql, values);
    }

    /**
     * Helper per UPDATE con sintassi semplificata
     */
    async update(table, data, whereClause, params = []) {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), ...params];
        
        const sql = `UPDATE ${table} SET ${setClause} ${whereClause}`;
        return this.run(sql, values);
    }

    /**
     * Helper per DELETE con sintassi semplificata
     */
    async delete(table, whereClause, params = []) {
        const sql = `DELETE FROM ${table} ${whereClause}`;
        return this.run(sql, params);
    }

    /**
     * Chiude la connessione al database
     */
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Connessione database chiusa');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Garantisce l'esistenza di una colonna, aggiungendola se manca
     */
    async ensureColumn(table, column, type) {
        try {
            const columns = await this.all(`PRAGMA table_info(${table})`);
            const exists = Array.isArray(columns) && columns.some(c => c.name === column);
            if (!exists) {
                console.log(`🛠️ Aggiungo colonna mancante '${column}' alla tabella '${table}'`);
                await this.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
                console.log(`✅ Colonna '${column}' aggiunta a '${table}'`);
            }
        } catch (err) {
            console.error(`Errore ensureColumn per ${table}.${column}:`, err.message);
            throw err;
        }
    }

    /**
     * Restituisce l'istanza del database
     */
    getDb() {
        return this.db;
    }
}

// Singleton instance
const database = new Database();

module.exports = database;