// Configurazione dell'applicazione Express.
// È separata da server.js così i test possono usare l'app senza aprire una porta.
const path = require('path');
const express = require('express');
const helpers = require('./helpers');

const publicRoutes = require('./routes/public');
const staffRoutes = require('./routes/staff');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Funzioni di formattazione disponibili in tutte le pagine.
app.locals.h = helpers;

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/', publicRoutes);
app.use('/staff', staffRoutes);

app.use((req, res) => {
  res.status(404).render('404', { title: 'Pagina non trovata' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Errore', message: 'Si è verificato un errore inatteso.' });
});

module.exports = app;
