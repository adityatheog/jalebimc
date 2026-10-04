/* Live Java server status via mcstatus.io.
   - Never shows "Online" until the API confirms online === true.
   - Any failure ends in "Status Unavailable" and never throws. */
(function () {
  'use strict';

  var J = (window.Jalebi = window.Jalebi || {});

  var TICK_MS = 1000;
  var REQUEST_TIMEOUT_MS = 10000;
  var MIN_REFRESH_MS = 10000;
  var DEFAULT_REFRESH_MS = 45000;

  var el = {};
  var lastFetchAt = null;
  var inFlight = false;

  function setText(node, text) { if (node) node.textContent = text; }

  function setState(state, pillLabel, javaLabel) {
    if (el.pill) el.pill.setAttribute('data-state', state);
    setText(el.pillText, pillLabel);
    setText(el.javaStatus, javaLabel);
  }

  function clearDetails() {
    setText(el.players, '');
    setText(el.version, '');
  }

  function renderLoading() { setState('pending', 'Checking Network', 'Checking…'); }

  function renderOnline(data) {
    setState('online', 'Network Online', 'Online');

    var players = data && data.players;
    var hasCount = players && typeof players.online === 'number' && typeof players.max === 'number';
    setText(el.players, hasCount ? players.online + ' / ' + players.max + ' Players Online' : '');

    var v = data && data.version;
    var name = v && (v.name_clean || v.name);
    setText(el.version, name ? 'Running ' + name : '');
  }

  function renderOffline() {
    setState('offline', 'Network Offline', 'Offline');
    clearDetails();
  }

  function renderUnavailable() {
    setState('unavailable', 'Status Unavailable', 'Status temporarily unavailable');
    clearDetails();
    lastFetchAt = null;
    setText(el.updated, '');
  }

  function updateRelativeTime() {
    if (!el.updated || !lastFetchAt) return;
    var s = Math.max(0, Math.round((Date.now() - lastFetchAt) / 1000));
    setText(el.updated, s < 5 ? 'Updated just now'
      : s < 60 ? 'Updated ' + s + 's ago'
      : 'Updated ' + Math.floor(s / 60) + 'm ago');
  }

  function buildUrl(config) {
    var java = config && config.server && config.server.java;
    var api = config && config.server && config.server.statusApi;
    if (!java || !java.host || !api || !api.baseUrl) return null;
    var target = java.port ? java.host + ':' + java.port : java.host;
    return String(api.baseUrl).replace(/\/+$/, '') + '/' + target;
  }

  function fetchStatus(url) {
    if (inFlight || !('fetch' in window)) {
      if (!('fetch' in window)) renderUnavailable();
      return;
    }
    inFlight = true;

    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeout = ctrl ? setTimeout(function () { ctrl.abort(); }, REQUEST_TIMEOUT_MS) : null;

    fetch(url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        if (!res.ok) throw new Error('Bad response: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data.online !== 'boolean') throw new Error('Unexpected payload');
        lastFetchAt = Date.now();
        if (data.online) renderOnline(data); else renderOffline();
        updateRelativeTime();
      })
      .catch(renderUnavailable)
      .then(function () {
        if (timeout) clearTimeout(timeout);
        inFlight = false;
      });
  }

  J.serverStatus = {
    init: function (config) {
      el.pill = document.getElementById('networkStatusPill');
      el.pillText = document.getElementById('networkStatusText');
      el.javaStatus = document.getElementById('javaStatusText');
      el.players = document.getElementById('javaPlayerCount');
      el.version = document.getElementById('javaVersionDetected');
      el.updated = document.getElementById('statusUpdatedAt');
      if (!el.pill) return;

      renderLoading();

      var url = buildUrl(config);
      if (!url) { renderUnavailable(); return; }

      var configured = Number(config.server.statusApi.refreshInterval);
      var interval = Math.max(MIN_REFRESH_MS, configured || DEFAULT_REFRESH_MS);

      fetchStatus(url);
      setInterval(updateRelativeTime, TICK_MS);
      setInterval(function () { if (!document.hidden) fetchStatus(url); }, interval);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) fetchStatus(url);
      });
    }
  };
})();
