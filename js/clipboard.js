/* Copy-to-clipboard buttons for the Java and Bedrock addresses.
   Buttons are marked up as <button data-copy-server="java|bedrock">. */
(function () {
  'use strict';

  var J = (window.Jalebi = window.Jalebi || {});
  var RESET_MS = 2200;

  // Clipboard API where available, execCommand fallback otherwise
  // (older browsers / non-secure contexts).
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.left = '-1000px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        if (ok) resolve(); else reject(new Error('execCommand copy failed'));
      } catch (err) {
        reject(err);
      }
    });
  }

  function addressFor(server) {
    if (!server || !server.host) return '';
    return (server.copyWithPort !== false && server.port)
      ? server.host + ':' + server.port
      : server.host;
  }

  function wire(btn, getText) {
    var timer = null;

    function flash(attr) {
      btn.removeAttribute('data-copy-failed');
      btn.setAttribute('data-copied', 'false');
      btn.setAttribute(attr, 'true');
      clearTimeout(timer);
      timer = setTimeout(function () {
        btn.setAttribute('data-copied', 'false');
        btn.removeAttribute('data-copy-failed');
      }, RESET_MS);
    }

    btn.addEventListener('click', function () {
      var text = getText();
      if (!text) { flash('data-copy-failed'); return; }
      copyText(text).then(
        function () { flash('data-copied'); },
        // A clipboard failure must never break the page — the address
        // is still visible in the card for manual selection.
        function () { flash('data-copy-failed'); }
      );
    });
  }

  J.clipboard = {
    init: function (config) {
      var servers = (config && config.server) || {};
      Array.prototype.forEach.call(document.querySelectorAll('[data-copy-server]'), function (btn) {
        var key = btn.getAttribute('data-copy-server');
        wire(btn, function () { return addressFor(servers[key]); });
      });
    }
  };
})();
