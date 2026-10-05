/* Scroll-reveal for elements with the .reveal class.
   CSS only hides .reveal elements when the .js class is present on <html>
   (set in <head>), so content is never stuck invisible if scripts fail. */
(function () {
  'use strict';

  var J = (window.Jalebi = window.Jalebi || {});

  J.reveal = {
    init: function () {
      var pending = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
      if (!pending.length) return;

      function showAll() {
        pending.forEach(function (t) { t.classList.add('is-visible'); });
        pending = [];
      }

      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion || !('IntersectionObserver' in window)) { showAll(); return; }

      var observer = null;
      var sweepQueued = false;

      function reveal(target) {
        target.classList.add('is-visible');
        observer.unobserve(target);
        pending.splice(pending.indexOf(target), 1);
      }

      function stopIfDone() {
        if (pending.length) return;
        observer.disconnect();
        window.removeEventListener('scroll', onScroll);
      }

      // An IntersectionObserver only reports changes, so an element scrolled past in
      // one jump (anchor link, scrollbar drag, restored position) would never fire.
      // Anything already above the viewport is revealed here instead.
      function sweep() {
        sweepQueued = false;
        pending.slice().forEach(function (t) {
          if (t.getBoundingClientRect().bottom < 0) reveal(t);
        });
        stopIfDone();
      }

      function onScroll() {
        if (sweepQueued) return;
        sweepQueued = true;
        window.requestAnimationFrame(sweep);
      }

      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) reveal(entry.target);
        });
        stopIfDone();
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      pending.slice().forEach(function (t) { observer.observe(t); });
      window.addEventListener('scroll', onScroll, { passive: true });
      sweep();
    }
  };
})();
