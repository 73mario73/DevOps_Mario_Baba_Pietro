# 🎟️ Gestione Eventi — v0.1

Una semplice web app per gestire eventi (**Concerti**, **Workshop**, **DJ Set**) scritta in **Node.js + Express**, con pagine generate dal server tramite **EJS**.

In questa prima versione:

- **non c'è un database**: i dati restano in memoria e si azzerano a ogni riavvio (all'avvio vengono caricati 4 eventi di esempio);
- **non ci sono registrazione e login**: chi prenota inserisce nome ed email, e l'area staff è libera.

## Funzionalità

| User story | Cosa fa l'app |
|---|---|
| US-04 Catalogo | La homepage elenca gli eventi futuri in ordine di data. Il dettaglio mostra la capienza e i posti rimasti. Se non ci sono eventi compare un messaggio dedicato. |
| US-03 Creazione evento | Area staff → "Nuovo evento". Il form blocca le date passate e i valori negativi. |
| US-05 Concerto | La prenotazione assegna il primo posto numerato libero. Quando i posti finiscono compare "Posti esauriti". |
| US-06 DJ Set | Il pass gratuito viene confermato subito e il costo è sempre 0. |
| US-07 Workshop | La richiesta resta "In attesa di approvazione" e blocca il posto. Non si possono inviare richieste doppie. |
| US-08 Approvazione | Dall'area staff si possono approvare le richieste o rifiutarle con una motivazione; il rifiuto libera il posto. |
| (base US-09) | Tabella delle prenotazioni di ogni evento, con filtro per stato. |

## Avvio su GitHub Codespaces

1. Carica il progetto in un repository GitHub (vedi la sezione "Primo caricamento" più sotto).
2. Nel repository: **Code → Codespaces → Create codespace on main**.
3. Attendi la creazione. Il Codespace legge `.devcontainer/devcontainer.json`, installa Node 22 ed esegue `npm install` da solo.
4. Nel terminale scrivi:
   ```bash
   npm run dev
   ```
5. Codespaces mostra il popup **"Your application running on port 3000 is available"**: clicca **Open in Browser**. In alternativa apri la scheda **Ports** e clicca sull'icona del globo accanto alla porta 3000.

Con `npm run dev` il server si riavvia da solo quando salvi un file. Per fermarlo premi `Ctrl + C`.

## Avvio in locale

Requisito: Node.js 22 o superiore.

```bash
npm install
npm run dev        # oppure: npm start
```

Poi apri http://localhost:3000

## Comandi

| Comando | Descrizione |
|---|---|
| `npm start` | Avvia il server |
| `npm run dev` | Avvia il server con riavvio automatico quando salvi un file |
| `npm test` | Esegue i test automatici (`node:test` + `supertest`) |

La GitHub Action in `.github/workflows/ci.yml` esegue i test a ogni push su `main` e a ogni pull request.

## Struttura

```
.devcontainer/        configurazione di Codespaces
.github/workflows/    CI con GitHub Actions
public/css/           foglio di stile
src/
  app.js              configurazione di Express
  server.js           avvio sulla porta 3000
  helpers.js          formattazione di date e prezzi
  data/store.js       archivio in memoria + dati di esempio (da sostituire con un DB in futuro)
  services/           regole di business (eventi, prenotazioni)
  routes/             pagine pubbliche e area staff
  views/              pagine EJS
test/                 test automatici legati ai criteri di accettazione
```

## Primo caricamento su GitHub

**Opzione A, dal browser:** crea un repository vuoto su GitHub, poi usa **Add file → Upload files** e trascina il contenuto della cartella. Le cartelle che iniziano con il punto (`.devcontainer`, `.github`) sono nascoste in molti sistemi: assicurati di includerle.

**Opzione B, da terminale:**

```bash
git init
git add .
git commit -m "Gestione Eventi v0.1"
git branch -M main
git remote add origin https://github.com/<tuo-utente>/gestione-eventi.git
git push -u origin main
```

## Prossimi passi

- **v0.2**: registrazione e login (US-01, US-02), area staff protetta, pagina "Le mie prenotazioni", cancellazione delle prenotazioni (US-12)
- **v0.3**: annullamento evento con notifica email (US-11), pagamenti PayPal (US-10), lista d'attesa (US-13)
- **in seguito**: persistenza su database
