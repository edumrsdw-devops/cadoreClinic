const express = require('express');
const router = express.Router();
const db = require('../database');

// ========== SERVICES ==========
router.get('/services', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY sort_order').all();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

// ========== AVAILABLE SLOTS ==========
router.get('/available-slots', (req, res) => {
  try {
    const { date, service_id } = req.query;
    if (!date) return res.status(400).json({ error: 'Data é obrigatória' });

    const dayOfWeek = new Date(date + 'T12:00:00').getDay();

    // Get working hours for this day
    const workingHours = db.prepare('SELECT * FROM working_hours WHERE day_of_week = ? AND active = 1').get(dayOfWeek);
    if (!workingHours) return res.json({ slots: [], message: 'Não há horários disponíveis neste dia' });

    // Get service duration
    let duration = 60;
    if (service_id) {
      const service = db.prepare('SELECT duration FROM services WHERE id = ?').get(service_id);
      if (service) duration = service.duration;
    }

    // Generate time slots (step 30 minutes) but only those where the full `duration` fits
    const slots = [];
    const [startH, startM] = workingHours.start_time.split(':').map(Number);
    const [endH, endM] = workingHours.end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m + duration <= endMinutes; m += 30) {
      const hours = Math.floor(m / 60).toString().padStart(2, '0');
      const mins = (m % 60).toString().padStart(2, '0');
      slots.push({ time: `${hours}:${mins}`, start: m, end: m + duration });
    }

    // Get existing appointments for the day (with their durations)
    const existingAppts = db.prepare(
      `SELECT a.appointment_time as time, s.duration as duration
       FROM appointments a JOIN services s ON a.service_id = s.id
       WHERE a.appointment_date = ? AND a.status != ?`
    ).all(date, 'cancelled');

    const parsedExisting = existingAppts.map(a => {
      const [h, mm] = a.time.split(':').map(Number);
      const start = h * 60 + mm;
      return { start, end: start + (a.duration || 60) };
    });

    // Blocked times for the day
    const blockedTimes = db.prepare(
      'SELECT block_time, all_day FROM blocked_times WHERE block_date = ?'
    ).all(date);

    const isAllDayBlocked = blockedTimes.some(b => b.all_day === 1);
    if (isAllDayBlocked) return res.json({ slots: [], message: 'Este dia está bloqueado' });

    const parsedBlocked = blockedTimes.filter(b => b.block_time).map(b => {
      const [h, mm] = b.block_time.split(':').map(Number);
      const t = h * 60 + mm;
      return { start: t, end: t + 1 }; // treat blocked point as forbidden minute
    });

    // Helper to check interval overlap
    const overlaps = (aStart, aEnd, bStart, bEnd) => (aStart < bEnd && bStart < aEnd);

    // Filter out slots that would overlap existing appointments OR blocked times
    const availableSlots = slots
      .filter(s => {
        // if any existing appointment overlaps the candidate interval, exclude
        for (const ex of parsedExisting) {
          if (overlaps(s.start, s.end, ex.start, ex.end)) return false;
        }
        // if any blocked time falls inside slot interval, exclude
        for (const bl of parsedBlocked) {
          if (overlaps(s.start, s.end, bl.start, bl.end)) return false;
        }
        return true;
      })
      .map(s => s.time);

    // Get international location info
    const intlDate = db.prepare(
      'SELECT * FROM international_dates WHERE start_date <= ? AND end_date >= ? AND active = 1'
    ).get(date, date);

    res.json({
      slots: availableSlots,
      international: intlDate || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar horários' });
  }
});

// ========== INTERNATIONAL DATES (Public) ==========
router.get('/international-dates', (req, res) => {
  try {
    const dates = db.prepare(
      `SELECT * FROM international_dates WHERE active = 1 AND end_date >= date('now') ORDER BY start_date`
    ).all();
    res.json(dates);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar datas internacionais' });
  }
});

// ========== MAP LOCATION (Public) ==========
router.get('/map', (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('map');
    if (row) return res.json(JSON.parse(row.value));
    return res.json({ lat: -16.7074, lng: -49.2624, label: 'Setor Bueno, Goiânia, Brasil', zoom: 13 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar configuração de mapa' });
  }
});

// ========== CREATE APPOINTMENT ==========
router.post('/appointments', (req, res) => {
  try {
    const { client_name, client_phone, client_email, service_id, appointment_date, appointment_time, notes } = req.body;

    if (!client_name || !client_phone || !service_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    }

    // Check if slot is available — ensure there is NO overlapping appointment for the requested service duration
    // Get requested service duration
    let reqDuration = 60;
    if (service_id) {
      const svc = db.prepare('SELECT duration FROM services WHERE id = ?').get(service_id);
      if (svc && svc.duration) reqDuration = svc.duration;
    }

    const [hReq, mReq] = appointment_time.split(':').map(Number);
    const reqStart = hReq * 60 + mReq;
    const reqEnd = reqStart + reqDuration;

    // check against existing appointments on that date
    const existingRows = db.prepare(
      `SELECT a.appointment_time as time, s.duration as duration, a.status
       FROM appointments a JOIN services s ON a.service_id = s.id
       WHERE a.appointment_date = ? AND a.status != ?`
    ).all(appointment_date, 'cancelled');

    const overlapExists = existingRows.some(r => {
      const [h, mm] = r.time.split(':').map(Number);
      const start = h * 60 + mm;
      const end = start + (r.duration || 60);
      return (reqStart < end && start < reqEnd);
    });

    if (overlapExists) {
      return res.status(409).json({ error: 'Este horário conflita com outro agendamento' });
    }

    // Check blocked times (all day or any blocked minute falls inside the requested interval)
    const blockedRows = db.prepare('SELECT block_time, all_day FROM blocked_times WHERE block_date = ?').all(appointment_date);
    if (blockedRows.some(b => b.all_day === 1)) {
      return res.status(409).json({ error: 'Este dia está bloqueado' });
    }
    const blockedConflict = blockedRows.some(b => {
      if (!b.block_time) return false;
      const [bh, bm] = b.block_time.split(':').map(Number);
      const bstart = bh * 60 + bm;
      return (reqStart <= bstart && bstart < reqEnd);
    });
    if (blockedConflict) {
      return res.status(409).json({ error: 'Este horário está bloqueado' });
    }

    // Get international location
    const intlDate = db.prepare(
      'SELECT country_code FROM international_dates WHERE start_date <= ? AND end_date >= ? AND active = 1'
    ).get(appointment_date, appointment_date);

    const locationCountry = intlDate ? intlDate.country_code : 'BR';

    const result = db.prepare(
      `INSERT INTO appointments (client_name, client_phone, client_email, service_id, appointment_date, appointment_time, location_country, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(client_name, client_phone, client_email || null, service_id, appointment_date, appointment_time, locationCountry, notes || null);

    // Get service name for WhatsApp message
    const service = db.prepare('SELECT name FROM services WHERE id = ?').get(service_id);

    const appointment = {
      id: result.lastInsertRowid,
      client_name,
      client_phone,
      service_name: service ? service.name : '',
      appointment_date,
      appointment_time,
      location_country: locationCountry
    };

    // bump appointments version so public clients can refresh availability
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('appointments_version', String(Date.now()));

    res.status(201).json({
      message: 'Agendamento realizado com sucesso!',
      appointment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// expose appointments version so public UI can poll for changes
router.get('/appointments-version', (req, res) => {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('appointments_version');
    res.json({ version: row ? row.value : null });
  } catch (err) {
    res.status(500).json({ error: 'Erro' });
  }
});

// ========== CONTACT MESSAGE ==========
router.post('/contact', (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ error: 'Nome e mensagem são obrigatórios' });
    }

    db.prepare(
      'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)'
    ).run(name, email || null, phone || null, message);

    res.status(201).json({ message: 'Mensagem enviada com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

module.exports = router;
