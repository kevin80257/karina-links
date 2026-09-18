// 驗收測試：一般身分、貸款 1,200 萬、新青安 1.775%、超額 200 萬 / 2.5%、30 年、寬限期 5 年
// 執行方式： node test/calc.test.js

const {
  splitLoanAmount,
  monthlyPayment,
  amortizeSchedule,
  amortizeScheduleWithGrace
} = require('../calc.js');

function assertClose(actual, expected, label, tolerance = 1) {
  const diff = Math.abs(actual - expected);
  const ok = diff <= tolerance;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: got ${actual.toFixed(2)}, expected ~${expected}`);
  if (!ok) process.exitCode = 1;
}

const TERM_MONTHS = 30 * 12;
const GRACE_MONTHS = 5 * 12;

const { qingan, excess } = splitLoanAmount(1200, 'general');
assertClose(qingan, 10000000, '新青安金額');
assertClose(excess, 2000000, '超額金額');

// 無寬限期
const qinganPayment = monthlyPayment(qingan, 1.775, TERM_MONTHS);
const excessPayment = monthlyPayment(excess, 2.5, TERM_MONTHS);
assertClose(qinganPayment, 35847, '無寬限期／新青安月付');
assertClose(excessPayment, 7902, '無寬限期／超額月付', 2);
assertClose(qinganPayment + excessPayment, 43749, '無寬限期／合計月付', 2);

// 有寬限期
const qinganGraceSchedule = amortizeScheduleWithGrace(qingan, 1.775, TERM_MONTHS, GRACE_MONTHS);
const excessGraceSchedule = amortizeScheduleWithGrace(excess, 2.5, TERM_MONTHS, GRACE_MONTHS);

assertClose(qinganGraceSchedule[0].payment, 14792, '寬限期內／新青安月付', 1);
assertClose(excessGraceSchedule[0].payment, 4167, '寬限期內／超額月付', 1);
assertClose(qinganGraceSchedule[0].payment + excessGraceSchedule[0].payment, 18959, '寬限期內／合計月付', 2);

assertClose(qinganGraceSchedule[GRACE_MONTHS].payment, 41299, '寬限期後／新青安月付', 2);
assertClose(excessGraceSchedule[GRACE_MONTHS].payment, 8972, '寬限期後／超額月付', 2);
assertClose(
  qinganGraceSchedule[GRACE_MONTHS].payment + excessGraceSchedule[GRACE_MONTHS].payment,
  50271,
  '寬限期後／合計月付',
  3
);

// 無寬限期版本的逐月本金+利息應該等於月付金，且最後一期餘額應為 0
const noGraceSchedule = amortizeSchedule(qingan, 1.775, TERM_MONTHS);
assertClose(noGraceSchedule[TERM_MONTHS - 1].balance, 0, '無寬限期／最後一期餘額');

if (process.exitCode === 1) {
  console.log('\n有測試失敗');
} else {
  console.log('\n全部通過');
}
