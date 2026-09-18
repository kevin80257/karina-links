// 新青安房貸試算的純計算邏輯。不依賴 DOM，瀏覽器與 Node 都能載入使用。

// 新青安各身分別的貸款額度上限（萬元）。政策調整時只需要改這裡。
const QINGAN_CAP_WAN = {
  general: 1000, // 一般
  newlywed: 1200, // 新婚家庭
  childcare: 1500 // 育兒家庭
};

function wanToYuan(wan) {
  return wan * 10000;
}

// 依身分別上限，把貸款總額拆成「新青安部分」與「超額（一般房貸）部分」。
function splitLoanAmount(totalWan, identity) {
  const capWan = QINGAN_CAP_WAN[identity];
  if (capWan == null) throw new Error(`未知的新青安身分：${identity}`);
  const totalYuan = wanToYuan(totalWan);
  const capYuan = wanToYuan(capWan);
  const qingan = Math.min(totalYuan, capYuan);
  const excess = Math.max(0, totalYuan - capYuan);
  return { qingan, excess, capYuan };
}

function monthlyRate(annualRatePct) {
  return annualRatePct / 100 / 12;
}

// 本息平均攤還的月付金公式：P × i / (1 − (1+i)^-n)
function monthlyPayment(principal, annualRatePct, termMonths) {
  if (principal <= 0 || termMonths <= 0) return 0;
  const i = monthlyRate(annualRatePct);
  if (i === 0) return principal / termMonths;
  return (principal * i) / (1 - Math.pow(1 + i, -termMonths));
}

// 一般本息平均攤還，逐月列出本金／利息／餘額（無寬限期）。
function amortizeSchedule(principal, annualRatePct, termMonths) {
  if (principal <= 0 || termMonths <= 0) return [];
  const i = monthlyRate(annualRatePct);
  const payment = monthlyPayment(principal, annualRatePct, termMonths);
  const rows = [];
  let balance = principal;
  for (let m = 1; m <= termMonths; m++) {
    const interest = balance * i;
    let principalPaid = payment - interest;
    if (m === termMonths || principalPaid > balance) principalPaid = balance;
    balance = Math.max(0, balance - principalPaid);
    rows.push({ month: m, payment: principalPaid + interest, principal: principalPaid, interest, balance });
  }
  return rows;
}

// 有寬限期：寬限期內只繳利息（本金不變），寬限期結束後就剩餘本金與剩餘年限重新攤還。
function amortizeScheduleWithGrace(principal, annualRatePct, termMonths, graceMonths) {
  if (principal <= 0 || termMonths <= 0) return [];
  const i = monthlyRate(annualRatePct);
  const rows = [];
  let balance = principal;

  const graceLen = Math.min(graceMonths, termMonths);
  for (let m = 1; m <= graceLen; m++) {
    const interest = balance * i;
    rows.push({ month: m, payment: interest, principal: 0, interest, balance });
  }

  const remainingMonths = termMonths - graceLen;
  if (remainingMonths > 0) {
    const payment = monthlyPayment(balance, annualRatePct, remainingMonths);
    for (let m = 1; m <= remainingMonths; m++) {
      const interest = balance * i;
      let principalPaid = payment - interest;
      if (m === remainingMonths || principalPaid > balance) principalPaid = balance;
      balance = Math.max(0, balance - principalPaid);
      rows.push({ month: graceLen + m, payment: principalPaid + interest, principal: principalPaid, interest, balance });
    }
  }
  return rows;
}

// 把新青安子貸款與超額子貸款的逐月明細合併成一份（兩邊年限可能不同）。
function combineSchedules(scheduleA, scheduleB) {
  const maxLen = Math.max(scheduleA.length, scheduleB.length);
  const rows = [];
  const empty = { principal: 0, interest: 0, balance: 0, payment: 0 };
  for (let idx = 0; idx < maxLen; idx++) {
    const a = scheduleA[idx] || empty;
    const b = scheduleB[idx] || empty;
    rows.push({
      month: idx + 1,
      payment: a.payment + b.payment,
      principal: a.principal + b.principal,
      interest: a.interest + b.interest,
      balance: a.balance + b.balance
    });
  }
  return rows;
}

function sumInterest(rows) {
  return rows.reduce((s, r) => s + r.interest, 0);
}

function sumPayment(rows) {
  return rows.reduce((s, r) => s + r.payment, 0);
}

// 依年份彙總逐月明細：本金／利息加總，餘額取當年最後一期。
function groupByYear(rows) {
  const years = [];
  for (let idx = 0; idx < rows.length; idx += 12) {
    const chunk = rows.slice(idx, idx + 12);
    years.push({
      year: idx / 12 + 1,
      principal: chunk.reduce((s, r) => s + r.principal, 0),
      interest: chunk.reduce((s, r) => s + r.interest, 0),
      balance: chunk[chunk.length - 1].balance
    });
  }
  return years;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    QINGAN_CAP_WAN,
    wanToYuan,
    splitLoanAmount,
    monthlyRate,
    monthlyPayment,
    amortizeSchedule,
    amortizeScheduleWithGrace,
    combineSchedules,
    groupByYear,
    sumInterest,
    sumPayment
  };
}
