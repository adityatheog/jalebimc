/* Scroll-reveal for elements with the .reveal class. */
(function () {
  'use strict';

  var J = (window.Jalebi = window.Jalebi || {});

  J.reveal = {
    init: function () {
      var targets = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
      if (!targets.length) return;

      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion || !('IntersectionObserver' in window)) {
        targets.forEach(function (t) { t.classList.add('is-visible'); });
        return;
      }

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      targets.forEach(function (t) { observer.observe(t); });
    }
  };
})();
