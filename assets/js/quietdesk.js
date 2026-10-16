(function () {
  'use strict';
  var fallback = document.getElementById('demo-fallback');
  var widget = document.querySelector('script[src$="/widget/quietdesk-widget.js"]');
  if (!fallback || !widget) return;

  function show() { fallback.removeAttribute('hidden'); }

  // Both paths are needed: a deferred script's error event can fire before this
  // script runs, so also check window.QuietDesk five seconds after load.
  widget.addEventListener('error', show);
  function check() {
    setTimeout(function () {
      if (typeof window.QuietDesk === 'undefined') show();
    }, 5000);
  }
  if (document.readyState === 'complete') check();
  else window.addEventListener('load', check);
})();
