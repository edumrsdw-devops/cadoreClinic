/* ============================================
   CADORE CLINIC - Main Application JS
   ============================================ */

// ========== CONFIG ==========
const CONFIG = {
  whatsappNumber: '5562999999999', // Replace with real WhatsApp number
  clinicName: 'Cadore Clinic',
  // use relative API base so mobile devices and deployed environments work correctly
  apiBase: '/api'
};

// ========== STATE ==========
const state = {
  services: [],
  selectedService: null,
  selectedDate: null,
  selectedTime: null,
  internationalDates: [],
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear()
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initScrollAnimations();
  initSmoothScroll();
  loadServices();
  loadInternationalDates();
  loadMap();
  initCalendar();
  initContactForm();
  initWhatsAppLinks();
  initPhoneMask();
  initHeroLines();
});

// ========== HEADER SCROLL ==========
function initHeader() {
  const header = document.getElementById('header');
  const menuLinks = document.querySelectorAll('.side-menu-link');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    // Active nav highlight
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    
    menuLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// ========== MOBILE MENU ==========
function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const sideMenu = document.getElementById('sideMenu');
  const overlay = document.getElementById('mobileOverlay');
  const closeBtn = document.getElementById('sideMenuClose');
  
  function openMenu() {
    sideMenu.classList.add('open');
    overlay.classList.add('active');
    toggle.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeMenu() {
    sideMenu.classList.remove('open');
    overlay.classList.remove('active');
    toggle.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  toggle.addEventListener('click', () => {
    if (sideMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  
  sideMenu.querySelectorAll('.side-menu-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

// ========== SCROLL ANIMATIONS ==========
function initScrollAnimations() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .service-card');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  
  reveals.forEach(el => observer.observe(el));
}

// ========== SMOOTH SCROLL ==========
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 80;
        const pos = target.offsetTop - offset;
        window.scrollTo({ top: pos, behavior: 'smooth' });
      }
    });
  });
}

// ========== LOAD SERVICES ==========
async function loadServices() {
  const fallbackServices = [
    { id: 1, name: 'Remoção de Tatuagem', description: 'Remoção segura e eficaz de tatuagens com tecnologia avançada a laser, proporcionando resultados graduais e naturais.', duration: 60, icon: 'tattoo' },
    { id: 2, name: 'Lash Lifting', description: 'Curvatura natural e duradoura para os cílios, realçando o olhar sem necessidade de extensões.', duration: 45, icon: 'lash' },
    { id: 3, name: 'Brow Lamination', description: 'Alinhamento e modelagem das sobrancelhas para um visual preenchido, definido e sofisticado.', duration: 45, icon: 'brow' },
    { id: 4, name: 'Micropigmentação', description: 'Técnica de pigmentação semipermanente para sobrancelhas, lábios e olhos com resultado natural e duradouro.', duration: 90, icon: 'micro' },
    { id: 5, name: 'Procedimentos Estéticos', description: 'Tratamentos personalizados para valorizar sua beleza natural com segurança e excelência profissional.', duration: 60, icon: 'treatment' }
  ];

  try {
    const res = await fetch(`${CONFIG.apiBase}/services`);
    if (!res.ok) throw new Error('API returned ' + res.status);
    state.services = await res.json();
    if (!Array.isArray(state.services) || state.services.length === 0) {
      // fallback if API returns empty (silent)
      state.services = fallbackServices;
      console.info('loadServices: API returned empty — using local fallback');
    }
  } catch (err) {
    console.warn('loadServices failed, using fallback:', err);
    state.services = fallbackServices;
    // silent fallback (do not show demo-mode message to users)
    console.info('loadServices: using local fallback (silent)');
  } finally {
    renderServices();
    populateServiceSelect();
  }
}

function renderServices() {
  const grid = document.getElementById('servicesGrid');
  const icons = {
    /* icon-name keys */
    'tattoo': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>',
    'lash': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    'brow': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2"/><path d="M2 12c1-3 4-6 10-6s9 3 10 6"/></svg>',
    'micro': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m16 2-4 4-4-4"/><path d="M12 6v6"/><circle cx="12" cy="17" r="5"/></svg>',
    'treatment': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    /* legacy name keys (fallback) */
    'Remoção de Tatuagem': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>',
    'Lash Lifting': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    'Brow Lamination': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2"/><path d="M2 12c1-3 4-6 10-6s9 3 10 6"/></svg>',
    'Micropigmentação': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m16 2-4 4-4-4"/><path d="M12 6v6"/><circle cx="12" cy="17" r="5"/></svg>',
    'Procedimentos Estéticos': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>'
  };
  
  grid.innerHTML = state.services.map(service => `
    <div class="service-card reveal">
      <div class="service-card-icon">
        ${icons[service.icon] || icons[service.name] || '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'}
      </div>
      <h3>${service.name}</h3>
      <p>${service.description || ''}</p>
      <a href="#booking" class="btn btn-outline btn-sm" onclick="selectServiceAndScroll(${service.id})">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Agendar
      </a>
    </div>
  `).join('');
  
  // Re-init scroll animations for new elements
  setTimeout(() => initScrollAnimations(), 100);
}

function populateServiceSelect() {
  const select = document.getElementById('bookingService');
  select.innerHTML = '<option value="">Escolha um serviço...</option>';
  state.services.forEach(s => {
    select.innerHTML += `<option value="${s.id}">${s.name}${s.duration ? ` (${s.duration} min)` : ''}</option>`;
  });
}

function selectServiceAndScroll(serviceId) {
  const select = document.getElementById('bookingService');
  if (select) select.value = serviceId;
  state.selectedService = serviceId;

  // ensure booking section is visible on mobile and desktop
  const bookingSection = document.getElementById('booking');
  if (bookingSection) {
    bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Move to step 2 and focus calendar so user can pick date immediately
  bookingNextStep(2);
  setTimeout(() => {
    const firstDay = document.querySelector('#calendarGrid .calendar-day:not(.empty):not(.disabled)');
    if (firstDay) { firstDay.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstDay.focus(); }
  }, 350);

  showToast('Serviço pré-selecionado — prossiga para escolher data e horário.', 'success');
}

// ========== LOAD INTERNATIONAL DATES ==========
async function loadInternationalDates() {
  const fallbackIntl = [
    { id: 1, country_code: 'NL', country_name: 'Holanda', flag_emoji: '🇳🇱', start_date: '2026-05-05', end_date: '2026-05-10', city: 'Amsterdam' },
    { id: 2, country_code: 'ES', country_name: 'Espanha', flag_emoji: '🇪🇸', start_date: '2026-06-20', end_date: '2026-06-25', city: 'Madrid' }
  ];

  try {
    const res = await fetch(`${CONFIG.apiBase}/international-dates`);
    if (!res.ok) throw new Error('API returned ' + res.status);
    state.internationalDates = await res.json();
    if (!Array.isArray(state.internationalDates) || state.internationalDates.length === 0) {
      state.internationalDates = fallbackIntl;
      console.info('loadInternationalDates: API returned empty — using local fallback');
    }
  } catch (err) {
    console.warn('loadInternationalDates failed, using fallback:', err);
    state.internationalDates = fallbackIntl;
    // silent fallback (do not notify users)
    console.info('loadInternationalDates: using local fallback (silent)');
  } finally {
    renderInternationalDates();
  }
}

function renderInternationalDates() {
  const list = document.getElementById('intlList');
  
  if (state.internationalDates.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;grid-column:1/-1;padding:2rem">
        <p style="opacity:0.6;font-size:1rem">Nenhuma viagem internacional agendada no momento.</p>
        <p style="opacity:0.4;font-size:0.85rem;margin-top:0.5rem">Fique de olho para novidades!</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = state.internationalDates.map(d => {
    const start = formatDateBR(d.start_date);
    const end = formatDateBR(d.end_date);
    return `
      <div class="intl-card intl-card-clickable" onclick="goToIntlBooking('${d.start_date}', '${d.end_date}')" title="Clique para agendar">
        <div class="intl-flag-code intl-flag-large">${d.country_code}</div>
        <div class="intl-country">${d.country_name}</div>
        ${d.city ? `<div class="intl-city">${d.city}</div>` : ''}
        <div class="intl-dates">${start} — ${end}</div>
        <div class="intl-book-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Agendar nesta data
        </div>
      </div>
    `;
  }).join('');
}



// ========== MAP (load dynamic map config from API) ==========
async function loadMap() {
  try {
    const res = await fetch('/api/map');
    if (!res.ok) throw new Error('map API error');
    const data = await res.json();
    const iframe = document.getElementById('mainMap');
    const addressEl = document.getElementById('clinicAddress');
    const lat = data.lat;
    const lng = data.lng;
    const zoom = data.zoom || 13;
    if (iframe) iframe.src = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
    if (addressEl && data.label) addressEl.innerHTML = data.label;
  } catch (err) {
    console.warn('loadMap failed, using default', err);
    const iframe = document.getElementById('mainMap');
    if (iframe && !iframe.src) iframe.src = 'https://maps.google.com/maps?q=-16.7074,-49.2624&z=13&output=embed';
  }
}

// ========== GO TO INTERNATIONAL BOOKING ==========
function goToIntlBooking(startDate, endDate) {
  // Parse the start date to navigate calendar to that month
  const [year, month] = startDate.split('-').map(Number);
  state.currentMonth = month - 1; // 0-indexed
  state.currentYear = year;
  state.selectedDate = null;
  state.selectedTime = null;
  
  // Reset booking to step 1 if not there
  const steps = document.querySelectorAll('.booking-step');
  const indicators = document.querySelectorAll('.step');
  steps.forEach((s, i) => {
    s.classList.toggle('active', i === 0);
  });
  indicators.forEach((ind, i) => {
    ind.classList.toggle('active', i === 0);
  });
  
  // Render the calendar at the international month
  renderCalendar();
  
  // Scroll to booking section
  const bookingSection = document.getElementById('booking');
  if (bookingSection) {
    bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  // Show a toast
  showToast('Calendário posicionado nas datas internacionais.', 'info');
}

// ========== CALENDAR ==========
function initCalendar() {
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const monthYearEl = document.getElementById('calendarMonthYear');
  
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  monthYearEl.textContent = `${months[state.currentMonth]} ${state.currentYear}`;
  
  const firstDay = new Date(state.currentYear, state.currentMonth, 1);
  const lastDay = new Date(state.currentYear, state.currentMonth + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  let html = dayHeaders.map(d => `<div class="calendar-day-header">${d}</div>`).join('');
  
  // Empty cells before first day
  for (let i = 0; i < startDayOfWeek; i++) {
    html += '<div class="calendar-day empty"></div>';
  }
  
  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(state.currentYear, state.currentMonth, day);
    const dateStr = formatDateISO(date);
    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();
    const isSelected = state.selectedDate === dateStr;
    
    // Check if this date has an international event
    const intlEvent = state.internationalDates.find(d => dateStr >= d.start_date && dateStr <= d.end_date);
    
    let classes = 'calendar-day';
    if (isPast) classes += ' disabled';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';
    
    html += `
      <div class="${classes}" ${isPast ? '' : `onclick="selectDate('${dateStr}')" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ') selectDate('${dateStr}')"`}>
        ${day}
        ${intlEvent ? `<span class="intl-flag-code calendar-intl-code">${intlEvent.country_code}</span>` : ''}
      </div>
    `;
  }
  
  grid.innerHTML = html;
}

function changeMonth(dir) {
  state.currentMonth += dir;
  if (state.currentMonth > 11) {
    state.currentMonth = 0;
    state.currentYear++;
  } else if (state.currentMonth < 0) {
    state.currentMonth = 11;
    state.currentYear--;
  }
  state.selectedDate = null;
  state.selectedTime = null;
  document.getElementById('timeSlotsContainer').classList.remove('open');
  document.getElementById('timeSlotsContainer').setAttribute('aria-hidden', 'true');
  document.getElementById('btnStep2').disabled = true;
  renderCalendar();
}

async function selectDate(dateStr) {
  state.selectedDate = dateStr;
  state.selectedTime = null;
  document.getElementById('btnStep2').disabled = true;
  renderCalendar();
  
  // Load available slots
  const container = document.getElementById('timeSlotsContainer');
  const slotsEl = document.getElementById('timeSlots');
  const intlInfo = document.getElementById('intlInfo');
  const slotsStatus = document.getElementById('slotsStatus');
  
  // UI: show status
  if (slotsStatus) slotsStatus.textContent = 'Carregando...';

  // open the collapsible time-slots panel with animation
  container.classList.add('open');
  container.setAttribute('aria-hidden', 'false');
  slotsEl.innerHTML = '<div class="spinner"></div>';
  intlInfo.style.display = 'none';
  
  try {
    const serviceId = document.getElementById('bookingService').value;
    const res = await fetch(`${CONFIG.apiBase}/available-slots?date=${dateStr}&service_id=${serviceId}`);
    if (!res.ok) throw new Error('API returned ' + res.status);
    const data = await res.json();
    
    if (data && data.international) {
      intlInfo.style.display = 'block';
      intlInfo.innerHTML = `<span class="intl-flag-code">${data.international.country_code}</span> Atendimento em <strong>${data.international.country_name}</strong>${data.international.city ? ` — ${data.international.city}` : ''}`;
    }
    
    if (!data || !Array.isArray(data.slots) || data.slots.length === 0) {
      slotsEl.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--color-gray);font-size:0.9rem">${(data && data.message) || 'Nenhum horário disponível nesta data'}</p>`;
      if (slotsStatus) slotsStatus.textContent = 'Nenhum horário disponível';
    } else {
      slotsEl.innerHTML = data.slots.map(slot => `
        <div class="time-slot" tabindex="0" onclick="selectTime('${slot}', this)" onkeydown="if(event.key==='Enter'||event.key===' ') selectTime('${slot}', this)">${slot}</div>
      `).join('');
      if (slotsStatus) slotsStatus.textContent = `${data.slots.length} horários disponíveis`;
    }
  } catch (err) {
    console.warn('available-slots failed, using client fallback:', err);
    // client-side fallback slots (useful when backend is not available)
    const fallbackSlots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
    slotsEl.innerHTML = fallbackSlots.map(slot => `
      <div class="time-slot" tabindex="0" onclick="selectTime('${slot}', this)" onkeydown="if(event.key==='Enter'||event.key===' ') selectTime('${slot}', this)">${slot}</div>
    `).join('');
    if (slotsStatus) slotsStatus.textContent = `${fallbackSlots.length} horários (padrão)`;
  }
}

// manual refresh helper (used by "Mostrar horários")
function refreshSlots() {
  const date = state.selectedDate || formatDateISO(new Date());
  selectDate(date);
}

function selectTime(time, el) {
  state.selectedTime = time;
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('btnStep2').disabled = false;
}

// ========== BOOKING STEPS ==========
function bookingNextStep(step) {
  // Validation
  if (step === 2) {
    const serviceId = document.getElementById('bookingService').value;
    if (!serviceId) {
      showToast('Selecione um serviço', 'error');
      return;
    }
    state.selectedService = serviceId;
  }
  
  if (step === 3) {
    if (!state.selectedDate || !state.selectedTime) {
      showToast('Selecione uma data e horário', 'error');
      return;
    }
    updateBookingSummary();
  }
  
  // Hide all panels
  document.querySelectorAll('.booking-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`bookingStep${step}`).classList.add('active');
  
  // Update steps indicator
  document.querySelectorAll('.booking-step').forEach(s => {
    const stepNum = parseInt(s.dataset.step);
    s.classList.remove('active', 'completed');
    if (stepNum === step) s.classList.add('active');
    if (stepNum < step) s.classList.add('completed');
  });
}

function updateBookingSummary() {
  const service = state.services.find(s => s.id == state.selectedService);
  const summary = document.getElementById('bookingSummary');
  summary.innerHTML = `
    <p style="margin:0.2rem 0"><strong>Serviço:</strong> ${service ? service.name : ''}</p>
    <p style="margin:0.2rem 0"><strong>Data:</strong> ${formatDateBR(state.selectedDate)}</p>
    <p style="margin:0.2rem 0"><strong>Horário:</strong> ${state.selectedTime}</p>
  `;
}

// ========== SUBMIT BOOKING ==========
async function submitBooking() {
  const name = document.getElementById('bookingName').value.trim();
  const phone = document.getElementById('bookingPhone').value.trim();
  const email = document.getElementById('bookingEmail').value.trim();
  const notes = document.getElementById('bookingNotes').value.trim();
  
  if (!name || !phone) {
    showToast('Preencha nome e telefone', 'error');
    return;
  }
  
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;margin:0"></div> Agendando...';
  
  try {
    const res = await fetch(`${CONFIG.apiBase}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: name,
        client_phone: phone,
        client_email: email,
        service_id: state.selectedService,
        appointment_date: state.selectedDate,
        appointment_time: state.selectedTime,
        notes
      })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      showConfirmationModal(data.appointment);
      resetBookingForm();
    } else {
      showToast(data.error || 'Erro ao agendar', 'error');
    }
  } catch (err) {
    showToast('Erro de conexão. Tente novamente.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Confirmar Agendamento`;
  }
}

function resetBookingForm() {
  document.getElementById('bookingService').value = '';
  document.getElementById('bookingName').value = '';
  document.getElementById('bookingPhone').value = '';
  document.getElementById('bookingEmail').value = '';
  document.getElementById('bookingNotes').value = '';
  state.selectedService = null;
  state.selectedDate = null;
  state.selectedTime = null;
  bookingNextStep(1);
}

// ========== CONFIRMATION MODAL ==========
function showConfirmationModal(appointment) {
  const modal = document.getElementById('confirmationModal');
  const details = document.getElementById('modalDetails');
  const whatsappLink = document.getElementById('modalWhatsApp');
  
  details.innerHTML = `
    <p><strong>Cliente:</strong> ${appointment.client_name}</p>
    <p><strong>Serviço:</strong> ${appointment.service_name}</p>
    <p><strong>Data:</strong> ${formatDateBR(appointment.appointment_date)}</p>
    <p><strong>Horário:</strong> ${appointment.appointment_time}</p>
  `;
  
  // WhatsApp confirmation link
  const message = encodeURIComponent(
    `✨ *Novo Agendamento - ${CONFIG.clinicName}*\n\n` +
    `👤 *Cliente:* ${appointment.client_name}\n` +
    `📱 *Telefone:* ${appointment.client_phone}\n` +
    `💆 *Serviço:* ${appointment.service_name}\n` +
    `📅 *Data:* ${formatDateBR(appointment.appointment_date)}\n` +
    `🕐 *Horário:* ${appointment.appointment_time}\n\n` +
    `Aguardo confirmação. Obrigada! 🌹`
  );
  
  whatsappLink.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${message}`;
  
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('confirmationModal').classList.remove('active');
}

// ========== CONTACT FORM ==========
function initContactForm() {
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    
    if (!name || !message) {
      showToast('Preencha nome e mensagem', 'error');
      return;
    }
    
    try {
      const res = await fetch(`${CONFIG.apiBase}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message })
      });
      
      if (res.ok) {
        showToast('Mensagem enviada com sucesso!', 'success');
        form.reset();
      } else {
        showToast('Erro ao enviar mensagem', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão', 'error');
    }
  });
}

// ========== WHATSAPP LINKS ==========
function initWhatsAppLinks() {
  const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Gostaria de agendar um horário na Cadore Clinic. 🌹')}`;
  
  const elements = ['sideMenuWhatsApp', 'contactWhatsApp', 'footerWhatsApp', 'whatsAppFloat'];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.href = whatsappUrl;
      el.target = '_blank';
    }
  });
}

// ========== PHONE MASK ==========
function initPhoneMask() {
  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length <= 11) {
        if (value.length > 6) {
          value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (value.length > 2) {
          value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length > 0) {
          value = `(${value}`;
        }
      }
      e.target.value = value;
    });
  });
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  // Elegant 'info' toast includes a subtle icon and typographic treatment
  if (type === 'info') {
    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">\n        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x="16" y="2" x="16" y="6"/><line x="8" y="2" x="8" y="6"/><line x="3" y="10" x="21" y="10"/></svg>
      </span>
      <span class="toast-message">${String(message)}</span>
    `;
  } else {
    toast.textContent = message;
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ========== UTILITY FUNCTIONS ==========
function formatDateBR(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateISO(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ========== CLOSE MODAL ON OUTSIDE CLICK ==========
document.getElementById('confirmationModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ========== HERO LINES ANIMATION (2 linhas: topo e base) ========== 
function initHeroLines() {
  const canvas = document.getElementById('heroLines');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = canvas.offsetWidth;
  let height = canvas.height = canvas.offsetHeight;

  // Responsive resize
  window.addEventListener('resize', () => {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  });

  // Hero text area (evitar linhas no centro)
  const centerX = width / 2;
  const centerY = height * 0.45;
  const centerW = width * 0.44;
  const centerH = height * 0.32;

  // Apenas 2 linhas: topo e base
  const lines = [
    {
      phase: Math.random() * Math.PI * 2,
      speed: 0.18 + Math.random() * 0.22,
      amplitude: 18 + Math.random() * 18,
      yBase: height * 0.13,
      color: 'rgba(250, 248, 245, 0.55)',
      thickness: 1.3
    },
    {
      phase: Math.random() * Math.PI * 2,
      speed: 0.18 + Math.random() * 0.22,
      amplitude: 18 + Math.random() * 18,
      yBase: height * 0.87,
      color: 'rgba(250, 248, 245, 0.55)',
      thickness: 1.3
    }
  ];

  let t = 0;
  let slide = 0; // px de deslocamento para baixo
  let targetSlide = 0;

  // Detecta scroll para animar saída
  window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    // Quando o topo do hero sai da tela, começa a sumir
    const pct = Math.min(1, Math.max(0, 1 - (0 - rect.top) / (rect.height * 0.5)));
    targetSlide = (1 - pct) * 180; // até 180px para baixo
  });

  function animate() {
    // Easing para suavizar o movimento de saída
    slide += (targetSlide - slide) * 0.08;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(0, slide);
    lines.forEach((line) => {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = line.thickness;
      ctx.strokeStyle = line.color;
      let started = false;
      for (let x = 0; x <= width; x += 2) {
        // Evita desenhar dentro da área central do hero
        if (x > centerX - centerW/2 && x < centerX + centerW/2 && line.yBase > centerY - centerH/2 && line.yBase < centerY + centerH/2) {
          started = false;
          continue;
        }
        const y = line.yBase + Math.sin((x/width)*3*Math.PI + t*line.speed + line.phase) * line.amplitude * Math.exp(-t/80);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
    t += 0.25;
    requestAnimationFrame(animate);
  }
  animate();
}
