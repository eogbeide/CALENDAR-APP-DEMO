(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────
  var STORAGE_KEY   = 'calendarEvents';
  var DAYS_SHORT    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS        = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
  var MAX_PILLS     = 3;
  var DEFAULT_COLOR = '#5c6bc0';

  var EVENT_COLORS = [
    { color: '#5c6bc0', name: 'Indigo' },
    { color: '#1a73e8', name: 'Blue' },
    { color: '#d50000', name: 'Tomato' },
    { color: '#e67c73', name: 'Flamingo' },
    { color: '#f4511e', name: 'Tangerine' },
    { color: '#f6bf26', name: 'Banana' },
    { color: '#33b679', name: 'Sage' },
    { color: '#0b8043', name: 'Basil' },
    { color: '#039be5', name: 'Peacock' },
    { color: '#3f51b5', name: 'Lavender' },
    { color: '#7986cb', name: 'Grape' },
    { color: '#8e24aa', name: 'Graphite' }
  ];

  // ── State ──────────────────────────────────────────────────
  var today        = new Date();
  var currentYear  = today.getFullYear();
  var currentMonth = today.getMonth();
  var events       = [];
  var editingId    = null;
  var modalOpener  = null;  // element that opened the modal; focus returns here on close

  // ── localStorage ───────────────────────────────────────────
  function loadEvents() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      events = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      events = [];
    }
  }

  function saveEvents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  // ── Utilities ──────────────────────────────────────────────
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function toDateStr(year, month, day) {
    return year + '-' +
      String(month + 1).padStart(2, '0') + '-' +
      String(day).padStart(2, '0');
  }

  function getEventsForDate(dateStr) {
    return events
      .filter(function (ev) { return ev.date === dateStr; })
      .sort(function (a, b) {
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }

  // ── Focus trap ─────────────────────────────────────────────
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function trapFocus(e) {
    var modal      = document.getElementById('event-modal');
    var focusable  = Array.from(modal.querySelectorAll(FOCUSABLE));
    var first      = focusable[0];
    var last       = focusable[focusable.length - 1];
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  // ── Calendar rendering ─────────────────────────────────────
  function renderCalendar() {
    var label = MONTHS[currentMonth] + ' ' + currentYear;
    document.getElementById('month-title').textContent = label;
    document.getElementById('live-region').textContent = label;
    buildDayCells();
  }

  function buildDayCells() {
    var grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    DAYS_SHORT.forEach(function (day) {
      var cell = document.createElement('div');
      cell.className = 'weekday-header';
      cell.textContent = day;
      grid.appendChild(cell);
    });

    var firstDay        = new Date(currentYear, currentMonth, 1).getDay();
    var daysInMonth     = new Date(currentYear, currentMonth + 1, 0).getDate();
    var daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    var nowDate         = new Date();

    for (var i = 0; i < firstDay; i++) {
      grid.appendChild(makeFillerCell(daysInPrevMonth - firstDay + 1 + i));
    }

    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = toDateStr(currentYear, currentMonth, d);
      var isToday = (d === nowDate.getDate() &&
                     currentMonth === nowDate.getMonth() &&
                     currentYear  === nowDate.getFullYear());
      grid.appendChild(makeDayCell(d, dateStr, isToday));
    }

    var totalCells = firstDay + daysInMonth;
    var remainder  = totalCells % 7;
    var trailing   = remainder === 0 ? 0 : 7 - remainder;
    for (var j = 1; j <= trailing; j++) {
      grid.appendChild(makeFillerCell(j));
    }
  }

  function makeFillerCell(dayNum) {
    var cell = document.createElement('div');
    cell.className = 'day-cell day-cell--filler';
    var num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = dayNum;
    cell.appendChild(num);
    return cell;
  }

  function makeDayCell(dayNum, dateStr, isToday) {
    var cell = document.createElement('div');
    cell.className = 'day-cell' + (isToday ? ' day-cell--today' : '');
    cell.dataset.date = dateStr;

    var num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = dayNum;
    cell.appendChild(num);

    var dayEvents = getEventsForDate(dateStr);
    var visible   = dayEvents.slice(0, MAX_PILLS);
    var overflow  = dayEvents.length - visible.length;

    // Desktop: dot + text event items
    visible.forEach(function (ev) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'event-item';
      item.dataset.eventId = ev.id;

      var dot = document.createElement('span');
      dot.className = 'event-dot-inline';
      dot.setAttribute('aria-hidden', 'true');
      dot.style.background = ev.color || DEFAULT_COLOR;

      var label = document.createElement('span');
      label.className = 'event-label';
      label.textContent = (ev.startTime ? ev.startTime + ' ' : '') + ev.title;

      item.appendChild(dot);
      item.appendChild(label);
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        openModal(dateStr, ev.id);
      });
      cell.appendChild(item);
    });

    if (overflow > 0) {
      var more = document.createElement('div');
      more.className = 'event-overflow';
      more.textContent = '+' + overflow + ' more';
      more.addEventListener('click', function (e) {
        e.stopPropagation();
        openModal(dateStr, null);
      });
      cell.appendChild(more);
    }

    // Mobile: dots row (shown via CSS at ≤640px)
    if (dayEvents.length > 0) {
      var dotsRow = document.createElement('div');
      dotsRow.className = 'dots-row';
      var dotCount = Math.min(dayEvents.length, 3);
      for (var k = 0; k < dotCount; k++) {
        var mobileDot = document.createElement('span');
        mobileDot.className = 'event-dot';
        mobileDot.style.background = dayEvents[k].color || DEFAULT_COLOR;
        dotsRow.appendChild(mobileDot);
      }
      cell.appendChild(dotsRow);
    }

    cell.addEventListener('click', function () {
      openModal(dateStr, null);
    });

    return cell;
  }

  // ── Color swatches ─────────────────────────────────────────
  function buildColorSwatches() {
    var container = document.getElementById('color-swatches');
    EVENT_COLORS.forEach(function (item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-swatch';
      btn.style.setProperty('--swatch-color', item.color);
      btn.style.background = item.color;
      btn.dataset.color = item.color;
      btn.setAttribute('aria-label', item.name);
      btn.addEventListener('click', function () {
        selectColor(item.color);
      });
      container.appendChild(btn);
    });
  }

  function selectColor(color) {
    document.getElementById('input-color').value = color;
    document.querySelectorAll('.color-swatch').forEach(function (sw) {
      sw.classList.toggle('selected', sw.dataset.color === color);
    });
  }

  // ── Modal ──────────────────────────────────────────────────
  function openModal(date, eventId) {
    editingId = eventId || null;
    clearErrors();

    var modal     = document.getElementById('event-modal');
    var btnDelete = document.getElementById('btn-delete-event');

    if (editingId) {
      var ev = events.find(function (e) { return e.id === editingId; });
      if (!ev) { closeModal(); return; }
      document.getElementById('input-title').value = ev.title;
      document.getElementById('input-date').value  = ev.date;
      document.getElementById('input-start').value = ev.startTime || '';
      document.getElementById('input-end').value   = ev.endTime   || '';
      document.getElementById('input-notes').value = ev.notes     || '';
      selectColor(ev.color || DEFAULT_COLOR);
      btnDelete.hidden = false;
    } else {
      document.getElementById('event-form').reset();
      document.getElementById('input-date').value = date || '';
      selectColor(DEFAULT_COLOR);
      btnDelete.hidden = true;
    }

    modal.setAttribute('aria-hidden', 'false');
    modalOpener = document.activeElement;
    document.getElementById('input-title').focus();
    modal.addEventListener('keydown', trapFocus);
  }

  function closeModal() {
    var modal = document.getElementById('event-modal');
    modal.setAttribute('aria-hidden', 'true');
    modal.removeEventListener('keydown', trapFocus);
    document.getElementById('event-form').reset();
    clearErrors();
    editingId = null;
    if (modalOpener && typeof modalOpener.focus === 'function') {
      modalOpener.focus();
      modalOpener = null;
    }
  }

  function clearErrors() {
    document.getElementById('err-title').textContent = '';
    document.getElementById('err-date').textContent  = '';
    document.getElementById('err-time').textContent  = '';
  }

  // ── Validation ─────────────────────────────────────────────
  function validateForm(data) {
    var errors = {};
    if (!data.title)  errors.title = 'Title is required.';
    if (!data.date)   errors.date  = 'Date is required.';
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      errors.time = 'End time must be after start time.';
    }
    return errors;
  }

  // ── Event CRUD ─────────────────────────────────────────────
  function addEvent(data) {
    events.push({
      id:        generateId(),
      title:     data.title,
      date:      data.date,
      startTime: data.startTime,
      endTime:   data.endTime,
      notes:     data.notes,
      color:     data.color,
      createdAt: new Date().toISOString()
    });
    saveEvents();
  }

  function updateEvent(id, data) {
    var idx = events.findIndex(function (ev) { return ev.id === id; });
    if (idx === -1) return;
    events[idx] = Object.assign({}, events[idx], {
      title:     data.title,
      date:      data.date,
      startTime: data.startTime,
      endTime:   data.endTime,
      notes:     data.notes,
      color:     data.color,
      updatedAt: new Date().toISOString()
    });
    saveEvents();
  }

  function deleteEvent(id) {
    events = events.filter(function (ev) { return ev.id !== id; });
    saveEvents();
  }

  // ── Form submit ────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault();
    clearErrors();

    var data = {
      title:     document.getElementById('input-title').value.trim(),
      date:      document.getElementById('input-date').value,
      startTime: document.getElementById('input-start').value,
      endTime:   document.getElementById('input-end').value,
      notes:     document.getElementById('input-notes').value.trim(),
      color:     document.getElementById('input-color').value || DEFAULT_COLOR
    };

    var errors = validateForm(data);
    if (errors.title) document.getElementById('err-title').textContent = errors.title;
    if (errors.date)  document.getElementById('err-date').textContent  = errors.date;
    if (errors.time)  document.getElementById('err-time').textContent  = errors.time;
    if (Object.keys(errors).length > 0) return;

    if (editingId) {
      updateEvent(editingId, data);
    } else {
      addEvent(data);
    }

    closeModal();
    renderCalendar();
  }

  // ── Navigation ─────────────────────────────────────────────
  function goToPrevMonth() {
    if (currentMonth === 0) { currentMonth = 11; currentYear--; }
    else { currentMonth--; }
    renderCalendar();
  }

  function goToNextMonth() {
    if (currentMonth === 11) { currentMonth = 0; currentYear++; }
    else { currentMonth++; }
    renderCalendar();
  }

  function goToToday() {
    var now      = new Date();
    currentYear  = now.getFullYear();
    currentMonth = now.getMonth();
    renderCalendar();
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    loadEvents();
    buildColorSwatches();

    document.getElementById('btn-prev').addEventListener('click', goToPrevMonth);
    document.getElementById('btn-next').addEventListener('click', goToNextMonth);
    document.getElementById('btn-today').addEventListener('click', goToToday);

    document.getElementById('btn-add-event').addEventListener('click', function () {
      var now = new Date();
      var date = (currentYear === now.getFullYear() && currentMonth === now.getMonth())
        ? toDateStr(now.getFullYear(), now.getMonth(), now.getDate())
        : toDateStr(currentYear, currentMonth, 1);
      openModal(date, null);
    });

    document.getElementById('btn-modal-close').addEventListener('click', closeModal);
    document.getElementById('btn-cancel').addEventListener('click', closeModal);

    document.getElementById('event-modal').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('event-form').addEventListener('submit', handleSubmit);

    document.getElementById('btn-delete-event').addEventListener('click', function () {
      if (editingId && confirm('Delete this event?')) {
        deleteEvent(editingId);
        closeModal();
        renderCalendar();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    renderCalendar();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
