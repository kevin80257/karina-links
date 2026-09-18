// GA4 追蹤設定，全站共用同一份。
// 之後要換評估 ID、加新事件，或換成別的分析工具，都只需要改這個檔案。

// TODO：換成你自己的 GA4 評估 ID（在 GA4 後台「管理 > 資料串流」可以找到）
const GA_MEASUREMENT_ID = 'G-NJGK8S4NMB';

(function loadGA4() {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID.indexOf('XXXXXXXXXX') !== -1) {
    console.warn('[analytics] 尚未設定 GA4 評估 ID，暫不載入追蹤碼。請在 analytics.js 填入 GA_MEASUREMENT_ID。');
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // 只送出匿名的瀏覽數據，不夾帶任何個人資料。
  window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
})();

// 送自訂事件的共用入口。以後想加事件、或換掉 GA4 改用別的分析工具，只改這裡。
function trackEvent(name, params) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params || {});
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GA_MEASUREMENT_ID, trackEvent };
}
