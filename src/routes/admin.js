const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database');

// ========== AUTH MIDDLEWARE ==========
function authMiddleware(req, res, next) {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) return res.status(401).json({ error: 'Não autorizado' });

  const session = db.prepare(
    `SELECT s.*, u.name, u.username FROM sessions s JOIN admin_users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime('now')`
  ).get(sessionId);

  if (!session) return res.status(401).json({ error: 'Sessão expirada' });

  req.user = { id: session.user_id, name: session.name, username: session.username };
  next();
}

// ========== LOGIN ==========
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const user = db.prepare('SELECT * FROM admin_users WHERE username = ? AND password_hash = ?').get(username, hash);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(sessionId, user.id, expiresAt);

    // Clean old sessions
    db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();

    res.json({ sessionId, name: user.name, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login' });
  }
});

// ========== LOGOUT ==========
router.post('/logout', authMiddleware, (req, res) => {
  const sessionId = req.headers['x-session-id'];
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  res.json({ message: 'Logout realizado' });
});

// ========== CHECK SESSION ==========
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// ========== APPOINTMENTS ==========
router.get('/appointments', authMiddleware, (req, res) => {
  try {
    const { date, status, page = 1, limit = 50 } = req.query;
    let query = `SELECT a.*, s.name as service_name FROM appointments a JOIN services s ON a.service_id = s.id`;
    const params = [];
    const conditions = [];

    if (date) { conditions.push('a.appointment_date = ?'); params.push(date); }
    if (status) { conditions.push('a.status = ?'); params.push(status); }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time ASC';

    const offset = (page - 1) * limit;
    query += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const appointments = db.prepare(query).all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM appointments a';
    if (conditions.length) countQuery += ' WHERE ' + conditions.join(' AND ');
    const total = db.prepare(countQuery).get(...params);

    res.json({ appointments, total: total.total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// ========== UPDATE APPOINTMENT STATUS ==========
router.patch('/appointments/:id', authMiddleware, (req, res) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;

    if (status) {
      db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);
    }
    if (notes !== undefined) {
      db.prepare('UPDATE appointments SET notes = ? WHERE id = ?').run(notes, id);
    }

    const appointment = db.prepare(
      'SELECT a.*, s.name as service_name FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.id = ?'
    ).get(id);

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// ========== DELETE APPOINTMENT ==========
router.delete('/appointments/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Agendamento excluído' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir agendamento' });
  }
});

// ========== BLOCKED TIMES ==========
router.get('/blocked-times', authMiddleware, (req, res) => {
  try {
    const blocks = db.prepare('SELECT * FROM blocked_times ORDER BY block_date DESC').all();
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar bloqueios' });
  }
});

router.post('/blocked-times', authMiddleware, (req, res) => {
  try {
    const { block_date, block_time, all_day, reason } = req.body;
    if (!block_date) return res.status(400).json({ error: 'Data é obrigatória' });

    db.prepare(
      'INSERT INTO blocked_times (block_date, block_time, all_day, reason) VALUES (?, ?, ?, ?)'
    ).run(block_date, block_time || null, all_day ? 1 : 0, reason || null);

    res.status(201).json({ message: 'Horário bloqueado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao bloquear horário' });
  }
});

router.delete('/blocked-times/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM blocked_times WHERE id = ?').run(req.params.id);
    res.json({ message: 'Bloqueio removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover bloqueio' });
  }
});

// ========== INTERNATIONAL DATES ==========
router.get('/international-dates', authMiddleware, (req, res) => {
  try {
    const dates = db.prepare('SELECT * FROM international_dates ORDER BY start_date DESC').all();
    res.json(dates);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar datas internacionais' });
  }
});

router.post('/international-dates', authMiddleware, (req, res) => {
  try {
    const { country_code, country_name, flag_emoji, start_date, end_date, city, active } = req.body;
    if (!country_code || !start_date || !end_date) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    db.prepare(
      'INSERT INTO international_dates (country_code, country_name, flag_emoji, start_date, end_date, city, active) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(country_code, country_name, flag_emoji, start_date, end_date, city || null, active !== undefined ? (active ? 1 : 0) : 1);

    res.status(201).json({ message: 'Data internacional adicionada' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar data internacional' });
  }
});

router.patch('/international-dates/:id', authMiddleware, (req, res) => {
  try {
    const { active } = req.body;
    db.prepare('UPDATE international_dates SET active = ? WHERE id = ?').run(active ? 1 : 0, req.params.id);
    res.json({ message: 'Atualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

router.delete('/international-dates/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM international_dates WHERE id = ?').run(req.params.id);
    res.json({ message: 'Removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover' });
  }
});

// ========== MAP SETTINGS (Admin) ==========
router.get('/map', authMiddleware, (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('map');
    if (row) return res.json(JSON.parse(row.value));
    return res.json({ lat: -16.7074, lng: -49.2624, label: 'Setor Bueno, Goiânia, Brasil', zoom: 13 });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configuração de mapa' });
  }
});

router.patch('/map', authMiddleware, (req, res) => {
  try {
    const { lat, lng, label, zoom } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat e lng devem ser números' });
    }
    const mapObj = { lat: Number(lat), lng: Number(lng), label: label || '', zoom: Number(zoom || 13) };
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('map', JSON.stringify(mapObj));
    res.json({ message: 'Mapa atualizado', map: mapObj });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar configuração de mapa' });
  }
});

// ========== SERVICES MANAGEMENT ==========
router.get('/services', authMiddleware, (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY sort_order').all();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

router.post('/services', authMiddleware, (req, res) => {
  try {
    const { name, description, duration, price } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM services').get();
    const sortOrder = (maxOrder.max_order || 0) + 1;

    db.prepare(
      'INSERT INTO services (name, description, duration, price, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).run(name, description || null, duration || 60, price || null, sortOrder);

    res.status(201).json({ message: 'Serviço adicionado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar serviço' });
  }
});

router.patch('/services/:id', authMiddleware, (req, res) => {
  try {
    const { name, description, duration, price, active } = req.body;
    const { id } = req.params;

    if (name !== undefined) db.prepare('UPDATE services SET name = ? WHERE id = ?').run(name, id);
    if (description !== undefined) db.prepare('UPDATE services SET description = ? WHERE id = ?').run(description, id);
    if (duration !== undefined) db.prepare('UPDATE services SET duration = ? WHERE id = ?').run(duration, id);
    if (price !== undefined) db.prepare('UPDATE services SET price = ? WHERE id = ?').run(price, id);
    if (active !== undefined) db.prepare('UPDATE services SET active = ? WHERE id = ?').run(active ? 1 : 0, id);

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar serviço' });
  }
});

// ========== CONTACT MESSAGES ==========
router.get('/messages', authMiddleware, (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

router.patch('/messages/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE contact_messages SET read = 1 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Marcada como lida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro' });
  }
});

// ========== DASHBOARD STATS ==========
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todayAppointments = db.prepare(
      'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ? AND status != ?'
    ).get(today, 'cancelled');

    const totalAppointments = db.prepare(
      'SELECT COUNT(*) as count FROM appointments WHERE status != ?'
    ).get('cancelled');

    const upcomingAppointments = db.prepare(
      'SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= ? AND status = ?'
    ).get(today, 'confirmed');

    const unreadMessages = db.prepare(
      'SELECT COUNT(*) as count FROM contact_messages WHERE read = 0'
    ).get();

    res.json({
      todayCount: todayAppointments.count,
      totalCount: totalAppointments.count,
      upcomingCount: upcomingAppointments.count,
      unreadMessages: unreadMessages.count
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// ========== EXPORT APPOINTMENTS ==========
router.get('/export', authMiddleware, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `SELECT a.*, s.name as service_name FROM appointments a JOIN services s ON a.service_id = s.id`;
    const params = [];

    if (start_date && end_date) {
      query += ' WHERE a.appointment_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    query += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC';

    const appointments = db.prepare(query).all(...params);

    // CSV format
    let csv = 'ID,Cliente,Telefone,Email,Serviço,Data,Horário,País,Status,Observações\n';
    for (const a of appointments) {
      csv += `${a.id},"${a.client_name}","${a.client_phone}","${a.client_email || ''}","${a.service_name}",${a.appointment_date},${a.appointment_time},${a.location_country},${a.status},"${a.notes || ''}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=agendamentos.csv');
    res.send('\ufeff' + csv); // BOM for Excel UTF-8
  } catch (err) {
    res.status(500).json({ error: 'Erro ao exportar' });
  }
});

// ========== CHANGE PASSWORD ==========
router.post('/change-password', authMiddleware, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Senhas são obrigatórias' });
    }

    const currentHash = crypto.createHash('sha256').update(current_password).digest('hex');
    const user = db.prepare('SELECT * FROM admin_users WHERE id = ? AND password_hash = ?').get(req.user.id, currentHash);

    if (!user) return res.status(401).json({ error: 'Senha atual incorreta' });

    const newHash = crypto.createHash('sha256').update(new_password).digest('hex');
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

module.exports = router;
