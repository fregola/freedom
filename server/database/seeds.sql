-- Dati di esempio per il sistema di gestione menu ristorante

-- Inserimento allergeni comuni
INSERT OR IGNORE INTO allergens (name) VALUES
('Glutine'),
('Crostacei'),
('Uova'),
('Pesce'),
('Arachidi'),
('Soia'),
('Latte'),
('Frutta a guscio'),
('Sedano'),
('Senape'),
('Semi di sesamo'),
('Anidride solforosa'),
('Lupini'),
('Molluschi');

-- Inserimento ingredienti comuni
INSERT OR IGNORE INTO ingredients (name) VALUES
('Pomodoro'),
('Mozzarella'),
('Basilico'),
('Olio extravergine oliva'),
('Aglio'),
('Cipolla'),
('Parmigiano Reggiano'),
('Prosciutto crudo'),
('Rucola'),
('Funghi porcini'),
('Salmone'),
('Tonno'),
('Pasta di grano duro'),
('Riso Carnaroli'),
('Burro');

-- Inserimento categorie principali
INSERT OR IGNORE INTO categories (name, description, parent_id) VALUES
('Antipasti', 'Piatti di apertura del pasto', NULL),
('Primi Piatti', 'Pasta, risotti e zuppe', NULL),
('Secondi Piatti', 'Piatti principali di carne e pesce', NULL),
('Contorni', 'Verdure e accompagnamenti', NULL),
('Dolci', 'Dessert e dolci della casa', NULL),
('Bevande', 'Bevande alcoliche e analcoliche', NULL);

-- Inserimento sottocategorie
INSERT OR IGNORE INTO categories (name, description, parent_id) VALUES
-- Sottocategorie Antipasti
('Antipasti di Mare', 'Antipasti a base di pesce e frutti di mare', 1),
('Antipasti di Terra', 'Antipasti a base di salumi e formaggi', 1),
('Antipasti Vegetariani', 'Antipasti senza carne e pesce', 1),

-- Sottocategorie Primi Piatti
('Pasta', 'Primi piatti di pasta', 2),
('Risotti', 'Primi piatti di riso', 2),
('Zuppe', 'Minestre e vellutate', 2),

-- Sottocategorie Secondi Piatti
('Carne', 'Secondi piatti di carne', 3),
('Pesce', 'Secondi piatti di pesce', 3),
('Vegetariani', 'Secondi piatti senza carne e pesce', 3),

-- Sottocategorie Contorni
('Verdure grigliate', 'Contorni di verdure alla griglia', 4),
('Insalate', 'Contorni freschi', 4),
('Patate', 'Contorni a base di patate', 4),

-- Sottocategorie Dolci
('Dolci della casa', 'Dolci preparati in cucina', 5),
('Gelati', 'Gelati e sorbetti', 5),

-- Sottocategorie Bevande
('Vini', 'Vini rossi, bianchi e rosati', 6),
('Birre', 'Birre alla spina e in bottiglia', 6),
('Analcoliche', 'Bevande senza alcol', 6);

-- Associazioni ingredienti-allergeni di esempio
INSERT OR IGNORE INTO ingredient_allergens (ingredient_id, allergen_id) VALUES
-- Mozzarella contiene latte
(2, 7),
-- Parmigiano contiene latte
(7, 7),
-- Prosciutto può contenere solfiti
(8, 12),
-- Pasta contiene glutine
(13, 1),
-- Burro contiene latte
(15, 7),
-- Salmone è pesce
(11, 4),
-- Tonno è pesce
(12, 4);

-- Utente amministratore di default (password: admin123)
INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@restaurant.com', '$2a$10$np806i4pmfxJwjqIBdx5CeM60GUST83oTzROEDeb67/wHGWoBIVOi', 'admin');

-- Prodotti di esempio (necessari per mostrare categorie nel menu pubblico)
-- Antipasti: prodotto sotto "Antipasti di Terra"
INSERT OR IGNORE INTO products (name, description, name_en, price, category_id, image_path, is_available) 
SELECT 
  'Bruschetta Classica', 
  'Pane tostato con pomodoro, aglio e olio EVO', 
  'Classic Bruschetta', 
  6.50, 
  id, 
  NULL, 
  1 
FROM categories 
WHERE name = 'Antipasti di Terra' 
LIMIT 1;

-- Primi Piatti: prodotto sotto "Risotti"
INSERT OR IGNORE INTO products (name, description, name_en, price, category_id, image_path, is_available) 
SELECT 
  'Risotto ai Funghi', 
  'Risotto cremoso con funghi porcini', 
  'Mushroom Risotto', 
  12.00, 
  id, 
  NULL, 
  1 
FROM categories 
WHERE name = 'Risotti' 
LIMIT 1;

-- Secondi Piatti: prodotto sotto "Pesce"
INSERT OR IGNORE INTO products (name, description, name_en, price, category_id, image_path, is_available) 
SELECT 
  'Salmone alla Griglia', 
  'Filetto di salmone alla griglia con verdure', 
  'Grilled Salmon', 
  18.00, 
  id, 
  NULL, 
  1 
FROM categories 
WHERE name = 'Pesce' 
LIMIT 1;