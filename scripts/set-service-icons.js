const Database = require('better-sqlite3');
const db = new Database('./data/clinic.db');
const map = {
  'Remoção de Tatuagem': 'laser',
  'Lash Lifting': 'lash',
  'Brow Lamination': 'brow',
  'Micropigmentação': 'micro',
  'Procedimentos Estéticos': 'treatment'
};
for (const [name, icon] of Object.entries(map)) {
  db.prepare('UPDATE services SET icon = ? WHERE name = ? AND (icon IS NULL OR icon = ?)').run(icon, name, '');
}
console.log('updated icons');
console.log(db.prepare('SELECT id, name, icon FROM services').all());
db.close();
