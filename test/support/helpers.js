// Utility condivise dai test.
const store = require('../../src/data/store');

function dateInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 16); // formato "YYYY-MM-DDTHH:mm"
}

function makeEvent(overrides = {}) {
  return store.addEvent({
    title: 'Evento di test',
    type: 'Concerto',
    description: '',
    date: dateInDays(5),
    location: 'Sala Test',
    cost: 10,
    capacity: 10,
    ...overrides,
  });
}

module.exports = { store, dateInDays, makeEvent };
