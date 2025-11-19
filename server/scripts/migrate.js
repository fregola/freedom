#!/usr/bin/env node

/**
 * Script di migrazione per inizializzare il database
 * Uso: npm run migrate
 */

require('dotenv').config();
const database = require('../config/database');

async function migrate() {
    try {
        console.log('🚀 Avvio migrazione database...');
        
        await database.initialize();
        
        console.log('✅ Migrazione completata con successo!');
        console.log('📊 Database pronto per l\'uso');
        
        // Verifica che le tabelle siano state create
        const tables = await database.all(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);
        
        console.log('\n📋 Tabelle create:');
        tables.forEach(table => {
            console.log(`  - ${table.name}`);
        });
        
        // Verifica dati di esempio e mostra credenziali solo in sviluppo
        const userCount = await database.get('SELECT COUNT(*) as count FROM users');
        const allergenCount = await database.get('SELECT COUNT(*) as count FROM allergens');
        const ingredientCount = await database.get('SELECT COUNT(*) as count FROM ingredients');
        const categoryCount = await database.get('SELECT COUNT(*) as count FROM categories');

        console.log('\n📈 Dati presenti:');
        console.log(`  - Utenti: ${userCount.count}`);
        console.log(`  - Allergeni: ${allergenCount.count}`);
        console.log(`  - Ingredienti: ${ingredientCount.count}`);
        console.log(`  - Categorie: ${categoryCount.count}`);

        if (process.env.NODE_ENV !== 'production') {
            console.log('\n🔐 Credenziali admin di default (sviluppo):');
            console.log('  Username: admin');
            console.log('  Password: admin123');
            console.log('  Email: admin@restaurant.com');
        } else {
            console.log('\nℹ️ Produzione: seeds non eseguiti e nessuna credenziale demo mostrata');
        }
        
    } catch (error) {
        console.error('❌ Errore durante la migrazione:', error.message);
        process.exit(1);
    } finally {
        await database.close();
        process.exit(0);
    }
}

// Esegui la migrazione se questo file viene chiamato direttamente
if (require.main === module) {
    migrate();
}

module.exports = migrate;