const sqlite3 = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data', 'clinic.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER DEFAULT 60,
    price REAL,
    icon TEXT,
    active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    service_id INTEGER NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    location_country TEXT DEFAULT 'BR',
    notes TEXT,
    status TEXT DEFAULT 'confirmed',
    whatsapp_sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS blocked_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_date DATE NOT NULL,
    block_time TEXT,
    all_day INTEGER DEFAULT 0,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS international_dates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    flag_emoji TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    city TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS working_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    active INTEGER DEFAULT 1
  );
  
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Migration: ensure `icon` column exists on `services` (for older DBs)
try {
  const cols = db.prepare("PRAGMA table_info(services)").all().map(c => c.name);
  if (!cols.includes('icon')) {
    db.prepare("ALTER TABLE services ADD COLUMN icon TEXT").run();
    console.log('DB migration: added services.icon column');
  }
} catch (err) {
  console.warn('DB migration check failed:', err.message || err);
}

// Seed default data if empty
function seedData() {
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  if (adminCount.count === 0) {
    // Default admin: admin / cadore2024
    const hash = crypto.createHash('sha256').update('cadore2024').digest('hex');
    db.prepare('INSERT INTO admin_users (username, password_hash, name) VALUES (?, ?, ?)').run(
      'admin', hash, 'Eline Cadore'
    );
  }

  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (serviceCount.count === 0) {
    const services = [
      { name: 'Remoção de Tatuagem', description: 'Remoção segura e eficaz de tatuagens com tecnologia avançada a laser, proporcionando resultados graduais e naturais.', duration: 60, price: null, sort: 1, icon: 'laser' },
      { name: 'Lash Lifting', description: 'Curvatura natural e duradoura para os cílios, realçando o olhar sem necessidade de extensões.', duration: 45, price: null, sort: 2, icon: 'lash' },
      { name: 'Brow Lamination', description: 'Alinhamento e modelagem das sobrancelhas para um visual preenchido, definido e sofisticado.', duration: 45, price: null, sort: 3, icon: 'brow' },
      { name: 'Micropigmentação', description: 'Técnica de pigmentação semipermanente para sobrancelhas, lábios e olhos com resultado natural e duradouro.', duration: 90, price: null, sort: 4, icon: 'micro' },
      { name: 'Procedimentos Estéticos', description: 'Tratamentos personalizados para valorizar sua beleza natural com segurança e excelência profissional.', duration: 60, price: null, sort: 5, icon: 'treatment' },
    ];

    const stmt = db.prepare('INSERT INTO services (name, description, duration, price, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    for (const s of services) {
      stmt.run(s.name, s.description, s.duration, s.price, s.icon, s.sort);
    }
  }

  // Ensure existing rows have an icon (migration for older DBs)
  try {
    const missing = db.prepare("SELECT id, name FROM services WHERE icon IS NULL OR icon = ''").all();
    const map = {
      'Remoção de Tatuagem': 'laser',
      'Lash Lifting': 'lash',
      'Brow Lamination': 'brow',
      'Micropigmentação': 'micro',
      'Procedimentos Estéticos': 'treatment'
    };
    const upd = db.prepare('UPDATE services SET icon = ? WHERE id = ?');
    for (const r of missing) {
      if (map[r.name]) upd.run(map[r.name], r.id);
    }
  } catch (err) {
    // ignore if column doesn't exist yet
  }

  // Seed a few international dates so they appear immediately in the public site
  const intlCount = db.prepare('SELECT COUNT(*) as count FROM international_dates').get();
  if (intlCount.count === 0) {
    const ins = db.prepare('INSERT INTO international_dates (country_code, country_name, flag_emoji, start_date, end_date, city, active) VALUES (?, ?, ?, ?, ?, ?, ?)');
    ins.run('PT', 'Portugal', '🇵🇹', '2026-04-10', '2026-04-15', 'Lisboa', 1);
    ins.run('NL', 'Holanda', '🇳🇱', '2026-05-05', '2026-05-10', 'Amsterdam', 1);
    ins.run('ES', 'Espanha', '🇪🇸', '2026-06-20', '2026-06-25', 'Madrid', 1);
  }

  // Seed default map location (used by public map embed)
  const mapRow = db.prepare("SELECT value FROM settings WHERE key = ?").get('map');
  if (!mapRow) {
    const defaultMap = { lat: -16.7074, lng: -49.2624, label: 'Setor Bueno, Goiânia, Brasil', zoom: 13 };
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('map', JSON.stringify(defaultMap));
  }
}

seedData();

module.exports = db;
