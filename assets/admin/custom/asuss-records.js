/*
 * أسس الإنجاز — «السجلات»: one screen for every list in the panel
 * (orders, recruitment / rent / shelter contracts, CVs, clients, complaints, approvals, tasks).
 *
 *   AsRecords.init({ entities: [...], default: 'recruitment' })
 *
 * Each entity (see kit/redesign/pages/records.html) gives its columns, statuses, filters,
 * a details panel and its actions. Rows come from one function:
 *
 *   AsRecords.source(entity, query) → Promise<{ rows, total, counts }>
 *     query  = { status, statusIn, q, filters: {key: value}, flags: {key: true}, range: {from, to}, sort: {key, dir}, page, size }
 *              statusIn: the ids of a status group (e.g. «النشطة») instead of one status
 *              range:    ISO dates (inclusive) on the entity's date field; null = all time
 *     counts = { all: n, <statusId>: n, … }   status-chip counts, computed WITHOUT the status filter
 *
 * The design kit fills it from kit/records-mock.js. In asuss it calls one JSON route per entity
 * (entity.url) with the same query; the route returns rows already shaped for the render functions.
 *
 * Entity filters (real asuss logic, DESIGN.md → «الفلاتر»):
 *   statuses: [{ id, label, tone }]            one chip each, with its count
 *             { …, ids: [...] }                a group chip (count = sum), e.g. النشطة
 *             { …, more: true }                folded under «المزيد» (end states)
 *             { …, hidden: true }              no chip, reachable by link only
 *   defaultStatus: 'active'                    chip selected when the list opens
 *   filters:  [{ key, label, all, options }]   select in the bar; more: true → «فلاتر أخرى» panel
 *   range:    { label: 'تاريخ العقد' }          period filter with presets
 *   flags:    [{ key, label, icon }]           on/off buttons
 *
 * Deep links: records.html#<entity>[/<status | flag | filter value | period>]…, e.g. #recruitment/tafwed/late, #visits/today.
 * Port to asuss as public/admin/custom/asuss-records.js (needs asuss-ui.js first).
 */
(function () {
    'use strict';
    var R = window.AsRecords = {};
    var fmt = new Intl.NumberFormat('en-US');
    var MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return MAP[c]; }); }
    function toast(msg) { if (window.AsUI && AsUI.toast) AsUI.toast(msg); }
    function store(key, val) {
        try {
            if (val === undefined) { var v = localStorage.getItem('as-rec:' + key); return v ? JSON.parse(v) : null; }
            localStorage.setItem('as-rec:' + key, JSON.stringify(val));
        } catch (e) { return null; }
    }

    /* ================= render helpers (used by the entity config) ================= */
    R.esc = esc;
    R.n = function (v) { return '<span class="as-num">' + fmt.format(v) + '</span>'; };
    R.money = function (v) { return '<span class="as-money"><span class="as-num">' + fmt.format(v) + '</span> <small>ر.س</small></span>'; };
    R.date = function (iso) { return iso ? '<span class="as-num">' + esc(iso) + '</span>' : '<span class="as-none">—</span>'; };
    R.none = function (txt) { return '<span class="as-none">' + esc(txt || '—') + '</span>'; };
    R.badge = function (label, tone) { return '<span class="as-badge as-badge--' + (tone || 'neutral') + '">' + esc(label) + '</span>'; };
    R.tag = function (label, icon) { return '<span class="as-tag">' + (icon ? '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' : '') + esc(label) + '</span>'; };
    // main line + muted second line (both escaped; mainHtml/subHtml variants take markup)
    R.two = function (main, sub, o) {
        o = o || {};
        var m = o.mainHtml || esc(main), s = o.subHtml || (sub ? esc(sub) : '');
        return '<div class="as-two"><span class="as-two__main' + (o.num ? ' as-num' : '') + '">' + m + '</span>' +
            (s ? '<span class="as-two__sub' + (o.subNum ? ' as-num' : '') + '">' + s + '</span>' : '') + '</div>';
    };
    // initials on a soft colour chosen from the name, so the same person keeps the same colour
    var HUES = [['#eef5fb', '#1a5f9e'], ['#ecfdf3', '#067647'], ['#fef6ee', '#b93815'], ['#f4f3ff', '#5925dc'], ['#fdf2fa', '#c11574'], ['#f0f9ff', '#026aa2'], ['#fffaeb', '#b54708']];
    R.initials = function (name) {
        var parts = String(name || '').trim().split(/\s+/);
        return (parts[0] || '').charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '');
    };
    R.avatar = function (name, size) {
        var h = 0, s = String(name || '');
        for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        var c = HUES[h % HUES.length];
        return '<span class="as-ava' + (size ? ' as-ava--' + size : '') + '" style="background:' + c[0] + ';color:' + c[1] + '" aria-hidden="true">' + esc(R.initials(name)) + '</span>';
    };
    R.person = function (name, sub, o) {
        o = o || {};
        return '<div class="as-person">' + R.avatar(name) + R.two(name, sub, o) + '</div>';
    };
    // "منذ 3 أيام" with Arabic number agreement
    R.days = function (n) {
        if (n === 1) return 'يوم';
        if (n === 2) return 'يومان';
        if (n >= 3 && n <= 10) return n + ' أيام';
        return n + ' يومًا';
    };
    R.ago = function (n) {
        if (n <= 0) return 'اليوم';
        if (n === 1) return 'أمس';
        if (n === 2) return 'منذ يومين';
        return 'منذ ' + R.days(n);
    };
    R.bar = function (value, max, tone, label) {
        var pct = max ? Math.max(0, Math.min(100, value / max * 100)) : 0;
        return '<div class="as-pbar' + (tone ? ' as-pbar--' + tone : '') + '">' +
            (label ? '<span class="as-pbar__label">' + label + '</span>' : '') +
            '<span class="as-pbar__track"><span style="width:' + pct.toFixed(1) + '%"></span></span></div>';
    };
    R.dots = function (level) {   // priority: high / medium / low
        var map = { high: ['عالية', 'danger', 3], medium: ['متوسطة', 'warning', 2], low: ['منخفضة', 'neutral', 1] };
        var p = map[level] || map.low;
        return '<span class="as-prio as-prio--' + p[1] + '" data-level="' + p[2] + '"><i></i><i></i><i></i><span>' + p[0] + '</span></span>';
    };
    // drawer pieces
    R.dl = function (pairs) {
        return '<dl class="as-dl">' + pairs.filter(Boolean).map(function (p) {
            return '<div><dt>' + esc(p[0]) + '</dt><dd>' + (p[2] ? p[1] : (p[1] == null || p[1] === '' ? '<span class="as-none">—</span>' : esc(p[1]))) + '</dd></div>';
        }).join('') + '</dl>';
    };
    R.section = function (title, html, extra) {
        return '<section class="as-dsec"><h4>' + esc(title) + (extra || '') + '</h4>' + html + '</section>';
    };
    // vertical steps: [{label, date}] with the current index; done before it, upcoming after it
    R.steps = function (steps, current, o) {
        o = o || {};
        return '<ol class="as-steps">' + steps.map(function (s, i) {
            var cls = i < current ? 'is-done' : i === current ? (o.danger ? 'is-danger' : 'is-now') : '';
            return '<li class="' + cls + '"><span class="as-steps__dot" aria-hidden="true">' + (i < current ? '<i class="fa-solid fa-check"></i>' : (i + 1)) + '</span>' +
                '<span class="as-steps__txt"><strong>' + esc(s.label) + '</strong>' + (s.note ? '<span>' + s.note + '</span>' : '') + '</span></li>';
        }).join('') + '</ol>';
    };
    R.note = function (html, tone) { return '<p class="as-dnote as-dnote--' + (tone || 'info') + '">' + html + '</p>'; };

    /* ================= the screen ================= */
    R.init = function (cfg) {
        var root = document.querySelector('[data-as-records]');
        if (!root) return;
        var ents = cfg.entities, byId = {};
        ents.forEach(function (e) { byId[e.id] = e; });
        function $(sel) { return root.querySelector(sel); }

        var el = {
            title: $('[data-rec-title]'), desc: $('[data-rec-desc]'), newBtn: $('[data-rec-new]'),
            tabs: $('[data-rec-tabs]'), chips: $('[data-rec-chips]'), q: $('[data-rec-q]'),
            filters: $('[data-rec-filters]'), cols: $('[data-rec-cols]'), density: $('[data-rec-density]'),
            view: $('[data-rec-view]'), pills: $('[data-rec-pills]'), bulk: $('[data-rec-bulk]'),
            selCount: $('[data-rec-selcount]'), bulkActs: $('[data-rec-bulkacts]'),
            scroll: $('[data-rec-scroll]'), table: $('[data-rec-table]'), cards: $('[data-rec-cards]'),
            empty: $('[data-rec-empty]'), range: $('[data-rec-range]'), size: $('[data-rec-size]'), pager: $('[data-rec-pager]')
        };
        var drawer = document.querySelector('[data-rec-drawer]');
        var st = null, res = { rows: [], total: 0, counts: {} }, reqId = 0, openId = null;
        el.more = root.querySelector('[data-rec-more]');
        var PRESETS = [['all', 'كل الوقت'], ['today', 'اليوم'], ['7d', 'آخر 7 أيام'], ['30d', 'آخر 30 يومًا'], ['month', 'هذا الشهر'], ['lastmonth', 'الشهر الماضي'], ['year', 'هذه السنة']];
        function today() { return R.today ? R.today() : new Date(); }
        function isoOf(d) { return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10); }
        function resolveRange(r) {
            if (!r) return null;
            if (!r.preset) return { from: r.from || null, to: r.to || null };
            var t = today(), y = t.getFullYear(), m = t.getMonth(), back = function (n) { return isoOf(new Date(y, m, t.getDate() - n)); };
            return {
                today: { from: isoOf(t), to: isoOf(t) }, '7d': { from: back(6), to: isoOf(t) }, '30d': { from: back(29), to: isoOf(t) },
                month: { from: isoOf(new Date(y, m, 1)), to: isoOf(t) }, lastmonth: { from: isoOf(new Date(y, m - 1, 1)), to: isoOf(new Date(y, m, 0)) },
                year: { from: isoOf(new Date(y, 0, 1)), to: isoOf(t) }
            }[r.preset] || null;
        }

        /* ---------- tabs ---------- */
        el.tabs.innerHTML = ents.map(function (e) {
            return '<a class="as-rectab" role="tab" href="#' + e.id + '" data-id="' + e.id + '" aria-selected="false">' +
                '<i class="fa-solid ' + e.icon + '" aria-hidden="true"></i><span>' + esc(e.tab || e.title) + '</span>' +
                '<span class="as-rectab__n as-num">' + fmt.format(e.total) + '</span>' +
                (e.alert ? '<span class="as-rectab__alert as-num" title="' + esc(e.alert.label) + '">' + e.alert.n + '</span>' : '') + '</a>';
        }).join('');

        /* ---------- state ---------- */
        function fresh(e) {
            var pref = store('pref:' + e.id) || {};
            return {
                e: e, status: e.defaultStatus || 'all', q: '', filters: {}, flags: {}, range: null, sort: e.sort ? { key: e.sort[0], dir: e.sort[1] } : null,
                page: 1, size: pref.size || 25, density: pref.density || 'comfortable', view: pref.view || 'table',
                hidden: pref.hidden || e.columns.filter(function (c) { return c.hidden; }).map(function (c) { return c.key; }),
                sel: {}
            };
        }
        function savePref() {
            store('pref:' + st.e.id, { size: st.size, density: st.density, view: st.view, hidden: st.hidden });
        }
        function cols() { return st.e.columns.filter(function (c) { return st.hidden.indexOf(c.key) < 0; }); }

        /* ---------- route: #entity/segment ---------- */
        function fromHash() {
            var h = decodeURIComponent(location.hash.replace(/^#/, '')).split('/');
            var e = byId[h[0]] || byId[cfg.default] || ents[0];
            st = fresh(e);
            h.slice(1).forEach(function (seg) {
                if (!seg) return;
                if (seg === 'all') st.status = 'all';
                else if (e.statuses.some(function (s) { return s.id === seg; })) st.status = seg;
                else if (e.range && PRESETS.some(function (p) { return p[0] === seg; })) st.range = { preset: seg };
                else if ((e.flags || []).some(function (f) { return f.key === seg; })) st.flags[seg] = true;
                else (e.filters || []).forEach(function (f) {
                    if (f.options.some(function (o) { return o[0] === seg; })) st.filters[f.key] = seg;
                });
            });
            closeDrawer(true);
            document.body.classList.remove('as-open-nav');
            setupEntity();
            load();
            syncNav(byId[h[0]] ? h.slice(0, 2).join('/') : e.id);
        }
        function syncNav(key) {
            if (!window.AsUI || !AsUI.setActiveNav) return;
            var base = 'records.html#';
            AsUI.setActiveNav([base + key, base + key.split('/')[0]]);
        }

        // fade the cut edge of the tab strip only while there is more to scroll to
        function tabEdge() {
            var t = el.tabs, over = t.scrollWidth > t.clientWidth + 1;
            t.classList.toggle('is-overflow', over);
            t.classList.toggle('is-end', over && Math.abs(t.scrollLeft) + t.clientWidth >= t.scrollWidth - 2);
        }

        function closeDd(x) { var d = x.closest('.as-dd.is-open'); if (d) { d.classList.remove('is-open'); var b = d.querySelector('[data-as-dd]'); if (b) b.setAttribute('aria-expanded', 'false'); } }
        /* ---------- filters ---------- */
        function selectHtml(f, bare) {
            var sel = '<select class="as-select as-select--sm" data-filter="' + f.key + '"' + (bare ? '' : ' aria-label="' + esc(f.label) + '"') + '>' +
                '<option value="">' + esc(f.all) + '</option>' +
                f.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (st.filters[f.key] === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
            return bare ? sel : '<span class="as-fsel">' + sel + '</span>';
        }
        function rangeHtml() {
            return '<div class="as-dd as-range"><button type="button" class="as-toggle as-range__btn" data-as-dd aria-expanded="false" aria-haspopup="true">' +
                '<i class="fa-regular fa-calendar" aria-hidden="true"></i><span data-range-label></span><i class="fa-solid fa-chevron-down as-range__caret" aria-hidden="true"></i></button>' +
                '<div class="as-dd__menu as-range__menu" data-dd-keep><p class="as-dd__head">' + esc(st.e.range.label) + '</p>' +
                PRESETS.map(function (p) { return '<button type="button" data-range="' + p[0] + '">' + esc(p[1]) + '</button>'; }).join('') +
                '<div class="as-dd__sep"></div><p class="as-dd__head">فترة مخصصة</p><div class="as-range__custom">' +
                '<label><span>من</span><input type="date" class="as-input" dir="ltr" data-range-from></label>' +
                '<label><span>إلى</span><input type="date" class="as-input" dir="ltr" data-range-to></label></div>' +
                '<button type="button" class="as-btn as-btn--primary as-btn--sm as-range__apply" data-range-apply>تطبيق</button></div></div>';
        }
        function rangeText() {
            if (!st.range) return st.e.range.label + ': كل الوقت';
            if (st.range.preset) return PRESETS.filter(function (p) { return p[0] === st.range.preset; })[0][1];
            return (st.range.from || '…') + ' ← ' + (st.range.to || '…');
        }
        function syncRange() {
            var b = el.filters.querySelector('.as-range__btn');
            if (!b) return;
            b.querySelector('[data-range-label]').textContent = rangeText();
            b.setAttribute('aria-pressed', st.range ? 'true' : 'false');
            el.filters.querySelectorAll('[data-range]').forEach(function (x) { x.classList.toggle('is-on', !!(st.range && st.range.preset === x.dataset.range) || (!st.range && x.dataset.range === 'all')); });
        }
        function moreCount() {
            var n = (st.e.filters || []).filter(function (f) { return f.more && st.filters[f.key]; }).length;
            var all = (st.e.filters || []).filter(function (f) { return st.filters[f.key]; }).length;
            var b = el.filters.querySelector('[data-more-n]'), a = el.filters.querySelector('[data-all-n]');
            if (b) { b.hidden = !n; b.textContent = n; }
            if (a) { a.hidden = !all; a.textContent = all; }
            // the same filter can sit in the bar and in the panel: keep both in step
            root.querySelectorAll('[data-filter]').forEach(function (x) { x.value = st.filters[x.dataset.filter] || ''; });
        }
        function statusGroup(id) { return st.e.statuses.filter(function (s) { return s.id === id; })[0]; }

        /* ---------- per-entity chrome ---------- */
        function setupEntity() {
            var e = st.e;
            // only the lists of the current department are tabs; a department with one list shows none
            var mates = 0;
            el.tabs.querySelectorAll('.as-rectab').forEach(function (t) {
                var same = byId[t.dataset.id].dept === e.dept;
                t.hidden = !same;
                if (same) mates++;
            });
            el.tabs.hidden = mates < 2;
            el.tabs.querySelectorAll('.as-rectab').forEach(function (t) {
                var on = t.dataset.id === e.id;
                t.setAttribute('aria-selected', on ? 'true' : 'false');
                t.classList.toggle('is-active', on);
                if (on && t.scrollIntoView && el.tabs.scrollWidth > el.tabs.clientWidth) t.scrollIntoView({ block: 'nearest', inline: 'center' });
            });
            tabEdge();
            el.title.textContent = e.title;
            el.desc.textContent = e.desc;
            el.newBtn.querySelector('span').textContent = e.create.label;
            el.newBtn.setAttribute('href', e.create.href || '#');
            if (e.create.route) el.newBtn.dataset.route = e.create.route; else delete el.newBtn.dataset.route;
            el.q.value = '';
            el.q.placeholder = e.searchHint;
            // topbar + tab title follow the entity
            var h1 = document.querySelector('.as-topbar h1');
            if (h1) h1.textContent = e.title;
            var crumbs = document.querySelector('.as-crumbs');
            if (crumbs) crumbs.innerHTML = '<li>' + esc(e.dept) + '</li><li>' + esc(e.title) + '</li>';
            document.title = e.title + ' | أسس الإنجاز للاستقدام';

            // period, main filters (selects), flags (toggle buttons), then «فلاتر أخرى»
            var main = (e.filters || []).filter(function (f) { return !f.more; }), more = (e.filters || []).filter(function (f) { return f.more; });
            el.filters.innerHTML = (e.range ? rangeHtml() : '') + main.map(function (f) { return selectHtml(f); }).join('') + (e.flags || []).map(function (f) {
                return '<button type="button" class="as-toggle" data-flag="' + f.key + '" aria-pressed="' + (st.flags[f.key] ? 'true' : 'false') + '">' +
                    '<i class="fa-solid ' + f.icon + '" aria-hidden="true"></i>' + esc(f.label) + '</button>';
            }).join('') + ((e.filters || []).length ? '<button type="button" class="as-toggle as-toggle--more' + (more.length ? '' : ' is-phone') + '" data-more-toggle aria-expanded="false" aria-controls="as-rec-more">' +
                '<i class="fa-solid fa-sliders" aria-hidden="true"></i><span class="as-on-wide">فلاتر أخرى</span><span class="as-on-phone">الفلاتر</span>' +
                '<span class="as-toggle__n as-num as-on-wide" data-more-n hidden></span><span class="as-toggle__n as-num as-on-phone" data-all-n hidden></span></button>' : '');
            // the panel holds the «more» filters; on a phone it also holds the main ones (the bar shows only search + this button)
            el.more.innerHTML = (e.filters || []).length ? '<div class="as-rec__moregrid">' + main.concat(more).map(function (f) {
                return '<label class="as-f' + (f.more ? '' : ' as-on-phone') + '"><span class="as-f__label">' + esc(f.label) + '</span>' + selectHtml(f, true) + '</label>';
            }).join('') + '</div><div class="as-rec__moreacts"><button type="button" class="as-btn as-btn--ghost as-btn--sm" data-more-clear>مسح الفلاتر</button></div>' : '';
            el.more.hidden = true;
            moreCount();

            el.view.hidden = !e.card;
            if (!e.card) st.view = 'table';
            el.bulkActs.innerHTML = (e.bulk || []).map(function (b) {
                return '<button type="button" class="as-btn as-btn--sm as-btn--secondary" data-bulk="' + esc(b.label) + '"><i class="fa-solid ' + b.icon + '"></i>' + esc(b.label) + '</button>';
            }).join('');
            renderColsMenu();
            setSegs();
            syncRange();
        }
        function setSegs() {
            el.density.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.density === st.density ? 'true' : 'false'); });
            el.view.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.view === st.view ? 'true' : 'false'); });
            el.table.classList.toggle('is-compact', st.density === 'compact');
            el.density.hidden = st.view === 'cards';
        }
        function renderColsMenu() {
            el.cols.innerHTML = '<p class="as-dd__head">الأعمدة الظاهرة</p>' + st.e.columns.map(function (c) {
                if (c.fixed) return '';
                return '<label class="as-check"><input type="checkbox" data-col="' + c.key + '"' + (st.hidden.indexOf(c.key) < 0 ? ' checked' : '') + '><span>' + esc(c.label) + '</span></label>';
            }).join('') + '<div class="as-dd__sep"></div><button type="button" data-cols-reset><i class="fa-solid fa-rotate-left"></i>الأعمدة الافتراضية</button>';
        }

        /* ---------- load ---------- */
        function query() {
            var g = statusGroup(st.status);
            return {
                status: g && g.ids ? 'all' : st.status, statusIn: g && g.ids ? g.ids : null, q: st.q, filters: st.filters, flags: st.flags,
                range: resolveRange(st.range), sort: st.sort, page: st.page, size: st.size
            };
        }
        function load() {
            var id = ++reqId;
            root.classList.add('is-loading');
            R.source(st.e, query()).then(function (r) {
                if (id !== reqId) return;           // a newer request is on its way
                res = r;
                var pages = Math.max(1, Math.ceil(r.total / st.size));
                if (st.page > pages) { st.page = pages; return load(); }
                root.classList.remove('is-loading');
                render();
            });
        }

        /* ---------- render ---------- */
        function render() {
            renderChips();
            renderPills();
            if (st.view === 'cards') renderCards(); else renderTable();
            var none = !res.rows.length;
            el.empty.hidden = !none;
            el.table.hidden = none || st.view === 'cards';
            el.cards.hidden = none || st.view !== 'cards';
            renderFoot();
            renderBulk();
            if (openId) {   // keep the drawer on the same record if it is still on this page
                var row = findRow(openId);
                if (row) fillDrawer(row); else closeDrawer();
            }
        }
        function renderChips() {
            var c = res.counts || {};
            function count(s) { return s.ids ? s.ids.reduce(function (a, id) { return a + (c[id] || 0); }, 0) : c[s.id] || 0; }
            function chip(s) {
                var n = count(s), on = st.status === s.id;
                return '<button type="button" class="as-chip' + (on ? ' is-on' : '') + (s.tone ? ' as-chip--' + s.tone : '') + (s.ids ? ' as-chip--group' : '') + '" data-status="' + s.id + '" aria-pressed="' + on + '"' + (!n && !on ? ' data-zero' : '') + '>' +
                    (s.id !== 'all' && !s.ids ? '<i class="as-chip__dot" aria-hidden="true"></i>' : '') + esc(s.label) + '<span class="as-num">' + fmt.format(n) + '</span></button>';
            }
            var main = st.e.statuses.filter(function (s) { return !s.more && !s.hidden; });
            var groups = main.filter(function (s) { return s.ids; }), singles = main.filter(function (s) { return !s.ids; });
            var more = st.e.statuses.filter(function (s) { return s.more; });
            var cur = more.filter(function (s) { return s.id === st.status; })[0];
            var moreHtml = more.length ? '<div class="as-dd as-chipmore"><button type="button" class="as-chip' + (cur ? ' is-on' : '') + '" data-as-dd aria-expanded="false" aria-haspopup="true">' +
                (cur ? esc(cur.label) + '<span class="as-num">' + fmt.format(count(cur)) + '</span>' : 'المزيد<span class="as-num">' + fmt.format(more.reduce(function (a, s) { return a + count(s); }, 0)) + '</span>') +
                '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button><div class="as-dd__menu">' +
                more.map(function (s) {
                    return '<button type="button" data-status="' + s.id + '"' + (s.id === st.status ? ' class="is-on"' : '') + '><i class="as-chip__dot as-chip--' + (s.tone || 'neutral') + '" aria-hidden="true"></i>' + esc(s.label) + '<span class="as-num as-dd__n">' + fmt.format(count(s)) + '</span></button>';
                }).join('') + '</div></div>' : '';
            // «الكل» and the groups first, a thin divider, then each stage, then «المزيد»
            el.chips.innerHTML = chip({ id: 'all', label: 'الكل', tone: '' }) + groups.map(chip).join('') +
                (singles.length ? '<span class="as-chips__sep" aria-hidden="true"></span>' : '') + singles.map(chip).join('') + moreHtml;
        }
        function renderPills() {
            var e = st.e, pills = [];
            if (st.q) pills.push(['q', '', 'بحث: «' + esc(st.q) + '»']);
            if (st.range) pills.push(['range', '', esc(e.range.label) + ': ' + esc(rangeText())]);
            (e.filters || []).forEach(function (f) {
                var v = st.filters[f.key];
                if (!v) return;
                var o = f.options.filter(function (x) { return x[0] === v; })[0];
                pills.push(['filter', f.key, esc(f.label) + ': ' + esc(o ? o[1] : v)]);
            });
            (e.flags || []).forEach(function (f) { if (st.flags[f.key]) pills.push(['flag', f.key, esc(f.label)]); });
            el.pills.hidden = !pills.length;
            el.pills.innerHTML = pills.map(function (p) {
                return '<button type="button" class="as-pill" data-pill="' + p[0] + '" data-key="' + p[1] + '" aria-label="إزالة ' + p[2].replace(/"/g, '') + '">' + p[2] + '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>';
            }).join('') + (pills.length > 1 ? '<button type="button" class="as-pill as-pill--clear" data-pill="all">مسح الكل</button>' : '') +
                '<span class="as-pills__n"><span class="as-num">' + fmt.format(res.total) + '</span> نتيجة</span>';
        }
        function renderTable() {
            var cs = cols();
            var allOn = res.rows.length && res.rows.every(function (r) { return st.sel[r.id]; });
            var someOn = res.rows.some(function (r) { return st.sel[r.id]; });
            var head = '<tr><th class="as-rtable__sel"><input type="checkbox" class="as-cb" data-selall aria-label="تحديد كل الصفوف في الصفحة"' + (allOn ? ' checked' : '') + '></th>' +
                cs.map(function (c) {
                    var cls = (c.num ? 'is-num ' : '') + (c.w ? '' : '');
                    var style = c.w ? ' style="width:' + c.w + '"' : '';
                    if (!c.sort) return '<th class="' + cls + '"' + style + '>' + esc(c.label) + '</th>';
                    var on = st.sort && st.sort.key === c.sort, dir = on ? st.sort.dir : '';
                    return '<th class="' + cls + '"' + style + ' aria-sort="' + (on ? (dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' +
                        '<button type="button" class="as-sort' + (on ? ' is-on' : '') + '" data-sort="' + c.sort + '">' + esc(c.label) +
                        '<i class="fa-solid ' + (on ? (dir === 'asc' ? 'fa-arrow-up-short-wide' : 'fa-arrow-down-wide-short') : 'fa-sort') + '" aria-hidden="true"></i></button></th>';
                }).join('') + '<th class="as-rtable__act"><span class="as-sr">إجراءات</span></th></tr>';
            el.table.querySelector('thead').innerHTML = head;
            var sa = el.table.querySelector('[data-selall]');
            if (sa) sa.indeterminate = !allOn && someOn;
            el.table.querySelector('tbody').innerHTML = res.rows.map(function (r) {
                var on = !!st.sel[r.id];
                return '<tr data-id="' + esc(r.id) + '" tabindex="0" class="' + (on ? 'is-sel ' : '') + (r.id === openId ? 'is-open ' : '') + (r._tone ? 'is-' + r._tone : '') + '">' +
                    '<td class="as-rtable__sel"><input type="checkbox" class="as-cb" data-sel aria-label="تحديد"' + (on ? ' checked' : '') + '></td>' +
                    cs.map(function (c) {
                        return '<td' + (c.num ? ' class="is-num"' : c.primary ? ' class="is-primary"' : '') + ' data-label="' + esc(c.label) + '">' + c.render(r) + '</td>';
                    }).join('') +
                    '<td class="as-rtable__act"><button type="button" class="as-iconbtn as-iconbtn--sm" data-rowmenu aria-label="إجراءات السجل"><i class="fa-solid fa-ellipsis-vertical"></i></button></td></tr>';
            }).join('');
        }
        function renderCards() {
            el.cards.innerHTML = res.rows.map(function (r) {
                return '<article class="as-rcard' + (r.id === openId ? ' is-open' : '') + '" data-id="' + esc(r.id) + '" tabindex="0">' + st.e.card(r) + '</article>';
            }).join('');
        }
        function renderFoot() {
            var from = res.total ? (st.page - 1) * st.size + 1 : 0, to = Math.min(res.total, st.page * st.size);
            el.range.innerHTML = res.total ? 'عرض <span class="as-num">' + fmt.format(from) + '–' + fmt.format(to) + '</span> من <span class="as-num">' + fmt.format(res.total) + '</span>' : 'لا توجد سجلات';
            el.size.value = String(st.size);
            var pages = Math.max(1, Math.ceil(res.total / st.size)), p = st.page, list = [];
            for (var i = 1; i <= pages; i++) {
                if (i === 1 || i === pages || Math.abs(i - p) <= 1) list.push(i);
                else if (list[list.length - 1] !== '…') list.push('…');
            }
            el.pager.innerHTML = '<button type="button" class="as-pg" data-page="' + (p - 1) + '"' + (p <= 1 ? ' disabled' : '') + ' aria-label="الصفحة السابقة"><i class="fa-solid fa-chevron-right"></i></button>' +
                list.map(function (x) {
                    return x === '…' ? '<span class="as-pg as-pg--gap">…</span>' :
                        '<button type="button" class="as-pg as-num' + (x === p ? ' is-on' : '') + '" data-page="' + x + '"' + (x === p ? ' aria-current="page"' : '') + '>' + x + '</button>';
                }).join('') +
                '<button type="button" class="as-pg" data-page="' + (p + 1) + '"' + (p >= pages ? ' disabled' : '') + ' aria-label="الصفحة التالية"><i class="fa-solid fa-chevron-left"></i></button>';
        }
        function selCount() { return Object.keys(st.sel).length; }
        function renderBulk() {
            var n = selCount();
            el.bulk.hidden = !n;
            el.selCount.textContent = fmt.format(n);
        }
        function findRow(id) { return res.rows.filter(function (r) { return String(r.id) === String(id); })[0]; }

        /* ---------- drawer ---------- */
        var lastFocus = null;
        function openDrawer(id) {
            var row = findRow(id);
            if (!row) return;
            if (!openId) lastFocus = document.activeElement;
            openId = row.id;
            fillDrawer(row);
            drawer.hidden = false;
            requestAnimationFrame(function () { document.body.classList.add('as-drawer-open'); });
            markOpen();
            drawer.querySelector('[data-drawer-close]').focus();
        }
        function markOpen() {
            root.querySelectorAll('[data-id]').forEach(function (n) { n.classList.toggle('is-open', n.dataset.id === String(openId)); });
        }
        function fillDrawer(row) {
            var e = st.e, i = res.rows.indexOf(row);
            drawer.querySelector('[data-drawer-eyebrow]').textContent = e.one;
            drawer.querySelector('[data-drawer-title]').innerHTML = e.drawerTitle(row);
            drawer.querySelector('[data-drawer-body]').innerHTML = e.detail(row);
            drawer.querySelector('[data-drawer-pos]').innerHTML = '<span class="as-num">' + (i + 1) + '</span> من <span class="as-num">' + res.rows.length + '</span>';
            drawer.querySelector('[data-drawer-prev]').disabled = i <= 0;
            drawer.querySelector('[data-drawer-next]').disabled = i >= res.rows.length - 1;
            drawer.querySelector('[data-drawer-foot]').innerHTML = (e.actions(row) || []).map(function (a, k) {
                return '<button type="button" class="as-btn ' + (k === 0 ? 'as-btn--primary' : 'as-btn--secondary') + '" data-act="' + esc(a.label) + '"><i class="fa-solid ' + a.icon + '"></i>' + esc(a.label) + '</button>';
            }).join('');
            drawer.querySelector('[data-drawer-body]').scrollTop = 0;
        }
        function closeDrawer(silent) {
            if (!drawer || drawer.hidden) { openId = null; return; }
            openId = null;
            document.body.classList.remove('as-drawer-open');
            setTimeout(function () { if (!openId) drawer.hidden = true; }, silent ? 0 : 200);
            markOpen();
            if (!silent && lastFocus && lastFocus.focus) lastFocus.focus();
        }
        function stepDrawer(d) {
            var i = res.rows.indexOf(findRow(openId)) + d;
            if (res.rows[i]) { openId = res.rows[i].id; fillDrawer(res.rows[i]); markOpen(); }
        }

        /* ---------- floating row menu (outside the scroll box, so it is never clipped) ---------- */
        var menu = document.createElement('div');
        menu.className = 'as-dd__menu as-rowmenu';
        menu.setAttribute('role', 'menu');
        document.body.appendChild(menu);
        var menuRow = null;
        function openMenu(btn, row) {
            menuRow = row;
            var acts = [{ label: 'عرض التفاصيل', icon: 'fa-eye', open: true }].concat(st.e.actions(row) || [], st.e.more || []);
            menu.innerHTML = acts.map(function (a) {
                return (a.sep ? '<div class="as-dd__sep"></div>' : '') + '<button type="button" role="menuitem"' + (a.open ? ' data-menu-open' : ' data-act="' + esc(a.label) + '"') + (a.danger ? ' class="is-danger"' : '') + '><i class="fa-solid ' + a.icon + '"></i>' + esc(a.label) + '</button>';
            }).join('');
            menu.style.display = 'block';
            var b = btn.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
            var top = b.bottom + 6 + mh > window.innerHeight ? b.top - mh - 6 : b.bottom + 6;
            var left = document.documentElement.dir === 'rtl' ? b.left : b.right - mw;
            menu.style.top = Math.max(8, top) + 'px';
            menu.style.left = Math.max(8, Math.min(left, window.innerWidth - mw - 8)) + 'px';
            menu.querySelector('button').focus();
        }
        function closeMenu() { menu.style.display = 'none'; menuRow = null; }

        function act(label, row) {
            var e = st.e;
            if (e.onAction && e.onAction(label, row) === false) return;
            toast(label + (row ? ' — ' + e.one + ' ' + row.ref : '') + ' (في النظام)');
        }

        /* ---------- events ---------- */
        var qTimer;
        el.q.addEventListener('input', function () {
            clearTimeout(qTimer);
            qTimer = setTimeout(function () { st.q = el.q.value.trim(); st.page = 1; load(); }, 200);
        });
        el.q.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && el.q.value) { el.q.value = ''; st.q = ''; st.page = 1; load(); } });
        el.filters.addEventListener('change', function (ev) {
            var s = ev.target.closest('[data-filter]');
            if (!s) return;
            if (s.value) st.filters[s.dataset.filter] = s.value; else delete st.filters[s.dataset.filter];
            moreCount(); st.page = 1; load();
        });
        el.more.addEventListener('change', function (ev) {
            var s = ev.target.closest('[data-filter]');
            if (!s) return;
            if (s.value) st.filters[s.dataset.filter] = s.value; else delete st.filters[s.dataset.filter];
            moreCount(); st.page = 1; load();
        });
        el.size.addEventListener('change', function () { st.size = +el.size.value; st.page = 1; savePref(); load(); });
        el.cols.addEventListener('change', function (ev) {
            var c = ev.target.closest('[data-col]');
            if (!c) return;
            var k = c.dataset.col, i = st.hidden.indexOf(k);
            if (c.checked && i >= 0) st.hidden.splice(i, 1);
            if (!c.checked && i < 0) st.hidden.push(k);
            savePref(); renderTable();
        });

        root.addEventListener('click', function (ev) {
            var t = ev.target, x;
            if ((x = t.closest('.as-rectab'))) {
                if (ev.metaKey || ev.ctrlKey) return;
                ev.preventDefault();
                if (x.dataset.id === st.e.id && location.hash.replace('#', '') === x.dataset.id) return;
                location.hash = x.dataset.id;
                return;
            }
            if ((x = t.closest('[data-status]'))) { st.status = x.dataset.status; st.page = 1; closeDd(x); load(); return; }
            if ((x = t.closest('[data-range]'))) {
                st.range = x.dataset.range === 'all' ? null : { preset: x.dataset.range };
                closeDd(x); syncRange(); st.page = 1; load(); return;
            }
            if ((x = t.closest('[data-range-apply]'))) {
                var m = x.closest('.as-range__menu'), f = m.querySelector('[data-range-from]').value, to = m.querySelector('[data-range-to]').value;
                if (f && to && f > to) { var sw = f; f = to; to = sw; }
                st.range = f || to ? { from: f, to: to } : null;
                closeDd(x); syncRange(); st.page = 1; load(); return;
            }
            if ((x = t.closest('[data-more-toggle]'))) {
                el.more.hidden = !el.more.hidden;
                x.setAttribute('aria-expanded', el.more.hidden ? 'false' : 'true');
                x.classList.toggle('is-open', !el.more.hidden);
                if (!el.more.hidden) { var first = el.more.querySelector('select'); if (first) first.focus(); }
                return;
            }
            if ((x = t.closest('[data-more-clear]'))) {
                var phone = window.matchMedia('(max-width: 767px)').matches;
                (st.e.filters || []).forEach(function (f) { if (f.more || phone) delete st.filters[f.key]; });
                el.more.querySelectorAll('[data-filter]').forEach(function (s) { s.value = ''; });
                moreCount(); st.page = 1; load(); return;
            }
            if ((x = t.closest('[data-flag]'))) {
                var k = x.dataset.flag;
                if (st.flags[k]) delete st.flags[k]; else st.flags[k] = true;
                x.setAttribute('aria-pressed', st.flags[k] ? 'true' : 'false');
                st.page = 1; load(); return;
            }
            if ((x = t.closest('[data-pill]'))) {
                var kind = x.dataset.pill, key = x.dataset.key;
                if (kind === 'q' || kind === 'all') { st.q = ''; el.q.value = ''; }
                if (kind === 'filter' || kind === 'all') {
                    if (kind === 'all') st.filters = {}; else delete st.filters[key];
                }
                if (kind === 'flag' || kind === 'all') { if (kind === 'all') st.flags = {}; else delete st.flags[key]; }
                if (kind === 'range' || kind === 'all') st.range = null;
                syncRange(); moreCount(); el.more.querySelectorAll('[data-filter]').forEach(function (s) { s.value = st.filters[s.dataset.filter] || ''; });
                el.filters.querySelectorAll('[data-filter]').forEach(function (s) { s.value = st.filters[s.dataset.filter] || ''; });
                el.filters.querySelectorAll('[data-flag]').forEach(function (b) { b.setAttribute('aria-pressed', st.flags[b.dataset.flag] ? 'true' : 'false'); });
                st.page = 1; load(); return;
            }
            if (t.closest('[data-rec-reset]')) {
                st.q = ''; el.q.value = ''; st.filters = {}; st.flags = {}; st.range = null; st.status = st.e.defaultStatus || 'all'; st.page = 1;
                setupEntity(); load(); return;
            }
            if ((x = t.closest('[data-cols-reset]'))) {
                st.hidden = st.e.columns.filter(function (c) { return c.hidden; }).map(function (c) { return c.key; });
                savePref(); renderColsMenu(); renderTable(); return;
            }
            if ((x = t.closest('[data-density]'))) { st.density = x.dataset.density; savePref(); setSegs(); return; }
            if ((x = t.closest('[data-view]'))) { st.view = x.dataset.view; savePref(); setSegs(); render(); return; }
            if ((x = t.closest('[data-sort]'))) {
                var sk = x.dataset.sort;
                st.sort = st.sort && st.sort.key === sk ? { key: sk, dir: st.sort.dir === 'asc' ? 'desc' : 'asc' } : { key: sk, dir: 'desc' };
                st.page = 1; load(); return;
            }
            if ((x = t.closest('[data-page]'))) { if (!x.disabled) { st.page = +x.dataset.page; load(); el.scroll.scrollTop = 0; } return; }
            if ((x = t.closest('[data-export]'))) {
                if (x.dataset.export === 'print') { window.print(); return; }
                toast('تصدير ' + fmt.format(res.total) + ' سجل من «' + st.e.title + '» إلى ' + x.dataset.export + ' (في النظام)');
                return;
            }
            if ((x = t.closest('[data-bulk]'))) { toast(x.dataset.bulk + ' — ' + fmt.format(selCount()) + ' سجل (في النظام)'); return; }
            if (t.closest('[data-rec-clearsel]')) { st.sel = {}; render(); return; }
            if (t.closest('[data-selall]')) {
                var on = t.checked;
                res.rows.forEach(function (r) { if (on) st.sel[r.id] = 1; else delete st.sel[r.id]; });
                renderTable(); renderBulk(); return;
            }
            if (t.closest('[data-sel]')) {
                var tr = t.closest('tr'), id = tr.dataset.id;
                if (t.checked) st.sel[id] = 1; else delete st.sel[id];
                tr.classList.toggle('is-sel', t.checked);
                var all = el.table.querySelector('[data-selall]');
                var ons = res.rows.filter(function (r) { return st.sel[r.id]; }).length;
                all.checked = ons === res.rows.length; all.indeterminate = ons > 0 && ons < res.rows.length;
                renderBulk(); return;
            }
            if ((x = t.closest('[data-rowmenu]'))) {
                ev.stopPropagation();
                var r0 = findRow(x.closest('[data-id]').dataset.id);
                if (menu.style.display === 'block' && menuRow === r0) closeMenu(); else openMenu(x, r0);
                return;
            }
            if ((x = t.closest('[data-rec-act]'))) {
                act(x.dataset.recAct, findRow(x.closest('[data-id]').dataset.id)); return;
            }
            if (t.closest('a, button, input, select, label')) return;
            if ((x = t.closest('[data-id]'))) openDrawer(x.dataset.id);
        });
        root.addEventListener('keydown', function (ev) {
            if (ev.key !== 'Enter' && ev.key !== ' ') return;
            var x = ev.target;
            if (x.matches && x.matches('tr[data-id], .as-rcard[data-id]')) { ev.preventDefault(); openDrawer(x.dataset.id); }
        });

        document.addEventListener('click', function (ev) {
            var t = ev.target;
            if (menu.contains(t)) {
                var b = t.closest('button');
                if (!b) return;
                var row = menuRow;
                closeMenu();
                if (b.hasAttribute('data-menu-open')) openDrawer(row.id); else act(b.dataset.act, row);
                return;
            }
            if (!t.closest('[data-rowmenu]')) closeMenu();
        });
        window.addEventListener('resize', function () { closeMenu(); tabEdge(); });
        el.tabs.addEventListener('scroll', tabEdge, { passive: true });
        el.scroll.addEventListener('scroll', closeMenu, { passive: true });

        if (drawer) {
            drawer.addEventListener('click', function (ev) {
                var t = ev.target, x;
                if (t.closest('[data-drawer-close]') || t === drawer.querySelector('.as-drawer__veil')) { closeDrawer(); return; }
                if (t.closest('[data-drawer-prev]')) { stepDrawer(-1); return; }
                if (t.closest('[data-drawer-next]')) { stepDrawer(1); return; }
                if ((x = t.closest('[data-act]'))) act(x.dataset.act, findRow(openId));
            });
        }
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape') {
                if (menu.style.display === 'block') { closeMenu(); return; }
                if (openId) closeDrawer();
            }
            if (openId && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && !/input|select|textarea/i.test(ev.target.tagName)) {
                ev.preventDefault(); stepDrawer(ev.key === 'ArrowDown' ? 1 : -1);
            }
        });

        window.addEventListener('hashchange', fromHash);
        fromHash();
    };
})();
