(function () {
  var overlay = document.getElementById('intro-overlay');
  var skipBtn = document.getElementById('intro-skip');
  var heroMedia = document.querySelector('.hero-media');

  function showHeroInstantly() {
    if (!heroMedia) return;
    heroMedia.style.transition = 'none';
    heroMedia.classList.add('is-loaded');
  }

  if (overlay) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var alreadyShown = sessionStorage.getItem('introShown');

    if (reduceMotion || alreadyShown) {
      overlay.remove();
      showHeroInstantly();
    } else {
      document.body.classList.add('intro-active');

      var timers = {};

      var endIntro = function () {
        overlay.classList.add('is-hidden');
        document.body.classList.remove('intro-active');
        if (heroMedia) heroMedia.classList.add('is-loaded');
        sessionStorage.setItem('introShown', '1');
        clearTimeout(timers.brand);
        clearTimeout(timers.tagline);
        clearTimeout(timers.exit);
        setTimeout(function () { overlay.remove(); }, 900);
      };

      timers.brand = setTimeout(function () { overlay.classList.add('stage-brand'); }, 200);
      timers.tagline = setTimeout(function () { overlay.classList.add('stage-tagline'); }, 1100);
      timers.exit = setTimeout(endIntro, 2900);

      if (skipBtn) skipBtn.addEventListener('click', endIntro);
    }
  } else {
    showHeroInstantly();
  }

  var slides = document.querySelectorAll('.hero-slide');
  if (slides.length > 1) {
    var idx = 0;
    setInterval(function () {
      slides[idx].classList.remove('is-active');
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add('is-active');
    }, 5500);
  }
})();
