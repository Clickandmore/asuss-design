/* Design-kit helper: makes the static snapshots usable without the Laravel backend. */
(function () {
  function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    var loader = document.getElementById('loading-wrapper');
    if (loader) loader.style.display = 'none';
    // links that point to routes outside the kit do nothing instead of jumping to the top
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href="#"][data-route]');
      if (a) e.preventDefault();
    }, true);
    // forms cannot post anywhere in a static kit
    document.querySelectorAll('form').forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); });
    });
    var badge = document.createElement('a');
    badge.href = '../gallery.html';
    badge.textContent = 'Design kit ▸ كل الشاشات';
    badge.setAttribute('style', 'position:fixed;bottom:12px;left:12px;z-index:99999;background:#111827;color:#fff;' +
      'font:600 12px/1 system-ui,sans-serif;padding:8px 12px;border-radius:999px;text-decoration:none;opacity:.85');
    document.body.appendChild(badge);
  });
})();
