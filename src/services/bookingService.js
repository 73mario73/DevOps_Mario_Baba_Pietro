// Regole di business sulle prenotazioni.
// US-05 Concerto (posto numerato), US-06 DJ Set (pass gratuito),
// US-07 Workshop (richiesta), US-08 approvazione/rifiuto.
// In questa versione non c'è login: chi prenota indica nome ed email.
const store = require('../data/store');
const eventService = require('./eventService');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateBookingInput(input = {}) {
  const errors = {};
  const values = {
    name: String(input.name || '').trim(),
    email: String(input.email || '').trim().toLowerCase(),
  };
  if (!values.name) errors.name = 'Il nome è obbligatorio.';
  if (!EMAIL_RE.test(values.email)) errors.email = 'Inserisci un indirizzo email valido.';
  return { errors, values };
}

// Primo numero di posto libero tra 1 e capienza.
function firstFreeSeat(event) {
  const taken = new Set(
    store
      .getBookings({ eventId: event.id })
      .filter((b) => eventService.ACTIVE_BOOKING_STATUSES.includes(b.status) && b.seatNumber)
      .map((b) => b.seatNumber),
  );
  for (let seat = 1; seat <= event.capacity; seat++) {
    if (!taken.has(seat)) return seat;
  }
  return null;
}

function soldOutMessage(event) {
  if (event.type === 'DJ Set') return 'Il locale è al completo: non ci sono più pass disponibili.';
  if (event.type === 'Workshop') return 'Il Workshop ha raggiunto il numero massimo di iscritti.';
  return 'Posti esauriti per questo spettacolo';
}

function book(eventId, input) {
  const event = eventService.getEvent(eventId);
  if (!event || event.status !== 'Attivo') {
    return { ok: false, errors: { general: 'Evento non trovato.' }, values: {} };
  }
  if (new Date(event.date) <= new Date()) {
    return { ok: false, errors: { general: 'Questo evento si è già svolto.' }, values: {} };
  }

  const { errors, values } = validateBookingInput(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors, values };

  if (event.available <= 0) {
    return { ok: false, errors: { general: soldOutMessage(event) }, values };
  }

  const alreadyActive = store
    .getBookings({ eventId: event.id })
    .find((b) => b.email === values.email && eventService.ACTIVE_BOOKING_STATUSES.includes(b.status));

  if (alreadyActive) {
    const message =
      event.type === 'Workshop' && alreadyActive.status === 'In attesa di approvazione'
        ? 'Hai già una richiesta attiva in esame per questo Workshop'
        : 'Questa email ha già una prenotazione attiva per questo evento.';
    return { ok: false, errors: { general: message }, values };
  }

  const base = { eventId: event.id, name: values.name, email: values.email };
  let booking;

  if (event.type === 'Concerto') {
    booking = store.addBooking({
      ...base,
      status: 'Confermata',
      seatNumber: firstFreeSeat(event),
      amount: event.cost,
    });
  } else if (event.type === 'DJ Set') {
    // Il costo viene forzato a 0, qualunque sia il valore dell'evento.
    booking = store.addBooking({ ...base, status: 'Confermata', amount: 0 });
  } else {
    // Workshop: la richiesta blocca lo slot ma va approvata dallo staff.
    booking = store.addBooking({ ...base, status: 'In attesa di approvazione', amount: event.cost });
  }

  return { ok: true, booking, event };
}

function decide(bookingId, decision, note = '') {
  const booking = store.getBooking(bookingId);
  if (!booking) return { ok: false, error: 'Prenotazione non trovata.' };
  const event = eventService.getEvent(booking.eventId);
  if (!event || event.type !== 'Workshop') {
    return { ok: false, error: 'Solo le richieste dei Workshop richiedono approvazione.' };
  }
  if (booking.status !== 'In attesa di approvazione') {
    return { ok: false, error: 'Questa richiesta è già stata gestita.' };
  }

  if (decision === 'approve') {
    const approved = store
      .getBookings({ eventId: event.id })
      .filter((b) => b.status === 'Approvata').length;
    if (approved >= event.capacity) {
      return { ok: false, error: 'Impossibile approvare. Hai già esaurito la capienza massima del Workshop' };
    }
    return { ok: true, booking: store.updateBooking(booking.id, { status: 'Approvata' }) };
  }

  if (decision === 'reject') {
    const reason = String(note || '').trim();
    if (!reason) return { ok: false, error: 'Inserisci una motivazione per il rifiuto.' };
    // Lo stato "Rifiutata" non occupa posti: lo slot torna libero.
    return { ok: true, booking: store.updateBooking(booking.id, { status: 'Rifiutata', note: reason }) };
  }

  return { ok: false, error: 'Azione non valida.' };
}

function getBooking(id) {
  const booking = store.getBooking(id);
  if (!booking) return null;
  return { ...booking, event: store.getEvent(booking.eventId) };
}

function listForEvent(eventId, status) {
  return store
    .getBookings({ eventId })
    .filter((b) => !status || b.status === status)
    .sort((a, b) => a.id - b.id);
}

module.exports = { book, decide, getBooking, listForEvent };
