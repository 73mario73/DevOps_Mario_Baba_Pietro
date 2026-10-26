// US-03 Creazione evento, US-04 Catalogo eventi.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { store, dateInDays, makeEvent } = require('./support/helpers');

beforeEach(() => store.reset({ withSeed: false }));

const validEvent = () => ({
  title: 'Concerto Rock',
  type: 'Concerto',
  date: dateInDays(10),
  location: 'Arena',
  cost: '20',
  capacity: '150',
});

test('US-04: la homepage mostra solo eventi futuri in ordine cronologico', async () => {
  makeEvent({ title: 'Più lontano', date: dateInDays(20) });
  makeEvent({ title: 'Già passato', date: dateInDays(-2) });
  makeEvent({ title: 'Più vicino', date: dateInDays(2) });

  const res = await request(app).get('/').expect(200);
  assert.ok(!res.text.includes('Già passato'));
  assert.ok(res.text.indexOf('Più vicino') < res.text.indexOf('Più lontano'));
});

test('US-04: senza eventi futuri appare il messaggio dedicato', async () => {
  const res = await request(app).get('/').expect(200);
  assert.match(res.text, /Al momento non ci sono eventi in programma\. Torna a trovarci!/);
});

test('US-04: il dettaglio mostra capienza totale e posti disponibili', async () => {
  const event = makeEvent({ capacity: 42 });
  const res = await request(app).get(`/events/${event.id}`).expect(200);
  assert.match(res.text, /Capienza totale<\/dt><dd>42/);
  assert.match(res.text, /Posti disponibili<\/dt><dd class="">42/);
});

test('US-03: un evento valido viene salvato e diventa visibile', async () => {
  const res = await request(app).post('/staff/events').type('form').send(validEvent()).expect(302);
  assert.match(res.headers.location, /^\/events\/1/);
  const home = await request(app).get('/');
  assert.match(home.text, /Concerto Rock/);
});

test('US-03: una data passata blocca il salvataggio', async () => {
  const res = await request(app)
    .post('/staff/events')
    .type('form')
    .send({ ...validEvent(), date: dateInDays(-1) })
    .expect(422);
  assert.match(res.text, /Impossibile creare un evento con data passata/);
  assert.equal(store.getEvents().length, 0);
});

test('US-03: costo o capienza negativi bloccano il salvataggio', async () => {
  const msg = /Capienza e costo devono essere numeri maggiori o uguali a zero/;
  const r1 = await request(app).post('/staff/events').type('form').send({ ...validEvent(), cost: '-5' }).expect(422);
  assert.match(r1.text, msg);
  const r2 = await request(app).post('/staff/events').type('form').send({ ...validEvent(), capacity: '-1' }).expect(422);
  assert.match(r2.text, msg);
  assert.equal(store.getEvents().length, 0);
});

test('US-06: un DJ Set viene sempre salvato con costo 0', async () => {
  await request(app)
    .post('/staff/events')
    .type('form')
    .send({ ...validEvent(), type: 'DJ Set', cost: '30' })
    .expect(302);
  assert.equal(store.getEvent(1).cost, 0);
});

test('un evento inesistente restituisce 404', async () => {
  await request(app).get('/events/999').expect(404);
});
