// Area staff: creazione eventi e gestione prenotazioni.
// NOTA: in questa versione non c'è login, quindi l'area è accessibile a tutti.
// Quando introdurremo l'autenticazione basterà proteggere questo router.
const express = require('express');
const eventService = require('../services/eventService');
const bookingService = require('../services/bookingService');

const router = express.Router();

const BOOKING_STATUSES = ['Confermata', 'In attesa di approvazione', 'Approvata', 'Rifiutata'];

router.get('/', (req, res) => {
  res.render('staff/dashboard', { title: 'Area staff', events: eventService.listAll() });
});

// US-03: form di creazione evento.
router.get('/events/new', (req, res) => {
  res.render('staff/new-event', {
    title: 'Nuovo evento',
    types: eventService.EVENT_TYPES,
    errors: {},
    values: {},
  });
});

router.post('/events', (req, res) => {
  const result = eventService.createEvent(req.body);
  if (!result.ok) {
    return res.status(422).render('staff/new-event', {
      title: 'Nuovo evento',
      types: eventService.EVENT_TYPES,
      errors: result.errors,
      values: result.values,
    });
  }
  res.redirect(`/events/${result.event.id}?created=1`);
});

// Elenco prenotazioni di un evento, con filtro per stato.
router.get('/events/:id/bookings', (req, res, next) => {
  const event = eventService.getEvent(req.params.id);
  if (!event) return next();
  const status = BOOKING_STATUSES.includes(req.query.status) ? req.query.status : '';
  res.render('staff/bookings', {
    title: `Prenotazioni – ${event.title}`,
    event,
    bookings: bookingService.listForEvent(event.id, status),
    statuses: BOOKING_STATUSES,
    status,
    message: req.query.msg || '',
    error: req.query.err || '',
  });
});

// US-08: approvazione / rifiuto delle richieste per i Workshop.
router.post('/bookings/:id/:decision', (req, res, next) => {
  if (!['approve', 'reject'].includes(req.params.decision)) return next();
  const booking = bookingService.getBooking(req.params.id);
  if (!booking) return next();
  const result = bookingService.decide(booking.id, req.params.decision, req.body?.note);
  const back = `/staff/events/${booking.eventId}/bookings`;
  if (!result.ok) return res.redirect(`${back}?err=${encodeURIComponent(result.error)}`);
  const msg = req.params.decision === 'approve' ? 'Richiesta approvata.' : 'Richiesta rifiutata, posto liberato.';
  res.redirect(`${back}?msg=${encodeURIComponent(msg)}`);
});

module.exports = router;
