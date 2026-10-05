/* Live Java server status via mcstatus.io.
   - Never shows "Online" until the API confirms online === true.
   - Any failure ends in "Status Unavailable" and never throws.
   - Requests are serialised, time out, back off after failures (e.g. rate
     limiting) and pause while the tab is hidden. */
(function () {
  'use strict';

  var J = (window.Jalebi = window.Jalebi || {});

  var TICK_MS = 1000;
  var REQUEST_TIMEOUT_MS = 10000;
  var MIN_REFRESH_MS = 10000;
  var DEFAULT_REFRESH_MS = 45000;
  var MAX_BACKOFF_FACTOR = 8;

  var el = {};
  var url = null;
  var refreshMs = DEFAULT_REFRESH_MS;
  var inFlight = false;
  var failures = 0;
  var lastAttemptAt = 0;
  var lastFetchAt = null;
  var refreshTimer = null;

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

    var players = data.players;
    var hasCount = players && typeof players.online === 'number' && typeof players.max === 'number';
    setText(el.players, hasCount ? players.online + ' / ' + players.max + ' Players Online' : '');

    var v = data.version;
    var name = v && (v.name_clean || v.name);
    setText(el.version, typeof name === 'string' && name ? 'Running ' + name : '');
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
    if (!el.updated || !lastFetchAt || document.hidden) return;
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

  // Waits longer after consecutive failures so a rate-limited or down API is not hammered.
  function scheduleNext() {
    window.clearTimeout(refreshTimer);
    var factor = Math.min(Math.pow(2, failures), MAX_BACKOFF_FACTOR);
    refreshTimer = window.setTimeout(refresh, refreshMs * factor);
  }

  function handleFailure(err) {
    // Log the first failure of a streak only, so a long outage does not spam the console.
    if (failures === 0 && window.console) console.warn('[JalebiMC] Status check failed:', err);
    failures += 1;
    renderUnavailable();
  }

  function refresh() {
    window.clearTimeout(refreshTimer);
    if (inFlight) return;
    if (document.hidden) return; // visibilitychange resumes polling
    if (typeof window.fetch !== 'function') { renderUnavailable(); return; }

    inFlight = true;
    lastAttemptAt = Date.now();

    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeout = ctrl ? window.setTimeout(function () { ctrl.abort(); }, REQUEST_TIMEOUT_MS) : null;

    window.fetch(url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) {
        if (!res.ok) throw new Error('Bad response: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data.online !== 'boolean') throw new Error('Unexpected payload');
        failures = 0;
        lastFetchAt = Date.now();
        if (data.online) renderOnline(data); else renderOffline();
        updateRelativeTime();
      })
      .catch(handleFailure)
      .then(function () {
        if (timeout) window.clearTimeout(timeout);
        inFlight = false;
        scheduleNext();
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

      url = buildUrl(config);
      if (!url) { renderUnavailable(); return; }

      var configured = Number(config.server.statusApi.refreshInterval);
      refreshMs = Math.max(MIN_REFRESH_MS, configured || DEFAULT_REFRESH_MS);

      renderLoading();
      refresh();
      window.setInterval(updateRelativeTime, TICK_MS);
      document.addEventListener('visibilitychange', function () {
        // Refresh on return only if the data is actually stale.
        if (!document.hidden && Date.now() - lastAttemptAt >= refreshMs) refresh();
      });
    }
  };
})();
