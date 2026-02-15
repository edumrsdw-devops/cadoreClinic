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

    // Generate time slots
    const slots = [];
    const [startH, startM] = workingHours.start_time.split(':').map(Number);
    const [endH, endM] = workingHours.end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m + duration <= endMinutes; m += 30) {
      const hours = Math.floor(m / 60).toString().padStart(2, '0');
      const mins = (m % 60).toString().padStart(2, '0');
      slots.push(`${hours}:${mins}`);
    }

    // Remove booked slots
    const bookedAppointments = db.prepare(
      'SELECT appointment_time FROM appointments WHERE appointment_date = ? AND status != ?'
    ).all(date, 'cancelled');
    const bookedTimes = bookedAppointments.map(a => a.appointment_time);

    // Remove blocked times
    const blockedTimes = db.prepare(
      'SELECT block_time, all_day FROM blocked_times WHERE block_date = ?'
    ).all(date);

    const isAllDayBlocked = blockedTimes.some(b => b.all_day === 1);
    if (isAllDayBlocked) return res.json({ slots: [], message: 'Este dia está bloqueado' });

    const blockedTimesList = blockedTimes.map(b => b.block_time);

    const availableSlots = slots.filter(s => !bookedTimes.includes(s) && !blockedTimesList.includes(s));

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

// ========== CREATE APPOINTMENT ==========
router.post('/appointments', (req, res) => {
  try {
    const { client_name, client_phone, client_email, service_id, appointment_date, appointment_time, notes } = req.body;

    if (!client_name || !client_phone || !service_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    }

    // Check if slot is available
    const existing = db.prepare(
      'SELECT id FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND status != ?'
    ).get(appointment_date, appointment_time, 'cancelled');

    if (existing) {
      return res.status(409).json({ error: 'Este horário já está ocupado' });
    }

    // Check blocked times
    const blocked = db.prepare(
      'SELECT id FROM blocked_times WHERE block_date = ? AND (all_day = 1 OR block_time = ?)'
    ).get(appointment_date, appointment_time);

    if (blocked) {
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

    res.status(201).json({
      message: 'Agendamento realizado com sucesso!',
      appointment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
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
