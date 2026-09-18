document.getElementById('year').textContent = new Date().getFullYear();

const FIELD_CONFIG = {
  'bank': [
    { key: 'name', placeholder: '銀行名稱', type: 'text' },
    { key: 'balance', placeholder: '存款餘額（元）', type: 'number' }
  ],
  'invest': [
    { key: 'name', placeholder: '券商名稱', type: 'text' },
    { key: 'cost', placeholder: '成本（元）', type: 'number' },
    { key: 'value', placeholder: '現價（元）', type: 'number' }
  ],
  'other-asset': [
    { key: 'name', placeholder: '項目名稱', type: 'text' },
    { key: 'amount', placeholder: '金額（元）', type: 'number' }
  ],
  'card': [
    { key: 'name', placeholder: '信用卡名稱', type: 'text' },
    { key: 'balance', placeholder: '刷卡餘額（元）', type: 'number' }
  ],
  'other-debt': [
    { key: 'name', placeholder: '項目名稱', type: 'text' },
    { key: 'amount', placeholder: '金額（元）', type: 'number' }
  ]
};

const INITIAL_ROWS = 2;

function createRow(group) {
  const fields = FIELD_CONFIG[group];
  const row = document.createElement('div');
  row.className = 'row';
  row.dataset.group = group;

  fields.forEach(f => {
    const input = document.createElement('input');
    input.type = f.type;
    if (f.type === 'number') {
      input.min = '0';
      input.inputMode = 'numeric';
    }
    input.placeholder = f.placeholder;
    input.dataset.key = f.key;
    row.appendChild(input);
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-row';
  removeBtn.textContent = '✕';
  removeBtn.setAttribute('aria-label', '刪除這一列');
  row.appendChild(removeBtn);

  if (group === 'invest') {
    const gain = document.createElement('span');
    gain.className = 'gain';
    gain.textContent = '損益：NT$ 0';
    row.appendChild(gain);
  }

  return row;
}

function addRow(group) {
  const container = document.querySelector(`[data-rows="${group}"]`);
  container.appendChild(createRow(group));
}

document.querySelectorAll('[data-add]').forEach(btn => {
  btn.addEventListener('click', () => {
    addRow(btn.dataset.add);
    recalc();
  });
});

Object.keys(FIELD_CONFIG).forEach(group => {
  for (let i = 0; i < INITIAL_ROWS; i++) addRow(group);
});

function formatNT(n) {
  const rounded = Math.round(n || 0);
  return 'NT$ ' + rounded.toLocaleString('zh-Hant-TW');
}

function sumRows(group, key) {
  let total = 0;
  document.querySelectorAll(`[data-rows="${group}"] .row`).forEach(row => {
    const input = row.querySelector(`input[data-key="${key}"]`);
    total += Number(input && input.value) || 0;
  });
  return total;
}

function updateInvestGains() {
  document.querySelectorAll('[data-rows="invest"] .row').forEach(row => {
    const cost = Number(row.querySelector('input[data-key="cost"]').value) || 0;
    const value = Number(row.querySelector('input[data-key="value"]').value) || 0;
    const gainEl = row.querySelector('.gain');
    const gain = value - cost;
    gainEl.textContent = `損益：${gain >= 0 ? '+' : ''}${formatNT(gain)}`;
  });
}

function numberValue(id) {
  const el = document.getElementById(id);
  return Number(el.value) || 0;
}

function recalc() {
  updateInvestGains();

  const bankTotal = sumRows('bank', 'balance');
  const investTotal = sumRows('invest', 'value');
  const otherAssetTotal = sumRows('other-asset', 'amount');
  const totalAssets = bankTotal + investTotal + otherAssetTotal;

  const homeLoan = numberValue('home-loan-balance');
  const carLoan = numberValue('car-loan-balance');
  const cardTotal = sumRows('card', 'balance');
  const otherDebtTotal = sumRows('other-debt', 'amount');
  const totalLiabilities = homeLoan + carLoan + cardTotal + otherDebtTotal;

  const netWorth = totalAssets - totalLiabilities;

  document.getElementById('total-assets').textContent = formatNT(totalAssets);
  document.getElementById('total-liabilities').textContent = formatNT(totalLiabilities);

  const netWorthEl = document.getElementById('net-worth');
  netWorthEl.textContent = formatNT(netWorth);
  netWorthEl.classList.toggle('negative', netWorth < 0);
}

document.getElementById('worksheet').addEventListener('input', recalc);

document.getElementById('worksheet').addEventListener('click', e => {
  if (e.target.classList.contains('remove-row')) {
    e.target.closest('.row').remove();
    recalc();
  }
});

recalc();
