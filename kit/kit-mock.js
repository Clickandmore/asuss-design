/*
 * Design-kit AJAX mock.
 * Loaded right after jQuery (plugins.js). DataTables endpoints in the screens were
 * rewritten to "kit:<key>"; this answers them from window.KIT_FIXTURES (anonymized
 * sample rows captured from the real app). Every other request to "#" resolves with an
 * empty success so the static page stays quiet instead of throwing error alerts.
 */
(function ($) {
  // native dialogs would freeze the static page (and headless capture); log them instead
  window.alert = function (msg) { console.info('[design kit] alert:', msg); };
  window.confirm = function (msg) { console.info('[design kit] confirm:', msg); return false; };
  window.prompt = function (msg) { console.info('[design kit] prompt:', msg); return null; };
  if (!$ || !$.ajax) return;
  var realAjax = $.ajax;
  var fixtures = window.KIT_FIXTURES || {};

  function parseDraw(data) {
    if (!data) return 1;
    if (typeof data === 'string') {
      var m = data.match(/(?:^|&)draw=(\d+)/);
      return m ? +m[1] : 1;
    }
    return data.draw || 1;
  }

  function respond(opts, payload) {
    var d = $.Deferred();
    setTimeout(function () {
      var ctx = opts.context || opts;
      if (typeof opts.success === 'function') opts.success.call(ctx, payload, 'success', {});
      if (typeof opts.complete === 'function') opts.complete.call(ctx, {}, 'success');
      d.resolveWith(ctx, [payload, 'success', {}]);
    }, 120);
    var p = d.promise();
    p.abort = function () {};
    p.done = p.done || p.then;
    p.success = p.done;
    p.error = p.fail;
    return p;
  }

  $.ajax = function (url, options) {
    var opts = typeof url === 'object' ? url : $.extend({}, options, { url: url });
    var u = String(opts.url || '');

    if (u.indexOf('kit:') === 0) {
      var key = u.slice(4).split(/[?\/#]/)[0];
      var fx = fixtures[key] || { data: [], recordsTotal: 0, recordsFiltered: 0 };
      var payload = $.extend(true, {}, fx, { draw: parseDraw(opts.data) });
      return respond(opts, payload);
    }
    // requests that would have gone back to the Laravel app
    if (u === '' || u === '#' || u.charAt(0) === '#' || u.charAt(0) === '/') {
      return respond(opts, { status: true, success: true, data: [], html: '', message: 'design kit' });
    }
    return realAjax.apply(this, arguments);
  };
})(window.jQuery);
