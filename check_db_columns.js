const db = require('./server/config/database');

async function checkColumns() {
  try {
    const columns = await db.all("PRAGMA table_info(products)");
    console.log("Columns in products table:", columns.map(c => c.name));
  } catch (err) {
    console.error("Error checking columns:", err);
  }
}

checkColumns();
