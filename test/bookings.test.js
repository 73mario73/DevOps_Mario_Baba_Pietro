// US-05 Concerto, US-06 DJ Set, US-07 richiesta Workshop, US-08 approvazione.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { store, makeEvent } = require('./support/helpers');

beforeEach(() => store.reset({ withSeed: false }));

function book(eventId, name = 'Mario Rossi', email = 'mario@example.com') {
  return request(app).post(`/events/${eventId}/bookings`).type('form').send({ name, email });
}

test('US-05: prenotare un concerto assegna il primo posto libero e scala la capienza', async () => {
  const event = makeEvent({ type: 'Concerto', capacity: 10 });
  await book(event.id, 'Anna', 'anna@example.com').expect(302);
  const res = await book(event.id, 'Luca', 'luca@example.com').expect(302);

  const ticket = await request(app).get(res.headers.location).expect(200);
  assert.match(ticket.text, /Posto numero <strong>2<\/strong>/);

  const detail = await request(app).get(`/events/${event.id}`);
  assert.match(detail.text, /Posti disponibili<\/dt><dd class="">8/);
});

test('US-05: con posti esauriti la prenotazione è bloccata e il pulsante disabilitato', async () => {
  const event = makeEvent({ type: 'Concerto', capacity: 1 });
  await book(event.id, 'Anna', 'anna@example.com').expect(302);

  const res = await book(event.id, 'Luca', 'luca@example.com').expect(422);
  assert.match(res.text, /Posti esauriti per questo spettacolo/);

  const detail = await request(app).get(`/events/${event.id}`);
  assert.match(detail.text, /<button class="btn" disabled>/);
});

test('la stessa email non può prenotare due volte lo stesso evento', async () => {
  const event = makeEvent();
  await book(event.id).expect(302);
  const res = await book(event.id).expect(422);
  assert.match(res.text, /già una prenotazione attiva/);
});

test('nome ed email sono obbligatori', async () => {
  const event = makeEvent();
  const res = await book(event.id, '', 'non-una-email').expect(422);
  assert.match(res.text, /Il nome è obbligatorio/);
  assert.match(res.text, /Inserisci un indirizzo email valido/);
});

test('US-06: il DJ Set crea subito un pass confermato a costo 0', async () => {
  const event = makeEvent({ type: 'DJ Set', cost: 15 }); // costo "sporco" volutamente
  const res = await book(event.id).expect(302);
  const booking = store.getBooking(res.headers.location.split('/').pop());
  assert.equal(booking.status, 'Confermata');
  assert.equal(booking.amount, 0);

  const ticket = await request(app).get(res.headers.location);
  assert.match(ticket.text, /PASS DIGITALE/);
});

test('US-06: DJ Set al completo nega il pass', async () => {
  const event = makeEvent({ type: 'DJ Set', cost: 0, capacity: 1 });
  await book(event.id, 'Anna', 'anna@example.com').expect(302);
  const res = await book(event.id, 'Luca', 'luca@example.com').expect(422);
  assert.match(res.text, /al completo/);
});

test('US-07: la richiesta per un Workshop resta in attesa e blocca lo slot', async () => {
  const event = makeEvent({ type: 'Workshop', capacity: 5 });
  const res = await book(event.id).expect(302);
  const ticket = await request(app).get(res.headers.location);
  assert.match(ticket.text, /La tua richiesta è al vaglio degli organizzatori, riceverai una mail a breve/);

  const detail = await request(app).get(`/events/${event.id}`);
  assert.match(detail.text, /Posti disponibili<\/dt><dd class="">4/);
});

test('US-07: una seconda richiesta per lo stesso Workshop viene rifiutata', async () => {
  const event = makeEvent({ type: 'Workshop' });
  await book(event.id).expect(302);
  const res = await book(event.id).expect(422);
  assert.match(res.text, /Hai già una richiesta attiva in esame per questo Workshop/);
});

test('US-08: lo staff approva una richiesta', async () => {
  const event = makeEvent({ type: 'Workshop' });
  await book(event.id).expect(302);
  await request(app).post('/staff/bookings/1/approve').expect(302);
  assert.equal(store.getBooking(1).status, 'Approvata');
});

test('US-08: il rifiuto richiede una motivazione e libera il posto', async () => {
  const event = makeEvent({ type: 'Workshop', capacity: 1 });
  await book(event.id).expect(302);

  await request(app).post('/staff/bookings/1/reject').type('form').send({ note: '' }).expect(302);
  assert.equal(store.getBooking(1).status, 'In attesa di approvazione');

  await request(app).post('/staff/bookings/1/reject').type('form').send({ note: 'Profilo non adatto' }).expect(302);
  assert.equal(store.getBooking(1).status, 'Rifiutata');

  // Il posto è di nuovo libero.
  await book(event.id, 'Luca', 'luca@example.com').expect(302);
});

test('area staff: la tabella prenotazioni filtra per stato', async () => {
  const event = makeEvent({ type: 'Workshop' });
  await book(event.id, 'Anna', 'anna@example.com');
  await book(event.id, 'Luca', 'luca@example.com');
  await request(app).post('/staff/bookings/1/approve');

  const res = await request(app)
    .get(`/staff/events/${event.id}/bookings`)
    .query({ status: 'In attesa di approvazione' })
    .expect(200);
  assert.match(res.text, /luca@example\.com/);
  assert.doesNotMatch(res.text, /anna@example\.com/);
});
