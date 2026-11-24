/*
 * أسس الإنجاز — add / edit forms. One behaviour for every form built with the .as-form markup
 * (DESIGN.md → «نموذج الإضافة والتعديل»). No libraries; needs asuss-ui.js for the toast.
 *
 *   <form class="as-form" data-as-form data-done="records.html#clients">
 *     .as-fsec[id] sections      → listed in [data-form-nav] with what is still missing in each
 *     [required]                 → counted, checked on save; message from data-err or «هذا الحقل مطلوب»
 *     [data-show-if="name=a|b"]  → shown only when the field `name` has one of those values;
 *                                   hidden fields are disabled so they are not sent or checked
 *     .as-choice / .as-chipopt   → get .is-on when their input is checked
 *     .as-drop (input[type=file])→ shows the chosen file name, or the photo itself
 *     [data-repeat] + <template> → [data-repeat-add] adds a row, [data-repeat-del] removes one
 *     [data-bind="name"]         → text follows the field `name` (summary cards); data-empty when blank,
 *                                   data-format="num" adds thousands separators
 *     [data-age-from="name"]     → read-only age in years from the date field `name`
 *     [data-pattern] + data-err  → extra format check (e.g. ID = 10 digits)
 *
 * Port to asuss as public/admin/custom/asuss-forms.js. In asuss the submit goes to the
 * existing route; on a 422 call AsForms.errors(form, {field: [message]}) to show them in place.
 */
(function () {
    'use strict';
    var AsForms = window.AsForms = {};
    var REQ = 'هذا الحقل مطلوب';

    function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }
    function toast(m) { if (window.AsUI && AsUI.toast) AsUI.toast(m); }
    function fieldOf(el) { return el.closest('.as-f') || el.closest('.as-choices') || el.parentNode; }
    function visible(el) { return !el.closest('[hidden]') && !el.disabled; }

    function valueOf(form, name) {
        var els = form.querySelectorAll('[name="' + name + '"]');
        if (!els.length) return '';
        var first = els[0];
        if (first.type === 'radio') { var on = form.querySelector('[name="' + name + '"]:checked'); return on ? on.value : ''; }
        if (first.type === 'checkbox') {
            if (els.length === 1) return first.checked ? first.value || 'on' : '';
            return Array.prototype.filter.call(els, function (e) { return e.checked; }).map(function (e) { return e.value; }).join(',');
        }
        return first.value;
    }
    function textOf(form, name) {
        var el = form.querySelector('[name="' + name + '"]');
        if (!el) return '';
        if (el.tagName === 'SELECT') return el.value ? el.options[el.selectedIndex].text : '';
        if (el.type === 'radio') {
            var on = form.querySelector('[name="' + name + '"]:checked');
            if (!on) return '';
            var s = on.closest('label') && on.closest('label').querySelector('strong');
            return s ? s.textContent : on.value;
        }
        if (el.type === 'checkbox') {
            return Array.prototype.filter.call(form.querySelectorAll('[name="' + name + '"]'), function (e) { return e.checked; })
                .map(function (e) { return e.closest('label').textContent.trim(); }).join('، ');
        }
        return el.value.trim();
    }

    function empty(el) {
        if (el.type === 'radio') return !el.form.querySelector('[name="' + el.name + '"]:checked');
        if (el.type === 'checkbox') return !el.checked;
        if (el.type === 'file') return !el.files.length && !el.dataset.has;
        return !String(el.value).trim();
    }
    function problem(el) {
        if (el.required && empty(el)) return el.dataset.err && !el.dataset.pattern ? el.dataset.err : REQ;
        if (el.dataset.pattern && el.value && !new RegExp('^(?:' + el.dataset.pattern + ')$').test(el.value.trim())) return el.dataset.err || 'القيمة غير صحيحة';
        return '';
    }
    function setError(el, msg) {
        var f = fieldOf(el);
        if (!f) return;
        var err = f.querySelector('.as-f__err');
        if (!err && msg) {
            err = document.createElement('p');
            err.className = 'as-f__err';
            err.id = (el.id || el.name) + '-err';
            f.appendChild(err);
        }
        f.classList.toggle('is-invalid', !!msg);
        if (err) err.textContent = msg || '';
        if (msg) { el.setAttribute('aria-invalid', 'true'); if (err) el.setAttribute('aria-describedby', err.id); }
        else el.removeAttribute('aria-invalid');
    }

    function init(form) {
        var sections = Array.prototype.slice.call(form.querySelectorAll('.as-fsec[id]'));
        var nav = form.querySelector('[data-form-nav]') || document.querySelector('[data-form-nav]');
        var state = form.querySelector('[data-form-state]') || document.querySelector('[data-form-state]');
        var dirty = false, touched = {};

        /* ---------- conditional parts ---------- */
        function conditions() {
            form.querySelectorAll('[data-show-if]').forEach(function (el) {
                var c = el.dataset.showIf.split('='), v = valueOf(form, c[0]).split(',');
                var show = c[1].split('|').some(function (x) { return v.indexOf(x) >= 0; });
                el.hidden = !show;
                el.querySelectorAll('input, select, textarea').forEach(function (i) { i.disabled = !show; });
            });
            // keep numbering right when sections come and go
            var n = 0;
            sections.forEach(function (s) { var b = s.querySelector('.as-fsec__n'); if (!s.hidden && b) b.textContent = ++n; });
        }

        /* ---------- checked look ---------- */
        function marks() {
            form.querySelectorAll('.as-choice, .as-chipopt').forEach(function (l) {
                var i = l.querySelector('input');
                l.classList.toggle('is-on', !!(i && i.checked));
            });
        }

        /* ---------- summaries ---------- */
        function binds() {
            document.querySelectorAll('[data-bind]').forEach(function (el) {
                var names = el.dataset.bind.split('+'), parts = names.map(function (n) { return textOf(form, n); }).filter(Boolean);
                if (el.dataset.format === 'num') parts = parts.map(function (x) { return isNaN(+x) ? x : new Intl.NumberFormat('en-US').format(+x); });
                var t = parts.join(el.dataset.join || ' · ');
                el.textContent = t || el.dataset.empty || '—';
                el.classList.toggle('is-empty', !t);
            });
            form.querySelectorAll('[data-age-from]').forEach(function (el) {
                var d = valueOf(form, el.dataset.ageFrom), age = '';
                if (d) {
                    var b = new Date(d), now = new Date();
                    age = now.getFullYear() - b.getFullYear() - (now < new Date(now.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
                    age = age > 0 && age < 100 ? age : '';
                }
                el.value = age;
                el.dispatchEvent(new Event('as:age'));
            });
        }

        /* ---------- index + what is missing ---------- */
        function buildNav() {
            if (!nav) return;
            var list = nav.querySelector('ol');
            list.innerHTML = sections.map(function (s) {
                return '<li data-for="' + s.id + '"><a href="#' + s.id + '"><span class="as-formnav__n"><span></span></span><span>' +
                    s.querySelector('h3').textContent + '</span><span class="as-formnav__miss"></span></a></li>';
            }).join('');
        }
        function count() {
            var total = 0, left = 0;
            sections.forEach(function (s) {
                var req = Array.prototype.filter.call(s.querySelectorAll('[required]'), visible), seen = {}, miss = 0, all = 0;
                req.forEach(function (el) {
                    if (el.type === 'radio') { if (seen[el.name]) return; seen[el.name] = 1; }
                    all++;
                    if (empty(el)) miss++;
                });
                total += all; left += miss;
                if (!nav) return;
                var li = nav.querySelector('[data-for="' + s.id + '"]');
                if (!li) return;
                li.hidden = s.hidden;
                var a = li.querySelector('a');
                li.querySelector('.as-formnav__n span').textContent = s.querySelector('.as-fsec__n') ? s.querySelector('.as-fsec__n').textContent : '';
                a.classList.toggle('is-done', all > 0 ? miss === 0 : !!touched[s.id]);
                a.classList.toggle('is-bad', miss > 0 && !!s.querySelector('.is-invalid'));
                li.querySelector('.as-formnav__miss').textContent = miss ? (miss === 1 ? 'حقل ناقص' : miss === 2 ? 'حقلان ناقصان' : miss + ' حقول ناقصة') : '';
            });
            var done = total - left, pct = total ? Math.round(done / total * 100) : 100;
            if (nav) {
                var bar = nav.querySelector('.as-pbar__track span'), lab = nav.querySelector('[data-form-pct]');
                if (bar) bar.style.width = pct + '%';
                if (lab) lab.textContent = pct + '%';
            }
            if (state) {
                state.classList.toggle('is-ready', !left);
                state.innerHTML = left
                    ? '<i class="fa-solid fa-circle-exclamation"></i>' + (left === 1 ? 'حقل مطلوب واحد لم يُعبّأ' : left === 2 ? 'حقلان مطلوبان لم يُعبّآ' : '<span class="as-num">' + left + '</span> حقول مطلوبة لم تُعبّأ')
                    : '<i class="fa-solid fa-circle-check"></i>كل الحقول المطلوبة مكتملة';
            }
        }
        function spy() {
            if (!nav || !('IntersectionObserver' in window)) return;
            var io = new IntersectionObserver(function (es) {
                es.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    nav.querySelectorAll('a').forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
                });
            }, { rootMargin: '-30% 0px -60% 0px' });
            sections.forEach(function (s) { io.observe(s); });
            nav.addEventListener('click', function (e) {
                var a = e.target.closest('a[href^="#"]');
                if (!a) return;
                e.preventDefault();
                var s = document.getElementById(a.getAttribute('href').slice(1));
                s.scrollIntoView({ behavior: 'smooth', block: 'start' });
                var first = s.querySelector('input:not([type=hidden]):not([disabled]), select, textarea');
                if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350);
            });
        }

        /* ---------- files ---------- */
        form.querySelectorAll('.as-drop input[type=file]').forEach(function (inp) {
            var drop = inp.closest('.as-drop'), name = drop.querySelector('.as-drop__txt strong'), icon = drop.querySelector('.as-drop__icon');
            var orig = name ? name.textContent : '';
            inp.addEventListener('change', function () {
                var f = inp.files[0];
                drop.classList.toggle('is-filled', !!f);
                if (name) name.textContent = f ? f.name : orig;
                if (icon && drop.classList.contains('as-drop--photo')) {
                    icon.style.backgroundImage = f && /^image\//.test(f.type) ? 'url(' + URL.createObjectURL(f) + ')' : '';
                    var target = document.querySelector('[data-photo-of="' + inp.name + '"]');
                    if (target) target.style.backgroundImage = icon.style.backgroundImage;
                }
            });
            ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.add('is-over'); }); });
            ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('is-over'); }); });
        });

        /* ---------- repeated rows ---------- */
        form.addEventListener('click', function (e) {
            var add = e.target.closest('[data-repeat-add]');
            if (add) {
                var box = form.querySelector('[data-repeat="' + add.dataset.repeatAdd + '"]');
                var tpl = form.querySelector('template[data-for="' + add.dataset.repeatAdd + '"]');
                box.appendChild(tpl.content.cloneNode(true));
                var last = box.lastElementChild.querySelector('input, select');
                if (last) last.focus();
                dirty = true;
            }
            var del = e.target.closest('[data-repeat-del]');
            if (del) { del.closest('.as-repeat__row').remove(); dirty = true; }
        });

        /* ---------- live ---------- */
        function refresh() { conditions(); marks(); binds(); count(); }
        form.addEventListener('input', function (e) {
            dirty = true;
            var s = e.target.closest('.as-fsec');
            if (s) touched[s.id] = true;
            if (fieldOf(e.target) && fieldOf(e.target).classList.contains('is-invalid') && !problem(e.target)) setError(e.target, '');
            refresh();
        });
        form.addEventListener('change', function (e) {
            dirty = true;
            if (fieldOf(e.target) && fieldOf(e.target).classList.contains('is-invalid') && !problem(e.target)) setError(e.target, '');
            refresh();
        });
        // a format problem shows when the user leaves the field, not while typing
        form.addEventListener('focusout', function (e) {
            var el = e.target;
            if (!el.matches || !el.matches('[data-pattern]') || !el.value) return;
            setError(el, problem(el));
            count();
        });

        /* ---------- save ---------- */
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var first = null, seen = {};
            form.querySelectorAll('input, select, textarea').forEach(function (el) {
                if (!visible(el) || el.type === 'hidden') return;
                if (el.type === 'radio') { if (seen[el.name]) return; seen[el.name] = 1; }
                var msg = problem(el);
                setError(el, msg);
                if (msg && !first) first = el;
            });
            count();
            if (first) {
                var sec = first.closest('.as-fsec');
                (sec || first).scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(function () { first.focus({ preventScroll: true }); }, 350);
                toast('راجع الحقول المظللة بالأحمر قبل الحفظ.');
                return;
            }
            dirty = false;
            var again = e.submitter && e.submitter.hasAttribute('data-again');
            toast(form.dataset.saved || 'تم الحفظ.');
            setTimeout(function () {
                if (again) { form.reset(); touched = {}; refresh(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
                else if (form.dataset.done) location.href = form.dataset.done;
            }, 900);
        });
        form.addEventListener('reset', function () { setTimeout(function () { dirty = false; refresh(); }); });
        window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
        form.querySelectorAll('[data-cancel]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                if (dirty && !confirm('ستفقد ما كتبته في هذا النموذج. هل تريد الخروج؟')) e.preventDefault();
                else dirty = false;
            });
        });

        buildNav();
        refresh();
        spy();
    }

    // server-side errors (422) shown in place, same look as the browser checks
    AsForms.errors = function (form, errors) {
        var first = null;
        Object.keys(errors).forEach(function (name) {
            var el = form.querySelector('[name="' + name + '"]');
            if (!el) return;
            setError(el, [].concat(errors[name])[0]);
            first = first || el;
        });
        if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus({ preventScroll: true }); }
    };

    ready(function () { document.querySelectorAll('form[data-as-form]').forEach(init); });
})();
