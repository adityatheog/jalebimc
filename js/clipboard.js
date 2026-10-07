/* Copy-to-clipboard buttons for the Java and Bedrock addresses.
   Buttons are marked up as <button data-copy-server="java|bedrock">.
   Optional: an element with id="copyAnnouncer" (role="status") receives
   the result so screen-reader users hear it. */
(function () {
  'use strict';

  var J = (window.Jalebi = window.Jalebi || {});
  var RESET_MS = 2200;

  // Legacy path: also covers non-secure contexts, where navigator.clipboard is undefined.
  function copyWithExecCommand(text) {
    return new Promise(function (resolve, reject) {
      var ta = null;
      try {
        ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.left = '-1000px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        if (document.execCommand('copy')) resolve(); else reject(new Error('execCommand copy failed'));
      } catch (err) {
        reject(err);
      } finally {
        if (ta && ta.parentNode) ta.parentNode.removeChild(ta);
      }
    });
  }

  // The async API can reject (permissions policy, unfocused document, iframes),
  // so a rejection falls through to the legacy path rather than failing outright.
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return copyWithExecCommand(text);
      });
    }
    return copyWithExecCommand(text);
  }

  function addressFor(server) {
    if (!server || !server.host) return '';
    return (server.copyWithPort !== false && server.port)
      ? server.host + ':' + server.port
      : server.host;
  }

  function announce(message) {
    var node = document.getElementById('copyAnnouncer');
    if (!node) return;
    // Clearing first makes repeated identical messages re-announce.
    node.textContent = '';
    window.setTimeout(function () { node.textContent = message; }, 50);
  }

  function wire(btn, getText) {
    var timer = null;

    function flash(attr, message) {
      btn.setAttribute('data-copied', 'false');
      btn.removeAttribute('data-copy-failed');
      btn.setAttribute(attr, 'true');
      announce(message);
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        btn.setAttribute('data-copied', 'false');
        btn.removeAttribute('data-copy-failed');
      }, RESET_MS);
    }

    btn.addEventListener('click', function () {
      var text = getText();
      if (!text) {
        console.warn('[JalebiMC] Nothing to copy: server host missing from config.');
        flash('data-copy-failed', 'Could not copy the address.');
        return;
      }
      copyText(text).then(
        function () { flash('data-copied', 'Copied ' + text); },
        // A clipboard failure must never break the page; the address is
        // still visible in the card for manual selection.
        function () { flash('data-copy-failed', 'Could not copy. Select the address manually.'); }
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
