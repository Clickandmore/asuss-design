(() => {
    const root = document.getElementById('staff-schedule');
    if (!root) return;
    const data = JSON.parse(document.getElementById('hs-data').textContent);
    const can = { edit: root.dataset.canEdit === '1', price: root.dataset.canPrice === '1' };
    const $ = id => document.getElementById(id);

    // تنبيهات SweetAlert بهوية الوحدة، مع رجوع لتنبيهات المتصفح.
    function swal(options) {
        if (window.Swal) return Swal.fire(Object.assign({ confirmButtonText: 'حسنًا' }, options, { customClass: Object.assign({ popup: 'om-swal' }, options.customClass || {}) }));
        if (options.showCancelButton) return Promise.resolve({ isConfirmed: window.confirm(options.text || options.title) });
        window.alert(options.text || options.title); return Promise.resolve({ isConfirmed: true });
    }
    const errorText = (result, fallback) => Object.values(result.errors || {}).flat().join('\n') || result.message || fallback;

    /* ——— الفلاتر والتاريخ والتنقل ——— */
    document.querySelectorAll('#hs-filters select').forEach(el => el.addEventListener('change', () => el.form.submit()));
    const dateInput = $('hs-date');
    dateInput.addEventListener('change', () => { if (!dateInput.value) return; const url = new URL(location.href); url.searchParams.set('date', dateInput.value); location.href = url; });
    dateInput.closest('label').addEventListener('click', () => { try { dateInput.showPicker(); } catch (e) {} });
    const jump = $('hs-jump'), wrap = $('hs-grid-wrap');
    jump.addEventListener('change', () => {
        const head = $('hs-head-' + jump.value); if (!head) return;
        document.querySelectorAll('.hs-col-head.is-target').forEach(h => h.classList.remove('is-target'));
        head.classList.add('is-target');
        head.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
    const needingToggle = $('hs-needing-toggle'), needing = $('hs-needing');
    const toggleNeeding = () => { if (needing.querySelector('li')) needing.hidden = !needing.hidden; };
    needingToggle.addEventListener('click', toggleNeeding);
    needingToggle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNeeding(); } });
    // عند الفتح نمرّر إلى مؤشر الوقت الحالي أو أول زيارة في اليوم.
    if (wrap) {
        const anchor = wrap.querySelector('.hs-now') || [...wrap.querySelectorAll('.hs-block')].sort((a, b) => a.offsetTop - b.offsetTop)[0];
        if (anchor) wrap.scrollTop = Math.max(0, anchor.offsetTop - 80);
    }

    /* ——— نسخ التفاصيل ——— */
    const fieldValue = (key, v) => ({
        customer: [v.customer, v.phone].filter(Boolean).join(' · '),
        visit_date: v.date ? v.date + ' ' + v.start + ' - ' + v.end + ' (' + v.hours + ' ساعات)' : 'لم يحدد',
        order_number: '#' + v.order_number,
        visit: v.number + ' (مرجع #' + v.id + ')',
        address: v.address, location: v.location, service: v.service, package: v.package,
        workers: v.workers.map(w => w.name).join('، ') || 'غير مخصص',
        payment_method: v.payment_method, price: 'SAR ' + v.price, payment_status: v.payment_status,
    })[key] || '—';
    function copyText(v, fields) {
        const lines = [];
        fields.filter(f => f.enabled).forEach(f => {
            lines.push((f.label ? data.labels[f.key] + ': ' : '') + fieldValue(f.key, v));
            if (f.blank) lines.push('');
        });
        return lines.join('\n').trim();
    }
    async function copyVisit(v) {
        const text = copyText(v, data.settings.copy_fields);
        try { await navigator.clipboard.writeText(text); }
        catch (e) { const area = document.createElement('textarea'); area.value = text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); }
        swal({ icon: 'success', title: 'تم نسخ التفاصيل', timer: 1300, showConfirmButton: false });
    }

    /* ——— مودال إجراءات الزيارة ——— */
    const modal = $('hs-visit-modal'), form = $('hs-visit-form'), error = $('hs-visit-error'), submit = $('hs-visit-submit');
    let visit = null, contextWorker = null, action = '', busy = false, token = 0;

    function renderSummary(v) {
        // القيم الرقمية (الهاتف والتاريخ والمبالغ) تُعرض يسارًا-ليمين حتى لا ينقلب ترتيبها داخل الصفحة العربية.
        const rows = [['العميل', v.customer], ['الهاتف', v.phone, true], ['رقم الزيارة', 'زيارة ' + v.number + ' · مرجع #' + v.id], ['تاريخ الزيارة', v.date ? v.date + '  ' + v.start + ' – ' + v.end : 'لم يحدد', !!v.date],
            ['العاملات', (v.workers.map(w => w.name).join('، ') || 'غير مخصص') + ' (' + v.workers.length + '/' + v.required + ')'], ['مدة الزيارة', v.hours + ' ساعات'],
            ['المبلغ المدفوع', 'SAR ' + v.paid, true], ['حالة السداد', v.payment_status], ['حالة التشغيل', v.status], ['نوع الطلب', v.recurring ? 'متكرر' : 'لمرة واحدة']];
        const box = $('hs-summary'); box.replaceChildren();
        rows.forEach(([label, value, ltr]) => { const row = document.createElement('div'), s = document.createElement('span'), b = document.createElement('b'); s.textContent = label; b.textContent = value || '—'; if (ltr) b.dir = 'ltr'; row.append(s, b); box.appendChild(row); });
    }

    function setFields() {
        form.querySelectorAll('[data-fields]').forEach(group => {
            const active = group.dataset.fields.split(' ').includes(action);
            group.hidden = !active;
            group.querySelectorAll('input,select,textarea').forEach(el => { el.disabled = !active; });
        });
        error.hidden = true;
    }

    function step(name) {
        const tile = modal.querySelector('[data-pick="' + action + '"]'), showForm = name === 'form' && !!tile;
        modal.dataset.opStep = showForm ? 'form' : 'pick';
        $('hs-visit-title').textContent = showForm ? tile.dataset.label : 'إجراءات الزيارة';
        $('hs-visit-icon').className = 'fa ' + (showForm ? tile.dataset.icon : 'fa-calendar-day');
        setFields();
    }

    function selectOptions(select, workers, selected) {
        select.replaceChildren();
        workers.forEach(w => { const o = new Option(w.name, w.id); o.selected = String(w.id) === String(selected); select.add(o); });
    }

    async function loadAvailable() {
        const mine = ++token, v = visit;
        const response = await fetch(v.workers_url, { headers: { Accept: 'application/json' } });
        const result = await response.json();
        if (mine !== token) return null;
        if (!response.ok) throw new Error(errorText(result, 'تعذر تحميل العاملات المتاحات.'));
        return result;
    }

    async function prepare() {
        const v = visit;
        if (action === 'reschedule') $('hs-starts-at').value = v.starts_at || '';
        if (action === 'price') { $('hs-price-current').value = v.price; $('hs-price-new').value = ''; }
        if (action === 'unassign' || action === 'remove_worker') selectOptions($('hs-worker-select'), v.workers, contextWorker);
        if (action === 'reassign' || action === 'add_worker') {
            const list = $('hs-workers-list'), add = $('hs-add-select');
            list.innerHTML = '<span class="form-text">جارٍ التحقق من التوفر…</span>'; add.innerHTML = '<option value="">جارٍ التحميل…</option>';
            submit.disabled = true;
            try {
                const result = await loadAvailable(); if (!result) return;
                // المتاحات + المعيّنات حاليًا (قد لا تظهر المعيّنة ضمن المتاحات لأنها مشغولة بهذه الزيارة نفسها).
                const all = [...v.workers, ...result.workers.filter(w => !v.workers.some(x => String(x.id) === String(w.id)))];
                if (action === 'reassign') {
                    $('hs-workers-note').textContent = '(المطلوب ' + result.required + ')';
                    list.replaceChildren();
                    all.forEach(w => {
                        const label = document.createElement('label'), input = document.createElement('input');
                        input.type = 'checkbox'; input.name = 'worker_ids[]'; input.value = w.id;
                        input.checked = result.selected.map(String).includes(String(w.id)) && String(w.id) !== String(contextWorker);
                        label.append(input, document.createTextNode(' ' + w.name)); list.appendChild(label);
                    });
                    if (!all.length) list.innerHTML = '<span class="form-text">لا توجد عاملات متاحات في هذا الموعد.</span>';
                } else {
                    const free = result.workers.filter(w => !v.workers.some(x => String(x.id) === String(w.id)));
                    selectOptions(add, free, null);
                    if (!free.length) add.innerHTML = '<option value="">لا توجد عاملات متاحات في هذا الموعد</option>';
                }
            } catch (e) { error.textContent = e.message; error.hidden = false; }
            finally { submit.disabled = false; }
        }
    }

    function openVisit(id, worker, preset) {
        visit = data.visits[id]; if (!visit) return;
        contextWorker = worker || null; action = '';
        form.reset(); renderSummary(visit);
        $('hs-visit-sub').textContent = 'طلب #' + visit.order_number + ' · ' + (visit.recurring ? 'متكرر' : 'لمرة واحدة') + (visit.closed ? ' · زيارة مغلقة' : '');
        $('hs-order-link').href = visit.order_url;
        // إخفاء ما لا يسمح به الدور أو حالة الزيارة.
        modal.querySelectorAll('[data-pick]').forEach(tile => {
            const blocked = (tile.hasAttribute('data-edit') && (!can.edit || visit.closed)) || (tile.hasAttribute('data-price') && !can.price)
                || (tile.hasAttribute('data-needs-worker') && !visit.workers.length) || (tile.dataset.pick === 'remove_worker' && visit.required < 2);
            tile.hidden = blocked;
        });
        modal.querySelectorAll('.om-op-section').forEach(s => { s.hidden = ![...s.querySelectorAll('.om-op-tile')].some(t => !t.hidden); });
        const tile = preset && modal.querySelector('[data-pick="' + preset + '"]:not([hidden])');
        if (tile) { action = preset; step('form'); prepare(); } else step('pick');
        bootstrap.Modal.getOrCreateInstance(modal).show();
    }

    root.addEventListener('click', e => {
        const trigger = e.target.closest('[data-open-visit]'); if (!trigger) return;
        openVisit(trigger.dataset.openVisit, trigger.dataset.worker, trigger.dataset.openAction);
    });
    root.addEventListener('keydown', e => {
        const trigger = e.target.closest('.hs-block[data-open-visit]');
        if (trigger && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openVisit(trigger.dataset.openVisit, trigger.dataset.worker); }
    });
    modal.querySelectorAll('[data-pick]').forEach(tile => tile.addEventListener('click', () => {
        if (tile.dataset.pick === 'copy') { copyVisit(visit); return; }
        action = tile.dataset.pick; step('form'); prepare();
    }));
    $('hs-visit-back').addEventListener('click', () => { token++; action = ''; step('pick'); });

    async function send(url, body, method = 'POST') {
        const headers = { Accept: 'application/json', 'X-CSRF-TOKEN': root.dataset.csrf };
        if (!(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
        const response = await fetch(url, { method, headers, body });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(errorText(result, 'تعذر تنفيذ الإجراء'));
        return result;
    }

    function batchBody(name, extra) {
        const body = new FormData();
        body.append('batch_id', crypto.randomUUID()); body.append('action', name); body.append('visit_ids[]', visit.id);
        body.append('reason', $('hs-reason').value.trim());
        Object.entries(extra || {}).forEach(([k, v]) => Array.isArray(v) ? v.forEach(x => body.append(k + '[]', x)) : body.append(k, v));
        return body;
    }

    form.addEventListener('submit', async e => {
        e.preventDefault(); if (busy || !action) return;
        const reason = $('hs-reason').value.trim(), needsReason = action !== 'reschedule';
        const fail = message => { error.textContent = message; error.hidden = false; };
        if (needsReason && !reason) return fail('اكتب سبب التعديل.');
        let request;
        if (action === 'reschedule') {
            if (!$('hs-starts-at').value) return fail('اختر الموعد الجديد.');
            request = () => send(visit.schedule_url, { starts_at: $('hs-starts-at').value, expected_start_at: visit.starts_at }, 'PUT');
        } else if (action === 'reassign') {
            const ids = [...form.querySelectorAll('[name="worker_ids[]"]:checked')].map(i => i.value);
            if (!ids.length) return fail('اختر عاملة واحدة على الأقل.');
            request = () => send(root.dataset.batch, batchBody('assign_workers', { worker_ids: ids, expected_worker_ids: visit.workers.map(w => w.id) }));
        } else if (action === 'unassign') {
            request = () => send(root.dataset.batch, batchBody('unassign_worker', { worker_id: $('hs-worker-select').value }));
        } else if (action === 'price') {
            if ($('hs-price-new').value === '') return fail('أدخل السعر الجديد.');
            request = () => send(root.dataset.batch, batchBody('price', { price: $('hs-price-new').value }));
        } else if (action === 'cancel') {
            const ok = await swal({ icon: 'warning', title: 'إلغاء الزيارة؟', text: 'سيتم إلغاء زيارة ' + visit.customer + ' ولا يمكن التراجع عنه تلقائيًا.', showCancelButton: true, reverseButtons: true, focusCancel: true, confirmButtonText: 'نعم، ألغِ الزيارة', cancelButtonText: 'تراجع', customClass: { confirmButton: 'is-danger' } });
            if (!ok.isConfirmed) return;
            request = () => send(root.dataset.batch, batchBody('cancel_visit', { refund_method: $('hs-refund').value }));
        } else if (action === 'add_worker' || action === 'remove_worker') {
            const worker = action === 'add_worker' ? $('hs-add-select').value : $('hs-worker-select').value;
            if (!worker) return fail('اختر العاملة.');
            const body = new FormData();
            body.append('action', action); body.append('visit_ids[]', visit.id); body.append('worker_id', worker); body.append('reason', reason);
            request = () => send(visit.operations_url, body);
        }
        busy = true; submit.disabled = true; error.hidden = true;
        try {
            const result = await request();
            bootstrap.Modal.getOrCreateInstance(modal).hide();
            if (result.warning) await swal({ icon: 'warning', title: 'تنبيه', text: result.warning });
            else await swal({ icon: 'success', title: 'تم الحفظ', text: result.message || '', timer: 1400, showConfirmButton: false });
            location.reload();
        } catch (ex) { fail(ex.message); }
        finally { busy = false; submit.disabled = false; }
    });

    /* ——— إعدادات التقويم ——— */
    const settingsModal = $('hs-settings-modal');
    if (!settingsModal) return;
    const settingsForm = $('hs-settings-form'), list = $('hs-copy-list'), settingsError = $('hs-settings-error');
    const sample = Object.values(data.visits)[0] || { customer: 'محمد علي', phone: '+966 50 123 4567', date: '2026-06-03', start: '09:00', end: '17:00', hours: '8', order_number: 'HR-593475', number: 1, id: 1883091,
        address: 'الرياض، حي النرجس', location: 'https://www.google.com/maps?q=24.7,46.6', service: 'تنظيف منزلي', package: '6 مرات أسبوعيًا (شهر)', workers: [{ name: 'Ganesh Khatri' }], payment_method: 'تحويل بنكي', price: '133.33', payment_status: 'مدفوع' };

    function renderCopyList(fields) {
        list.replaceChildren();
        fields.forEach(field => {
            const li = document.createElement('li');
            li.draggable = true; li.dataset.key = field.key; li.classList.toggle('is-off', !field.enabled);
            li.innerHTML = '<i class="fa fa-grip-vertical hs-grip" aria-hidden="true"></i><span class="hs-copy-idx"></span><div class="hs-copy-text"><b></b><small></small></div>'
                + '<label><input type="checkbox" data-opt="label"> إظهار التسمية</label><label><input type="checkbox" data-opt="blank"> سطر فارغ</label>'
                + '<div class="form-check form-switch m-0"><input class="form-check-input" type="checkbox" role="switch" data-opt="enabled"></div>';
            li.querySelector('b').textContent = data.labels[field.key];
            li.querySelector('small').textContent = data.labels[field.key] + ': ' + fieldValue(field.key, sample);
            li.querySelector('[data-opt="label"]').checked = field.label;
            li.querySelector('[data-opt="blank"]').checked = field.blank;
            const toggle = li.querySelector('[data-opt="enabled"]'); toggle.checked = field.enabled; toggle.setAttribute('aria-label', 'تضمين ' + data.labels[field.key]);
            toggle.addEventListener('change', () => li.classList.toggle('is-off', !toggle.checked));
            list.appendChild(li);
        });
        renumber();
    }
    const renumber = () => list.querySelectorAll('li').forEach((li, i) => { li.querySelector('.hs-copy-idx').textContent = i + 1; });

    // السحب والإفلات لإعادة الترتيب.
    let dragged = null;
    list.addEventListener('dragstart', e => { dragged = e.target.closest('li'); if (dragged) { dragged.classList.add('is-dragging'); e.dataTransfer.effectAllowed = 'move'; } });
    list.addEventListener('dragend', () => { if (dragged) dragged.classList.remove('is-dragging'); list.querySelectorAll('.is-over').forEach(li => li.classList.remove('is-over')); dragged = null; renumber(); });
    list.addEventListener('dragover', e => {
        e.preventDefault();
        const over = e.target.closest('li'); if (!over || over === dragged || !dragged) return;
        list.querySelectorAll('.is-over').forEach(li => li.classList.remove('is-over')); over.classList.add('is-over');
        const box = over.getBoundingClientRect();
        over.parentNode.insertBefore(dragged, e.clientY > box.top + box.height / 2 ? over.nextSibling : over);
    });
    list.addEventListener('drop', e => e.preventDefault());

    settingsModal.querySelectorAll('[data-tab]').forEach(tab => tab.addEventListener('click', () => {
        settingsModal.querySelectorAll('[data-tab]').forEach(t => t.classList.toggle('active', t === tab));
        settingsModal.querySelectorAll('[data-tab-pane]').forEach(p => { p.hidden = p.dataset.tabPane !== tab.dataset.tab; });
    }));
    $('hs-open-settings').addEventListener('click', () => { renderCopyList(data.settings.copy_fields); settingsError.hidden = true; bootstrap.Modal.getOrCreateInstance(settingsModal).show(); });

    settingsForm.addEventListener('submit', async e => {
        e.preventDefault();
        const payload = {
            start_time: settingsForm.elements.start_time.value, end_time: settingsForm.elements.end_time.value, row_height: Number(settingsForm.elements.row_height.value),
            copy_fields: [...list.querySelectorAll('li')].map(li => ({ key: li.dataset.key, enabled: li.querySelector('[data-opt="enabled"]').checked, label: li.querySelector('[data-opt="label"]').checked, blank: li.querySelector('[data-opt="blank"]').checked })),
        };
        if (payload.end_time <= payload.start_time && payload.end_time !== '24:00') { settingsError.textContent = 'وقت الانتهاء يجب أن يكون بعد وقت البدء.'; settingsError.hidden = false; return; }
        $('hs-settings-save').disabled = true;
        try {
            await send(root.dataset.settings, payload, 'PUT');
            bootstrap.Modal.getOrCreateInstance(settingsModal).hide();
            await swal({ icon: 'success', title: 'تم حفظ إعدادات التقويم', timer: 1200, showConfirmButton: false });
            location.reload();
        } catch (ex) { settingsError.textContent = ex.message; settingsError.hidden = false; }
        finally { $('hs-settings-save').disabled = false; }
    });
})();
