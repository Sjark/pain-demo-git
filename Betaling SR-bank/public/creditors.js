const body = document.getElementById('creditors-body');
const statusText = document.getElementById('creditors-status');
const addButton = document.getElementById('add-creditor');
const saveButton = document.getElementById('save-creditors');

function isValidMod11(numberString) {
  if (!/^\d+$/.test(numberString) || numberString.length < 2) return false;

  const digits = numberString.split('').map(Number);
  const controlDigit = digits[digits.length - 1];
  const payload = digits.slice(0, -1).reverse();
  let sum = 0;

  for (let i = 0; i < payload.length; i += 1) {
    const weight = (i % 6) + 2;
    sum += payload[i] * weight;
  }

  const remainder = sum % 11;
  let calculated = 11 - remainder;
  if (calculated === 11) calculated = 0;
  if (calculated === 10) return false;

  return calculated === controlDigit;
}

function makeInput(className, value = '') {
  const input = document.createElement('input');
  input.className = className;
  input.value = value;
  return input;
}

function createRow(creditor, rowNumber) {
  const tr = document.createElement('tr');
  tr.dataset.id = creditor.id || '';

  const idxTd = document.createElement('td');
  idxTd.className = 'row-index';
  idxTd.textContent = String(rowNumber);
  tr.appendChild(idxTd);

  const nameTd = document.createElement('td');
  nameTd.appendChild(makeInput('cred-name', creditor.name || ''));
  tr.appendChild(nameTd);

  const accountTd = document.createElement('td');
  const accountInput = makeInput('cred-account', creditor.accountNumber || '');
  accountInput.inputMode = 'numeric';
  accountTd.appendChild(accountInput);
  tr.appendChild(accountTd);

  const actionTd = document.createElement('td');
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = 'Slett';
  removeBtn.className = 'delete-btn';
  removeBtn.addEventListener('click', () => {
    tr.remove();
    refreshRowNumbers();
  });
  actionTd.appendChild(removeBtn);
  tr.appendChild(actionTd);

  return tr;
}

function refreshRowNumbers() {
  const rows = Array.from(body.querySelectorAll('tr'));
  rows.forEach((row, idx) => {
    row.querySelector('.row-index').textContent = String(idx + 1);
  });
}

function appendRow(creditor = { id: '', name: '', accountNumber: '' }) {
  const rowNumber = body.querySelectorAll('tr').length + 1;
  body.appendChild(createRow(creditor, rowNumber));
}

async function loadCreditors() {
  statusText.textContent = 'Henter kreditorliste...';

  try {
    const response = await fetch('/api/creditors');
    if (!response.ok) throw new Error('Kunne ikke hente kreditorliste.');

    const creditors = await response.json();
    body.innerHTML = '';

    creditors.forEach((creditor) => appendRow(creditor));
    if (creditors.length === 0) appendRow();

    statusText.textContent = `Lastet ${creditors.length} kreditorer.`;
  } catch (error) {
    statusText.textContent = error.message;
  }
}

function collectCreditors() {
  const rows = Array.from(body.querySelectorAll('tr'));
  const creditors = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const line = i + 1;
    const name = row.querySelector('.cred-name').value.trim();
    const accountNumber = row.querySelector('.cred-account').value.replace(/\s+/g, '').trim();

    if (!name && !accountNumber) {
      continue;
    }

    if (accountNumber && (!/^\d{11}$/.test(accountNumber) || !isValidMod11(accountNumber))) {
      throw new Error(`Linje ${line}: Ugyldig kontonummer (modulus-sjekk feilet).`);
    }

    creditors.push({
      id: row.dataset.id || '',
      name,
      accountNumber,
    });
  }

  return creditors;
}

addButton.addEventListener('click', () => {
  appendRow();
  statusText.textContent = 'La til ny rad.';
});

saveButton.addEventListener('click', async () => {
  let creditors;

  try {
    creditors = collectCreditors();
  } catch (error) {
    statusText.textContent = error.message;
    return;
  }

  statusText.textContent = 'Lagrer kreditorliste...';

  try {
    const response = await fetch('/api/creditors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creditors }),
    });

    if (!response.ok) {
      const bodyData = await response.json().catch(() => ({ error: 'Ukjent feil.' }));
      throw new Error(bodyData.error || 'Kunne ikke lagre kreditorliste.');
    }

    await loadCreditors();
    statusText.textContent = 'Kreditorlisten er lagret.';
  } catch (error) {
    statusText.textContent = error.message;
  }
});

loadCreditors();
