const app = require('./app');

const PORT = process.env.PORT || 3000;

// 0.0.0.0 permette a Codespaces di inoltrare la porta verso il browser.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gestione Eventi avviata su http://localhost:${PORT}`);
});
