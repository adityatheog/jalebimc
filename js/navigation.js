/* Mobile menu, Escape key, close-after-navigation, sticky header state. */
(function () {
  'use strict';

  var J = (window.Jalebi = window.Jalebi || {});

  function initHeader(header) {
    function onScroll() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initMenu(toggle, menu) {
    function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }

    function close(returnFocus) {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      if (returnFocus) toggle.focus();
    }

    function open() {
      toggle.setAttribute('aria-expanded', 'true');
      menu.classList.add('is-open');
      document.body.classList.add('menu-open');
    }

    toggle.addEventListener('click', function () {
      if (isOpen()) close(false); else open();
    });

    Array.prototype.forEach.call(menu.querySelectorAll('a'), function (link) {
      link.addEventListener('click', function () { close(false); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) close(true);
    });

    // If the window grows to desktop width while the menu is open, close it.
    if (window.matchMedia) {
      var mq = window.matchMedia('(min-width: 900px)');
      var onChange = function (e) { if (e.matches) close(false); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  J.navigation = {
    init: function () {
      var header = document.getElementById('siteHeader');
      var toggle = document.getElementById('menuToggle');
      var menu = document.getElementById('mobileMenu');
      if (header) initHeader(header);
      if (toggle && menu) initMenu(toggle, menu);
    }
  };
})();
