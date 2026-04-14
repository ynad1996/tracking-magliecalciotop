const form = document.getElementById('tracking-form');
const messageEl = document.getElementById('message');
const resultEl = document.getElementById('result');
const eventsBodyEl = document.getElementById('eventsBody');

const fields = {
  currentStatus: document.getElementById('currentStatus'),
  statusBadge: document.getElementById('statusBadge'),
  trackingNumber: document.getElementById('trackingNumber'),
  referenceNo: document.getElementById('referenceNo'),
  country: document.getElementById('country'),
  consigneeName: document.getElementById('consigneeName'),
  summaryDate: document.getElementById('summaryDate')
};

function showMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function hideMessage() {
  messageEl.textContent = '';
  messageEl.className = 'message hidden';
}

function statusVariant(status) {
  const value = String(status || '').toLowerCase();

  if (value.includes('consegn') || value.includes('completato')) {
    return 'success';
  }

  if (value.includes('dogana') || value.includes('sdogan')) {
    return 'warning';
  }

  if (value.includes('volo') || value.includes('aeroporto') || value.includes('transito')) {
    return 'info';
  }

  return 'neutral';
}

function renderResult(data) {
  fields.currentStatus.textContent = data.currentStatus || '-';
  fields.statusBadge.textContent = data.currentStatus || 'In lavorazione';
  fields.statusBadge.className = `badge ${statusVariant(data.currentStatus)}`;
  fields.trackingNumber.textContent = data.trackingNumber || '-';
  fields.referenceNo.textContent = data.referenceNo || '-';
  fields.country.textContent = data.country || '-';
  fields.consigneeName.textContent = data.consigneeName || '-';
  fields.summaryDate.textContent = data.date || '-';

  eventsBodyEl.innerHTML = '';

  for (const event of data.events || []) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(event.date || '-')}</td>
      <td>${escapeHtml(event.location || '-')}</td>
      <td>${escapeHtml(event.record || '-')}</td>
    `;
    eventsBodyEl.appendChild(row);
  }

  resultEl.classList.remove('hidden');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const trackingCode = String(formData.get('trackingCode') || '').trim().toUpperCase();

  if (!trackingCode) {
    showMessage('Inserisci un codice tracking valido.', 'error');
    return;
  }

  hideMessage();
  resultEl.classList.add('hidden');
  showMessage('Ricerca spedizione in corso...', 'info');

  try {
    const response = await fetch('/api/tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ trackingCode })
    });

    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || 'Errore durante il recupero del tracking.');
    }

    renderResult(payload.data);
    showMessage('Tracking recuperato correttamente.', 'success');
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Errore imprevisto.', 'error');
  }
});
