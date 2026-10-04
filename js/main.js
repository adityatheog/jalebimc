/* Global initialisation: binds JALEBI_CONFIG values into the page,
   then starts each feature module.

   HTML hooks (all values come from config/site-config.js):
     data-config-text="site.name"         -> element text
     data-config-href="links.discord"     -> link href (http/https only)
     data-server-host="java|bedrock"      -> server host as text
     data-server-port="java|bedrock"      -> server port as text
     data-server-edition="java|bedrock"   -> edition label as text
     data-server-version="java"           -> supported versions as text */
(function () {
  'use strict';

  var J = (window.Jalebi = window.Jalebi || {});
  var config = window.JALEBI_CONFIG;

  function get(obj, path) {
    return String(path).split('.').reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }

  function hasValue(v) {
    return (typeof v === 'string' && v !== '') || typeof v === 'number';
  }

  function isHttpUrl(value) {
    try {
      var u = new URL(value, window.location.href);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch (e) {
      return false;
    }
  }

  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  function bindText() {
    each('[data-config-text]', function (node) {
      var v = get(config, node.getAttribute('data-config-text'));
      if (hasValue(v)) node.textContent = String(v);
    });

    var fields = {
      'data-server-host': 'host',
      'data-server-port': 'port',
      'data-server-edition': 'edition',
      'data-server-version': 'supportedVersions'
    };
    Object.keys(fields).forEach(function (attr) {
      each('[' + attr + ']', function (node) {
        var server = get(config, 'server.' + node.getAttribute(attr));
        var v = server && server[fields[attr]];
        if (hasValue(v)) node.textContent = String(v);
      });
    });

    // Brand links get an accessible label from the site name.
    each('.brand', function (node) {
      if (config.site && config.site.name) node.setAttribute('aria-label', config.site.name + ' home');
    });
  }

  function bindLinks() {
    each('[data-config-href]', function (node) {
      var v = get(config, node.getAttribute('data-config-href'));
      if (hasValue(v) && isHttpUrl(v)) node.setAttribute('href', String(v));
    });
  }

  function setMeta(selector, attr, value) {
    var node = document.querySelector(selector);
    if (node && hasValue(value)) node.setAttribute(attr, String(value));
  }

  function bindMetadata() {
    var s = config.site || {};
    if (hasValue(s.title)) document.title = s.title;
    setMeta('meta[name="description"]', 'content', s.description);
    setMeta('meta[name="theme-color"]', 'content', s.themeColor);
    setMeta('link[rel="canonical"]', 'href', s.url);
    setMeta('meta[property="og:site_name"]', 'content', s.name);
    setMeta('meta[property="og:title"]', 'content', s.title);
    setMeta('meta[property="og:description"]', 'content', s.socialDescription);
    setMeta('meta[property="og:url"]', 'content', s.url);
    setMeta('meta[property="og:locale"]', 'content', s.locale);
    setMeta('meta[name="twitter:title"]', 'content', s.title);
    setMeta('meta[name="twitter:description"]', 'content', s.socialDescription);
  }

  function safely(label, fn) {
    try { fn(); } catch (err) {
      if (window.console) console.error('[JalebiMC] ' + label + ' failed:', err);
    }
  }

  function start() {
    if (config) {
      safely('text binding', bindText);
      safely('link binding', bindLinks);
      safely('metadata binding', bindMetadata);
    } else if (window.console) {
      console.error('[JalebiMC] config/site-config.js did not load.');
    }

    // One failing module never stops the others.
    ['navigation', 'reveal', 'clipboard', 'serverStatus'].forEach(function (name) {
      if (J[name] && typeof J[name].init === 'function') {
        safely(name, function () { J[name].init(config); });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
