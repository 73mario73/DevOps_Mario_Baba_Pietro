// Piccole funzioni di formattazione usate nelle pagine EJS.

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(value) {
  const n = Number(value);
  if (!n) return 'Gratis';
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

// Classe CSS per il badge del tipo evento.
function typeClass(type) {
  return { Concerto: 'concerto', Workshop: 'workshop', 'DJ Set': 'djset' }[type] || '';
}

// Classe CSS per il badge dello stato prenotazione.
function statusClass(status) {
  return (
    {
      Confermata: 'ok',
      Approvata: 'ok',
      'In attesa di approvazione': 'wait',
      Rifiutata: 'ko',
    }[status] || ''
  );
}

module.exports = { formatDate, formatPrice, typeClass, statusClass };
