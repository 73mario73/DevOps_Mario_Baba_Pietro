// Pagine pubbliche: catalogo, dettaglio evento, prenotazione, biglietto.
const express = require('express');
const eventService = require('../services/eventService');
const bookingService = require('../services/bookingService');

const router = express.Router();

// US-04: catalogo degli eventi futuri.
router.get('/', (req, res) => {
  res.render('index', { title: 'Eventi in programma', events: eventService.listUpcoming() });
});

// US-04: dettaglio evento con posti disponibili e form di prenotazione.
router.get('/events/:id', (req, res, next) => {
  const event = eventService.getEvent(req.params.id);
  if (!event) return next();
  res.render('event', {
    title: event.title,
    event,
    errors: {},
    values: {},
    created: req.query.created === '1',
  });
});

// US-05 / US-06 / US-07: prenotazione in base al tipo di evento.
router.post('/events/:id/bookings', (req, res, next) => {
  const event = eventService.getEvent(req.params.id);
  if (!event) return next();

  const result = bookingService.book(event.id, req.body);
  if (!result.ok) {
    return res.status(422).render('event', {
      title: event.title,
      event,
      errors: result.errors,
      values: result.values,
    });
  }
  // Post/Redirect/Get: ricaricare la pagina non crea una seconda prenotazione.
  res.redirect(`/bookings/${result.booking.id}`);
});

// Biglietto / pass / stato della richiesta.
router.get('/bookings/:id', (req, res, next) => {
  const booking = bookingService.getBooking(req.params.id);
  if (!booking) return next();
  res.render('booking', { title: 'La tua prenotazione', booking });
});

module.exports = router;
