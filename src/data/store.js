// Archivio dati IN MEMORIA.
// In questa versione non c'è un database: i dati vivono in questi array
// e si azzerano a ogni riavvio del server (vengono ricaricati i dati di prova).
// Tutto l'accesso ai dati passa da qui: quando introdurremo un DB
// basterà riscrivere questo file mantenendo le stesse funzioni.

let events = [];
let bookings = [];
let nextEventId = 1;
let nextBookingId = 1;

// Restituisce una data "YYYY-MM-DDTHH:mm" tra `days` giorni, all'ora indicata.
function futureDate(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

function seed() {
  const samples = [
    {
      title: 'Notte Jazz al Teatro',
      type: 'Concerto',
      description: 'Un quartetto jazz dal vivo con standard e brani originali.',
      date: futureDate(7, 21),
      location: 'Teatro Comunale, Milano',
      cost: 25,
      capacity: 150,
    },
    {
      title: 'Workshop di Fotografia Urbana',
      type: 'Workshop',
      description: 'Mezza giornata tra teoria e uscita pratica in città. Posti limitati, iscrizione su approvazione.',
      date: futureDate(10, 10),
      location: 'Spazio Lab, Torino',
      cost: 40,
      capacity: 12,
    },
    {
      title: 'Sunset DJ Set',
      type: 'DJ Set',
      description: 'DJ set al tramonto in terrazza. Ingresso libero con pass digitale.',
      date: futureDate(14, 19),
      location: 'Terrazza Mare, Rimini',
      cost: 0,
      capacity: 200,
    },
    {
      title: 'Concerto Acustico Intimo',
      type: 'Concerto',
      description: 'Voce e chitarra in una sala piccola: pochissimi posti disponibili.',
      date: futureDate(4, 20),
      location: 'Sala Musica, Bologna',
      cost: 15,
      capacity: 3,
    },
  ];
  samples.forEach((e) => addEvent(e));
}

function reset({ withSeed = true } = {}) {
  events = [];
  bookings = [];
  nextEventId = 1;
  nextBookingId = 1;
  if (withSeed) seed();
}

// ---- Eventi ----
function addEvent(data) {
  const event = { id: nextEventId++, status: 'Attivo', createdAt: new Date().toISOString(), ...data };
  events.push(event);
  return event;
}

function getEvents() {
  return [...events];
}

function getEvent(id) {
  return events.find((e) => e.id === Number(id)) || null;
}

// ---- Prenotazioni ----
function addBooking(data) {
  const booking = { id: nextBookingId++, createdAt: new Date().toISOString(), ...data };
  bookings.push(booking);
  return booking;
}

function getBookings(filter = {}) {
  return bookings.filter((b) => filter.eventId === undefined || b.eventId === Number(filter.eventId));
}

function getBooking(id) {
  return bookings.find((b) => b.id === Number(id)) || null;
}

function updateBooking(id, changes) {
  const booking = getBooking(id);
  if (!booking) return null;
  Object.assign(booking, changes);
  return booking;
}

reset();

module.exports = {
  reset,
  addEvent,
  getEvents,
  getEvent,
  addBooking,
  getBookings,
  getBooking,
  updateBooking,
};
