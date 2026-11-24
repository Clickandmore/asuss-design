/* Design kit only (not ported to asuss): the static login signs straight into the dashboard.
   Runs in the capture phase, before the page's own jQuery submit handler, which would post to Laravel. */
(function () {
  function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    var form = document.getElementById('loginForm');
    if (!form) return;
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    email.value = 'admin@example.com';
    password.value = 'demo-password';

    document.addEventListener('submit', function (e) {
      if (e.target !== form) return;
      e.preventDefault();
      e.stopPropagation();
      var missing = !email.value.trim() ? email : !password.value ? password : null;
      if (missing) {
        var field = missing.closest('.field');
        field.classList.add('has-error');
        field.querySelector('.field-error').textContent = missing === email ? 'أدخل البريد الإلكتروني.' : 'أدخل كلمة المرور.';
        missing.setAttribute('aria-invalid', 'true');
        missing.focus();
        return;
      }
      var btn = document.getElementById('login-submit');
      btn.disabled = true;
      btn.classList.add('is-loading');
      btn.querySelector('.btn-label').textContent = 'تم تسجيل الدخول، جارٍ التحويل…';
      setTimeout(function () { window.location.href = 'dashboard.html'; }, 500);
    }, true);
  });
})();
