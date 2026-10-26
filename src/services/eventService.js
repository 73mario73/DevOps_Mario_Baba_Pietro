// Regole di business sugli eventi (US-03 creazione, US-04 catalogo).
const store = require('../data/store');

const EVENT_TYPES = ['Concerto', 'Workshop', 'DJ Set'];

// Stati di prenotazione che occupano un posto.
const ACTIVE_BOOKING_STATUSES = ['Confermata', 'In attesa di approvazione', 'Approvata'];

function parseDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Valida e normalizza i dati del form. Restituisce { errors, values }.
function validateEvent(input = {}, now = new Date()) {
  const errors = {};
  const values = {
    title: String(input.title || '').trim(),
    type: String(input.type || '').trim(),
    description: String(input.description || '').trim(),
    date: String(input.date || '').trim(),
    location: String(input.location || '').trim(),
    cost: input.cost === undefined || input.cost === '' ? '' : Number(input.cost),
    capacity: input.capacity === undefined || input.capacity === '' ? '' : Number(input.capacity),
  };

  if (!values.title) errors.title = 'Il titolo è obbligatorio.';
  if (!EVENT_TYPES.includes(values.type)) errors.type = 'Seleziona un tipo di evento valido.';
  if (!values.location) errors.location = 'Il luogo è obbligatorio.';

  const date = parseDate(values.date);
  if (!values.date || !date) {
    errors.date = 'Inserisci una data valida.';
  } else if (date <= now) {
    errors.date = 'Impossibile creare un evento con data passata';
  }

  // Il DJ Set è sempre a ingresso libero (US-06).
  if (values.type === 'DJ Set') values.cost = 0;

  const msgNumbers = 'Capienza e costo devono essere numeri maggiori o uguali a zero';
  if (values.cost === '' || !Number.isFinite(values.cost) || values.cost < 0) {
    errors.cost = msgNumbers;
  }
  if (values.capacity === '' || !Number.isFinite(values.capacity) || values.capacity < 0) {
    errors.capacity = msgNumbers;
  } else if (!Number.isInteger(values.capacity) || values.capacity < 1) {
    errors.capacity = 'La capienza deve essere un numero intero di almeno 1 posto.';
  }

  if (Number.isFinite(values.cost)) values.cost = Math.round(values.cost * 100) / 100;

  return { errors, values };
}

function createEvent(input) {
  const { errors, values } = validateEvent(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors, values };
  return { ok: true, event: store.addEvent(values) };
}

function occupiedSeats(eventId) {
  return store
    .getBookings({ eventId })
    .filter((b) => ACTIVE_BOOKING_STATUSES.includes(b.status)).length;
}

// Aggiunge al singolo evento i campi calcolati utili alle pagine.
function withAvailability(event) {
  if (!event) return null;
  const occupied = occupiedSeats(event.id);
  return { ...event, occupied, available: Math.max(event.capacity - occupied, 0) };
}

// Catalogo pubblico: solo eventi futuri e attivi, in ordine cronologico.
function listUpcoming(now = new Date()) {
  return store
    .getEvents()
    .filter((e) => e.status === 'Attivo' && parseDate(e.date) > now)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
    .map(withAvailability);
}

// Area staff: tutti gli eventi, anche passati.
function listAll() {
  return store
    .getEvents()
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
    .map(withAvailability);
}

function getEvent(id) {
  return withAvailability(store.getEvent(id));
}

module.exports = {
  EVENT_TYPES,
  ACTIVE_BOOKING_STATUSES,
  validateEvent,
  createEvent,
  listUpcoming,
  listAll,
  getEvent,
};
