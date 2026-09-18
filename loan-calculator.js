document.getElementById('year').textContent = new Date().getFullYear();

const els = {
  totalWan: document.getElementById('total-wan'),
  identity: document.getElementById('identity'),
  qinganRate: document.getElementById('qingan-rate'),
  excessRate: document.getElementById('excess-rate'),
  excessRateField: document.getElementById('excess-rate-field'),
  termYears: document.getElementById('term-years'),
  graceYears: document.getElementById('grace-years'),
  advancedToggle: document.getElementById('advanced-toggle'),
  advancedFields: document.getElementById('advanced-fields'),
  excessTermYears: document.getElementById('excess-term-years'),
  excessGraceYears: document.getElementById('excess-grace-years'),
  error: document.getElementById('calc-error'),

  summaryQingan: document.getElementById('summary-qingan'),
  summaryExcessRow: document.getElementById('summary-excess-row'),
  summaryExcess: document.getElementById('summary-excess'),

  ngMonthlyTotal: document.getElementById('ng-monthly-total'),
  ngMonthlyBreak: document.getElementById('ng-monthly-break'),
  ngFirstPrincipal: document.getElementById('ng-first-principal'),
  ngFirstInterest: document.getElementById('ng-first-interest'),
  ngTotalInterest: document.getElementById('ng-total-interest'),
  ngTotalPayment: document.getElementById('ng-total-payment'),

  gDuringMonthly: document.getElementById('g-during-monthly'),
  gDuringBreak: document.getElementById('g-during-break'),
  gAfterMonthly: document.getElementById('g-after-monthly'),
  gAfterBreak: document.getElementById('g-after-break'),
  gTotalInterest: document.getElementById('g-total-interest'),
  gTotalPayment: document.getElementById('g-total-payment'),

  diffNote: document.getElementById('diff-note'),
  chart: document.getElementById('payment-chart'),

  scheduleExpand: document.getElementById('schedule-expand'),
  scheduleWrap: document.getElementById('schedule-table-wrap'),
  scheduleBody: document.getElementById('schedule-body'),
  schedulePeriodLabel: document.getElementById('schedule-period-label')
};

const state = { scenario: 'grace', granularity: 'year' };
let lastResult = null;
let calculatorUsedTimer = null;

function bucketLoanAmountWan(wan) {
  if (wan < 500) return '500萬以下';
  if (wan < 1000) return '500–1000萬';
  if (wan < 1500) return '1000–1500萬';
  if (wan < 2000) return '1500–2000萬';
  return '2000萬以上';
}

// 完成一次試算才算數：等使用者停止調整輸入一段時間後才送出，避免每敲一個字就送一次事件。
function scheduleCalculatorUsedEvent(input, excess) {
  clearTimeout(calculatorUsedTimer);
  calculatorUsedTimer = setTimeout(() => {
    trackEvent('calculator_used', {
      identity_type: input.identity,
      loan_amount_range: bucketLoanAmountWan(input.totalWan),
      has_excess: excess > 0
    });
  }, 1500);
}

function formatNT(n) {
  return 'NT$ ' + Math.round(n || 0).toLocaleString('zh-Hant-TW');
}

function readInputs() {
  return {
    totalWan: Number(els.totalWan.value),
    identity: els.identity.value,
    qinganRatePct: Number(els.qinganRate.value),
    excessRatePct: Number(els.excessRate.value),
    termYears: Number(els.termYears.value),
    graceYears: Number(els.graceYears.value),
    advanced: els.advancedToggle.checked,
    excessTermYears: Number(els.excessTermYears.value),
    excessGraceYears: Number(els.excessGraceYears.value)
  };
}

function validate(input, excessAmount) {
  if (!(input.totalWan > 0)) return '請輸入大於 0 的貸款總金額';
  if (!(input.termYears >= 1 && input.termYears <= 40)) return '貸款年限請輸入 1～40 年';
  if (!(input.graceYears >= 0 && input.graceYears <= 5)) return '寬限期請輸入 0～5 年';
  if (input.graceYears >= input.termYears) return '貸款年限必須大於寬限期';
  if (!(input.qinganRatePct >= 0 && input.qinganRatePct <= 20)) return '新青安利率請輸入 0～20% 之間';
  if (excessAmount > 0) {
    if (!(input.excessRatePct >= 0 && input.excessRatePct <= 20)) return '超額部分利率請輸入 0～20% 之間';
    if (input.advanced) {
      if (!(input.excessTermYears >= 1 && input.excessTermYears <= 40)) return '超額部分年限請輸入 1～40 年';
      if (!(input.excessGraceYears >= 0 && input.excessGraceYears <= 5)) return '超額部分寬限期請輸入 0～5 年';
      if (input.excessGraceYears >= input.excessTermYears) return '超額部分年限必須大於寬限期';
    }
  }
  return null;
}

function renderSchedule() {
  if (!lastResult) return;
  const rows = state.scenario === 'grace' ? lastResult.combinedGrace : lastResult.combinedNoGrace;
  els.schedulePeriodLabel.textContent = state.granularity === 'year' ? '年度' : '期別（月）';
  const data = state.granularity === 'year' ? groupByYear(rows) : rows;

  els.scheduleBody.innerHTML = data.map(r => {
    const period = state.granularity === 'year' ? `第 ${r.year} 年` : `第 ${r.month} 期`;
    return `<tr><td>${period}</td><td>${formatNT(r.principal)}</td><td>${formatNT(r.interest)}</td><td>${formatNT(r.balance)}</td></tr>`;
  }).join('');
}

function render(result) {
  lastResult = result;
  const { qingan, excess, ngQingan, ngExcess, gQingan, gExcess, combinedNoGrace, combinedGrace } = result;

  els.summaryQingan.textContent = formatNT(qingan);
  els.summaryExcessRow.hidden = excess <= 0;
  els.summaryExcess.textContent = formatNT(excess);

  // 無寬限期
  const ngMonthly = ngQingan[0] ? ngQingan[0].payment : 0;
  const ngExcessMonthly = ngExcess[0] ? ngExcess[0].payment : 0;
  els.ngMonthlyTotal.textContent = formatNT(ngMonthly + ngExcessMonthly);
  els.ngMonthlyBreak.textContent = `新青安 ${formatNT(ngMonthly)}　＋　超額 ${formatNT(ngExcessMonthly)}`;
  els.ngFirstPrincipal.textContent = formatNT(combinedNoGrace[0] ? combinedNoGrace[0].principal : 0);
  els.ngFirstInterest.textContent = formatNT(combinedNoGrace[0] ? combinedNoGrace[0].interest : 0);
  const ngTotalInterest = sumInterest(combinedNoGrace);
  const ngTotalPayment = sumPayment(combinedNoGrace);
  els.ngTotalInterest.textContent = formatNT(ngTotalInterest);
  els.ngTotalPayment.textContent = formatNT(ngTotalPayment);

  // 有寬限期
  const graceMonthsQingan = Math.min(result.graceMonths, gQingan.length);
  const duringQingan = gQingan[0] ? gQingan[0].payment : 0;
  const duringExcess = gExcess[0] ? gExcess[0].payment : 0;
  els.gDuringMonthly.textContent = formatNT(duringQingan + duringExcess);
  els.gDuringBreak.textContent = `新青安 ${formatNT(duringQingan)}　＋　超額 ${formatNT(duringExcess)}`;

  const afterIdxQingan = Math.min(graceMonthsQingan, gQingan.length - 1);
  const afterQingan = gQingan[afterIdxQingan] ? gQingan[afterIdxQingan].payment : 0;
  const afterIdxExcess = Math.min(result.excessGraceMonths, Math.max(gExcess.length - 1, 0));
  const afterExcess = gExcess[afterIdxExcess] ? gExcess[afterIdxExcess].payment : 0;
  els.gAfterMonthly.textContent = formatNT(afterQingan + afterExcess);
  els.gAfterBreak.textContent = `新青安 ${formatNT(afterQingan)}　＋　超額 ${formatNT(afterExcess)}`;

  const gTotalInterest = sumInterest(combinedGrace);
  const gTotalPayment = sumPayment(combinedGrace);
  els.gTotalInterest.textContent = formatNT(gTotalInterest);
  els.gTotalPayment.textContent = formatNT(gTotalPayment);

  const interestDiff = gTotalInterest - ngTotalInterest;
  const monthlyDiff = (afterQingan + afterExcess) - (ngMonthly + ngExcessMonthly);
  const parts = [];
  if (interestDiff > 0) parts.push(`有寬限期總利息多付 ${formatNT(interestDiff)}`);
  else if (interestDiff < 0) parts.push(`有寬限期總利息少付 ${formatNT(-interestDiff)}`);
  if (monthlyDiff > 0) parts.push(`寬限期後月付增加 ${formatNT(monthlyDiff)}`);
  else if (monthlyDiff < 0) parts.push(`寬限期後月付減少 ${formatNT(-monthlyDiff)}`);
  els.diffNote.textContent = parts.join('；');

  renderChart(result, ngMonthly + ngExcessMonthly, duringQingan + duringExcess, afterQingan + afterExcess);
  renderSchedule();
}

function renderChart(result, ngMonthly, duringMonthly, afterMonthly) {
  const termMonths = result.termMonths;
  const graceMonths = result.graceMonths;
  const w = 640, h = 200, pad = 36;
  const maxY = Math.max(ngMonthly, duringMonthly, afterMonthly) * 1.15 || 1;
  const x = m => pad + (m / termMonths) * (w - pad * 2);
  const y = v => h - pad - (v / maxY) * (h - pad * 2);

  const ngPath = `M ${x(0)} ${y(ngMonthly)} L ${x(termMonths)} ${y(ngMonthly)}`;
  const gPath = `M ${x(0)} ${y(duringMonthly)} L ${x(graceMonths)} ${y(duringMonthly)} L ${x(graceMonths)} ${y(afterMonthly)} L ${x(termMonths)} ${y(afterMonthly)}`;

  els.chart.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" class="chart-svg" role="img" aria-label="每月應繳金額比較圖">
      <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" class="chart-axis"></line>
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" class="chart-axis"></line>
      <path d="${ngPath}" class="chart-line ng"></path>
      <path d="${gPath}" class="chart-line g"></path>
      <text x="${pad}" y="${pad - 10}" class="chart-label">月付（元）</text>
      <text x="${w - pad}" y="${h - pad + 20}" class="chart-label" text-anchor="end">第 ${termMonths} 期</text>
    </svg>
    <div class="chart-legend">
      <span class="legend-item"><span class="legend-swatch ng"></span>無寬限期</span>
      <span class="legend-item"><span class="legend-swatch g"></span>有寬限期</span>
    </div>
  `;
}

function recalc() {
  const input = readInputs();
  const { qingan, excess } = splitLoanAmount(input.totalWan || 0, input.identity);

  els.excessRateField.hidden = excess <= 0;

  const errorMsg = validate(input, excess);
  if (errorMsg) {
    els.error.textContent = errorMsg;
    els.error.hidden = false;
    return;
  }
  els.error.hidden = true;
  scheduleCalculatorUsedEvent(input, excess);

  const termMonths = input.termYears * 12;
  const graceMonths = input.graceYears * 12;
  const excessTermMonths = (input.advanced ? input.excessTermYears : input.termYears) * 12;
  const excessGraceMonths = (input.advanced ? input.excessGraceYears : input.graceYears) * 12;

  const ngQingan = amortizeSchedule(qingan, input.qinganRatePct, termMonths);
  const ngExcess = amortizeSchedule(excess, input.excessRatePct, excessTermMonths);
  const gQingan = amortizeScheduleWithGrace(qingan, input.qinganRatePct, termMonths, graceMonths);
  const gExcess = amortizeScheduleWithGrace(excess, input.excessRatePct, excessTermMonths, excessGraceMonths);

  render({
    qingan,
    excess,
    ngQingan,
    ngExcess,
    gQingan,
    gExcess,
    combinedNoGrace: combineSchedules(ngQingan, ngExcess),
    combinedGrace: combineSchedules(gQingan, gExcess),
    termMonths: Math.max(termMonths, excessTermMonths),
    graceMonths,
    excessGraceMonths
  });
}

document.querySelectorAll('.calc-form-card input, .calc-form-card select, #advanced-fields input')
  .forEach(el => el.addEventListener('input', recalc));

els.advancedToggle.addEventListener('change', () => {
  els.advancedFields.hidden = !els.advancedToggle.checked;
  recalc();
});

document.querySelectorAll('.toggle-set').forEach(group => {
  group.addEventListener('click', e => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state[group.dataset.toggle] = btn.dataset.value;
    renderSchedule();
  });
});

els.scheduleExpand.addEventListener('click', () => {
  const expanded = !els.scheduleWrap.hidden;
  els.scheduleWrap.hidden = expanded;
  els.scheduleExpand.textContent = expanded ? '展開明細表' : '收合明細表';
  if (!expanded) trackEvent('detail_expand', {});
});

recalc();
