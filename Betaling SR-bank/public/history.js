const body = document.getElementById('history-body');
const statusText = document.getElementById('history-status');

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('nb-NO');
}

function renderRows(historyItems) {
  body.innerHTML = '';

  if (historyItems.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="7">Ingen historikk funnet.</td>';
    body.appendChild(tr);
    return;
  }

  historyItems.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${formatDate(item.createdAt)}</td>
      <td>${item.caseHandler || ''}</td>
      <td>${item.cloNumber || ''}</td>
      <td>${item.transactionsCount || 0}</td>
      <td>${item.generatedFileName || ''}</td>
      <td><a class="manage-link" href="/api/history/${item.id}/download">Last ned</a></td>
    `;
    body.appendChild(tr);
  });
}

async function loadHistory() {
  statusText.textContent = 'Henter historikk...';

  try {
    const response = await fetch('/api/history');
    if (!response.ok) throw new Error('Kunne ikke hente historikk.');

    const historyItems = await response.json();
    renderRows(historyItems);
    statusText.textContent = `Lastet ${historyItems.length} historikk-oppforinger.`;
  } catch (error) {
    statusText.textContent = error.message;
  }
}

loadHistory();
