/*
 * أسس الإنجاز — admin shell behaviour + small SVG charts. No dependencies.
 * Sidebar: open/close groups, filter the menu ("/" focuses the search), mobile drawer.
 * Dropdowns: [data-as-dd] toggles its parent .as-dd.
 * Charts: AsUI.columns(el, opts) and AsUI.table(...) used by dashboard and reports.
 * Port to asuss as public/admin/custom/asuss-ui.js.
 */
(function () {
    'use strict';
    var AsUI = window.AsUI = {};
    var rtl = document.documentElement.dir === 'rtl';
    var fmt = new Intl.NumberFormat('en-US');
    AsUI.fmt = function (n) { return fmt.format(n); };

    function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }

    /* ---------- toast ---------- */
    var toastEl, toastTimer;
    AsUI.toast = function (msg) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'as-toast';
            toastEl.setAttribute('role', 'status');
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = msg;
        toastEl.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
    };

    /* ---------- sidebar: rail of departments + panel of pages ---------- */
    function initSidebar() {
        var nav = document.querySelector('.as-nav');
        if (!nav) return;
        var body = document.body;
        var KEY = 'as-panel-collapsed';
        try { if (localStorage.getItem(KEY) === '1' && window.innerWidth >= 1024) body.classList.add('as-collapsed'); } catch (e) {}

        function showDept(dept) {
            document.querySelectorAll('.as-rail__btn[data-dept]').forEach(function (b) {
                var on = b.dataset.dept === dept;
                b.classList.toggle('is-active', on);
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            nav.querySelectorAll('.as-pane').forEach(function (p) { p.hidden = p.dataset.dept !== dept; });
            nav.scrollTop = 0;
        }
        // screens that switch content in place (records.html#…) mark their link here: first href found wins
        AsUI.setActiveNav = function (hrefs) {
            var link = null;
            hrefs.some(function (h) { return (link = nav.querySelector('.as-nav__link[href="' + h + '"]')); });
            nav.querySelectorAll('.as-nav__link.is-active').forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
            if (!link) return;
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'page');
            var pane = link.closest('.as-pane');
            if (pane && pane.hidden) showDept(pane.dataset.dept);
            if (link.offsetTop > nav.scrollTop + nav.clientHeight - 60 || link.offsetTop < nav.scrollTop) nav.scrollTop = link.offsetTop - nav.clientHeight / 2;
        };
        document.addEventListener('click', function (e) {
            var b = e.target.closest('.as-rail__btn[data-dept]');
            if (b) {
                var already = b.classList.contains('is-active') && !body.classList.contains('as-collapsed');
                if (body.classList.contains('as-collapsed')) setCollapsed(false);
                if (!already) showDept(b.dataset.dept);
                if (input && input.value) { input.value = ''; apply(); }
            }
            if (e.target.closest('[data-as-toggle-panel]')) setCollapsed(!body.classList.contains('as-collapsed'));
        });
        function setCollapsed(on) {
            body.classList.toggle('as-collapsed', on);
            try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
            window.dispatchEvent(new Event('resize'));   // charts redraw at the new width
        }

        // keep the active page in view
        var active = nav.querySelector('.as-nav__link.is-active');
        if (active && active.offsetTop > nav.clientHeight - 60) nav.scrollTop = active.offsetTop - nav.clientHeight / 2;

        // search across every department
        var input = document.getElementById('as-nav-search');
        var empty = nav.querySelector('.as-nav__empty');
        if (!input) return;
        var links = [].slice.call(nav.querySelectorAll('.as-nav__item'));
        links.forEach(function (li) { var t = li.querySelector('.as-nav__text'); t.dataset.label = t.textContent; });
        function norm(s) {
            return s.toLowerCase().replace(/[ً-ْ]/g, '')
                .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
        }
        function apply() {
            var q = norm(input.value.trim());
            nav.classList.toggle('is-filtering', !!q);
            nav.querySelectorAll('.is-hidden').forEach(function (n) { n.classList.remove('is-hidden'); });
            links.forEach(function (li) { var t = li.querySelector('.as-nav__text'); t.textContent = t.dataset.label; });
            if (!q) { empty.style.display = 'none'; return; }
            var any = false;
            links.forEach(function (li) {
                var t = li.querySelector('.as-nav__text'), label = t.dataset.label, i = norm(label).indexOf(q);
                if (i < 0) { li.classList.add('is-hidden'); return; }
                any = true;
                t.textContent = '';
                t.appendChild(document.createTextNode(label.slice(0, i)));
                var m = document.createElement('mark'); m.textContent = label.slice(i, i + q.length); t.appendChild(m);
                t.appendChild(document.createTextNode(label.slice(i + q.length)));
            });
            nav.querySelectorAll('.as-nav__group').forEach(function (g) { g.classList.toggle('is-hidden', !g.querySelector('.as-nav__item:not(.is-hidden)')); });
            nav.querySelectorAll('.as-pane').forEach(function (p) { p.classList.toggle('is-hidden', !p.querySelector('.as-nav__item:not(.is-hidden)')); });
            empty.style.display = any ? 'none' : 'block';
        }
        input.addEventListener('input', apply);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { input.value = ''; apply(); input.blur(); }
            if (e.key === 'Enter') {
                var first = nav.querySelector('.as-nav__item:not(.is-hidden) a');
                if (first) first.click();
            }
        });
        document.addEventListener('keydown', function (e) {
            var tag = (e.target.tagName || '').toLowerCase();
            if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && tag !== 'select' && !e.target.isContentEditable) {
                e.preventDefault();
                if (body.classList.contains('as-collapsed')) setCollapsed(false);
                body.classList.add('as-open-nav');
                input.focus();
            }
        });
    }

    /* ---------- mobile drawer ---------- */
    function initDrawer() {
        document.addEventListener('click', function (e) {
            if (e.target.closest('[data-as-open-nav]')) document.body.classList.add('as-open-nav');
            if (e.target.closest('[data-as-close-nav]') || e.target.classList.contains('as-overlay')) document.body.classList.remove('as-open-nav');
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.body.classList.remove('as-open-nav'); });
    }

    /* ---------- dropdowns ---------- */
    function initDropdowns() {
        document.addEventListener('click', function (e) {
            var t = e.target.closest('[data-as-dd]');
            document.querySelectorAll('.as-dd.is-open').forEach(function (dd) {
                if (!t && dd.contains(e.target) && e.target.closest('[data-dd-keep]')) return;   // menus with inputs stay open
                if (!t || dd !== t.parentElement) { dd.classList.remove('is-open'); var b = dd.querySelector('[data-as-dd]'); if (b) b.setAttribute('aria-expanded', 'false'); }
            });
            if (t) {
                var dd = t.parentElement, open = !dd.classList.contains('is-open');
                dd.classList.toggle('is-open', open);
                t.setAttribute('aria-expanded', open ? 'true' : 'false');
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') document.querySelectorAll('.as-dd.is-open').forEach(function (dd) { dd.classList.remove('is-open'); });
        });
    }

    /* ---------- links to screens the kit does not have ---------- */
    function initStubs() {
        document.addEventListener('click', function (e) {
            var a = e.target.closest('a[href="#"]');
            if (!a || a.hasAttribute('data-as-keep')) return;
            e.preventDefault();
            AsUI.toast('هذه الشاشة لم تُصمَّم بعد في الكيت' + (a.dataset.route ? ' (' + a.dataset.route + ')' : ''));
        });
    }

    /* ---------- charts ---------- */
    var NS = 'http://www.w3.org/2000/svg';
    function el(name, attrs, parent) {
        var n = document.createElementNS(NS, name);
        for (var k in attrs) n.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(n);
        return n;
    }
    // top of the y axis: 4 equal whole-number steps
    function niceMax(v) {
        if (v <= 0) return 4;
        var raw = v / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), s = raw / p;
        var step = (s <= 1 ? 1 : s <= 2 ? 2 : s <= 5 ? 5 : 10) * p;
        return Math.max(1, Math.ceil(step)) * 4;
    }
    // bar path with 4px rounded data-end, square at the baseline
    function barPath(x, y, w, h, r) {
        r = Math.min(r, w / 2, h);
        return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y +
            'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
    }

    /*
     * Grouped columns. opts: {labels:[], series:[{name, color, values:[]}], unit:'', height}
     * Time runs in reading direction: right→left in RTL.
     */
    AsUI.columns = function (host, opts) {
        host.innerHTML = '';
        host.classList.add('as-chart');
        var W = Math.max(host.clientWidth, 320), H = opts.height || 260;
        var pad = { t: 12, r: 8, b: 28, l: 8 }, axisW = 36;
        var n = opts.labels.length, S = opts.series.length;
        var max = niceMax(Math.max.apply(null, opts.series.map(function (s) { return Math.max.apply(null, s.values); })));
        var plotL = rtl ? pad.l : pad.l + axisW, plotR = rtl ? W - pad.r - axisW : W - pad.r;
        var plotW = plotR - plotL, plotH = H - pad.t - pad.b;
        var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': opts.title || '', direction: 'ltr' }, host); // anchors below are in LTR terms
        // grid + y axis
        for (var g = 0; g <= 4; g++) {
            var v = max / 4 * g, y = pad.t + plotH - plotH * v / max;
            el('line', { x1: plotL, x2: plotR, y1: y, y2: y, 'class': 'as-grid-line' }, svg);
            var tx = el('text', { x: rtl ? plotR + 8 : plotL - 8, y: y + 4, 'text-anchor': rtl ? 'start' : 'end', 'class': 'as-axis-text' }, svg);
            tx.textContent = fmt.format(v);
        }
        var slot = plotW / n, gap = 2, groupW = Math.min(slot * 0.62, 18 * S + gap * (S - 1));
        var barW = (groupW - gap * (S - 1)) / S;
        var tip = document.createElement('div'); tip.className = 'as-tip'; host.appendChild(tip);
        for (var i = 0; i < n; i++) {
            var idx = rtl ? n - 1 - i : i;            // first label sits at the reading start
            var cx = plotL + slot * idx + slot / 2;
            var grp = el('g', {}, svg);
            opts.series.forEach(function (s, si) {
                var val = s.values[i], h = plotH * val / max;
                var bx = cx - groupW / 2 + si * (barW + gap);
                if (rtl) bx = cx + groupW / 2 - (si + 1) * barW - si * gap;
                if (h > 0) el('path', { d: barPath(bx, pad.t + plotH - h, barW, h, 4), fill: s.color, 'class': 'as-bar' }, grp);
            });
            if (slot >= 34 || i % 2 === 0) {          // thin out month labels on narrow screens
                var lt = el('text', { x: cx, y: H - 8, 'text-anchor': 'middle', 'class': 'as-axis-text' }, svg);
                lt.textContent = opts.short ? opts.short[i] : opts.labels[i];
            }
            var hit = el('rect', { x: cx - slot / 2, y: pad.t, width: slot, height: plotH, 'class': 'as-hit' }, svg);
            (function (i, cx, grp) {
                hit.addEventListener('mouseenter', function () {
                    host.classList.add('is-hovering'); grp.classList.add('is-hover');
                    tip.innerHTML = '<b>' + opts.labels[i] + '</b>' + opts.series.map(function (s) {
                        return '<span><span><i style="background:' + s.color + '"></i>' + s.name + '</span><strong class="as-num">' + fmt.format(s.values[i]) + (opts.unit || '') + '</strong></span>';
                    }).join('');
                    tip.style.display = 'block';
                    tip.style.left = (cx / W * host.clientWidth) + 'px';
                    tip.style.top = (pad.t / H * host.clientHeight + 8) + 'px';
                });
                hit.addEventListener('mouseleave', function () {
                    host.classList.remove('is-hovering'); grp.classList.remove('is-hover'); tip.style.display = 'none';
                });
            })(i, cx, grp);
        }
        el('line', { x1: plotL, x2: plotR, y1: pad.t + plotH, y2: pad.t + plotH, stroke: '#d1d5db' }, svg);
    };

    // trend line for a KPI: one series, last point marked, time in reading direction
    AsUI.spark = function (host, values) {
        var W = 96, H = 36, p = 3, n = values.length;
        var min = Math.min.apply(null, values), max = Math.max.apply(null, values), span = max - min || 1;
        var pts = values.map(function (v, i) {
            var x = p + (W - 2 * p) * i / (n - 1);
            if (rtl) x = W - x;
            return [x, p + (H - 2 * p) * (1 - (v - min) / span)];
        });
        var line = pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join('');
        var last = pts[n - 1];
        host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">' +
            '<path d="' + line + 'L' + last[0].toFixed(1) + ',' + H + 'L' + pts[0][0].toFixed(1) + ',' + H + 'Z" fill="#eef5fb"/>' +
            '<path d="' + line + '" fill="none" stroke="#1D70B7" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
            '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3.5" fill="#1D70B7" stroke="#fff" stroke-width="2"/></svg>';
    };

    AsUI.legend = function (host, series) {
        host.className = 'as-legend';
        host.innerHTML = series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + s.name + '</span>'; }).join('');
    };

    // table view of a columns chart (identity is never colour-alone)
    AsUI.chartTable = function (host, opts) {
        var head = '<tr><th>' + (opts.labelHead || 'الشهر') + '</th>' + opts.series.map(function (s) { return '<th class="is-num">' + s.name + '</th>'; }).join('') + '</tr>';
        var body = opts.labels.map(function (l, i) {
            return '<tr><td>' + l + '</td>' + opts.series.map(function (s) { return '<td class="is-num as-num">' + fmt.format(s.values[i]) + '</td>'; }).join('') + '</tr>';
        }).join('');
        var foot = '<tr><td>الإجمالي</td>' + opts.series.map(function (s) {
            return '<td class="is-num as-num">' + fmt.format(s.values.reduce(function (a, b) { return a + b; }, 0)) + '</td>';
        }).join('') + '</tr>';
        host.innerHTML = '<div class="as-tablewrap"><table class="as-table"><thead>' + head + '</thead><tbody>' + body + '</tbody><tfoot>' + foot + '</tfoot></table></div>';
    };

    // a .as-chartbox with [data-as-view] buttons toggles chart ↔ table
    function initChartToggles() {
        document.addEventListener('click', function (e) {
            var b = e.target.closest('[data-as-view]');
            if (!b) return;
            var box = b.closest('.as-chartbox');
            var table = b.dataset.asView === 'table';
            box.classList.toggle('is-table', table);
            box.querySelectorAll('[data-as-view]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        });
    }

    AsUI.meters = function (host, items, total) {
        var max = Math.max.apply(null, items.map(function (x) { return x.value; }));
        host.className = 'as-meters';
        host.innerHTML = items.map(function (x) {
            var pct = total ? Math.round(x.value / total * 100) : null;
            return '<li><div class="as-meter__row"><strong>' + x.label + '</strong><span class="as-num">' + fmt.format(x.value) +
                (pct !== null ? ' · ' + pct + '%' : '') + '</span></div>' +
                '<div class="as-meter__track"><div class="as-meter__fill" style="width:' + (x.value / max * 100) + '%"></div></div></li>';
        }).join('');
    };

    ready(function () {
        initSidebar(); initDrawer(); initDropdowns(); initStubs(); initChartToggles();
        var y = document.querySelectorAll('[data-as-year]');
        y.forEach(function (n) { n.textContent = new Date().getFullYear(); });
    });
})();
