(() => {
    const root=document.getElementById('visit-operations');if(!root)return;
    const form=document.getElementById('vl-batch-form'),action=form.elements.action,modal=document.getElementById('vl-modal');
    const error=document.getElementById('vl-error'),submit=document.getElementById('vl-submit');let busy=false,target=[],workerSnapshot=[],workerRequired=0,workersLoading=false,slotRequest=0;
    const boxes=[...root.querySelectorAll('[data-select-visit]')];
    const selected=()=>boxes.filter(b=>b.checked).map(b=>b.value);
    // تنبيهات SweetAlert بهوية الوحدة، مع رجوع لتنبيهات المتصفح إن لم تُحمَّل المكتبة.
    function swal(options){
        if(window.Swal)return Swal.fire(Object.assign({confirmButtonText:'حسنًا'},options,{customClass:Object.assign({popup:'om-swal'},options.customClass||{})}));
        if(options.showCancelButton)return Promise.resolve({isConfirmed:window.confirm(options.text||options.title)});
        window.alert(options.text||options.title);return Promise.resolve({isConfirmed:true});
    }
    const confirmAction=(title,text,danger)=>swal({icon:danger?'warning':'question',title,text,showCancelButton:true,reverseButtons:true,focusCancel:danger,confirmButtonText:'نعم، نفّذ',cancelButtonText:'تراجع',customClass:{confirmButton:danger?'is-danger':''}}).then(r=>r.isConfirmed);
    function refresh(){document.getElementById('vl-selected').textContent=selected().length;boxes.forEach(b=>b.closest('[data-visit-card]').classList.toggle('is-selected',b.checked));const all=document.getElementById('vl-select-all');all.checked=boxes.length>0&&selected().length===boxes.length;all.indeterminate=selected().length>0&&!all.checked;}
    boxes.forEach(b=>b.addEventListener('change',refresh));document.getElementById('vl-select-all').addEventListener('change',e=>{boxes.forEach(b=>b.checked=e.target.checked);refresh();});
    function fields(){root.querySelectorAll('[data-fields]').forEach(group=>{const active=group.dataset.fields===action.value;group.hidden=!active;group.querySelectorAll('input,select').forEach(input=>{input.disabled=!active||input.closest('[hidden]')!==null;input.required=active&&!['checkbox','file','hidden'].includes(input.type)&&!['new_date','shift_days','starts_at'].includes(input.name);});});error.hidden=true;}
    // خطوتان: شبكة بطاقات الإجراءات ثم حقول الإجراء المختار؛ العنوان والأيقونة يتبعان الاختيار.
    function blockedStartedAction(choice) {
        return ['cancel_visit','reschedule','start_time','duration','unassign_worker','unassign_workers','unassign_all','remove_worker','assign_workers','assign_all'].includes(choice)
            && boxes.some(box=>target.includes(box.value) && box.dataset.started==='1');
    }
    function collectibleCents(){
        const groups=new Map();
        boxes.filter(box=>target.includes(box.value)).forEach(box=>{
            const key=box.dataset.orderId, row=groups.get(key)||{amount:0,limit:Math.round(Number(box.dataset.orderRemaining)*100)};
            row.amount+=Math.round(Number(box.dataset.collectable)*100);groups.set(key,row);
        });
        return [...groups.values()].reduce((sum,row)=>sum+Math.min(row.amount,row.limit),0);
    }
    function step(name){
        modal.querySelectorAll('[data-pick-action]').forEach(tile=>{tile.hidden=blockedStartedAction(tile.dataset.pickAction)||(tile.dataset.pickAction==='collect'&&collectibleCents()<=0);tile.style.display=tile.hidden?'none':'';});
        const tile=modal.querySelector('[data-pick-action="'+action.value+'"]'),showForm=name==='form'&&!!tile;
        modal.dataset.opStep=showForm?'form':'pick';
        document.getElementById('vl-modal-title').textContent=showForm?tile.dataset.label:'الإجراءات';
        document.getElementById('vl-modal-sub').textContent=showForm?'أكمل البيانات ثم نفّذ':'اختر الإجراء لتطبيقه على الزيارات المحددة';
        document.getElementById('vl-modal-icon').className='fa '+(showForm?tile.dataset.icon:'fa-gears');
        // أزرار الزيارة الواحدة تفتح إجراءً بعينه، فلا معنى للرجوع إلى كل الإجراءات.
        document.getElementById('vl-back').hidden=modal.dataset.single==='1';
        fields();
        if(action.value==='collect'){
            const amount=form.elements.amount,limit=collectibleCents()/100;
            amount.max=limit.toFixed(2);
            amount.placeholder='المتاح للتحصيل: '+limit.toFixed(2)+' ر.س';
            let hint=form.querySelector('[data-collection-balance]');
            if(!hint){hint=document.createElement('p');hint.dataset.collectionBalance='';amount.after(hint);}
            hint.textContent='المتاح للتحصيل للزيارات المحددة: '+limit.toFixed(2)+' ر.س بعد خصم السداد السابق.';
        }
    }
    modal.querySelectorAll('[data-pick-action]').forEach(tile=>tile.addEventListener('click',()=>{action.value=tile.dataset.pickAction;step('form');}));
    document.getElementById('vl-back').addEventListener('click',()=>{action.value='';step('pick');});
    async function open(ids,choice,button){
        if(busy)return;
        if(!ids.length){swal({icon:'info',title:'لم تحدد أي زيارة',text:'حدد زيارة واحدة على الأقل من القائمة ثم اختر الإجراء.'});return;}
        target=ids;form.reset();const slotPicker=form.querySelector('[data-reschedule-slots]'),manualPicker=form.querySelector('[data-reschedule-manual]');if(slotPicker)slotPicker.hidden=true;if(manualPicker)manualPicker.hidden=false;form.querySelectorAll('[data-start-slots],[data-start-hint]').forEach(el=>el.hidden=true);form.querySelectorAll('[data-start-manual]').forEach(el=>el.hidden=false);workersLoading=false;submit.disabled=false;form.elements.batch_id.value=crypto.randomUUID();action.value=choice||'';modal.dataset.single=choice?'1':'0';
        if(choice==='collect'&&collectibleCents()<=0){swal({icon:'info',title:'لا يوجد مبلغ متاح للتحصيل',text:'الزيارة مسددة بالكامل أو لا يوجد مبلغ مستحق للتحصيل حاليًا. راجع سجل الدفعات.'});return;}
        step(choice?'form':'pick');
        document.getElementById('vl-target').textContent=(ids.length===1?'':ids.length+' ')+'زيارة محددة: #'+ids.join('، #');
        bootstrap.Modal.getOrCreateInstance(modal).show();
        if(choice==='assign_driver'){
            const group=root.querySelector('[data-fields="assign_driver"]');group.querySelector('[name="driver_role"]').value=button?.dataset.role||'delivery';group.querySelector('[name="driver_time"]').value=button?.dataset.time||'';group.querySelector('[name="driver_id"]').value=button?.dataset.driver||'';
        }
        if(choice==='unassign_driver')form.elements.remove_driver_role.value=button?.dataset.role||'delivery';
        if(choice==='assign_workers')await loadWorkers(button?.dataset.replaceWorker);
        if(choice==='reschedule'&&ids.length===1&&button?.dataset.missed==='1')setupRescheduleSlots();
        if(choice==='start_time'&&ids.length===1&&button?.dataset.date)setupStartSlots(button.dataset.date,button.dataset.time);
    }
    document.getElementById('vl-open-batch').addEventListener('click',()=>open(selected()));
    root.querySelectorAll('[data-single]').forEach(b=>b.addEventListener('click',()=>open([b.dataset.id],b.dataset.single,b)));
    function setupRescheduleSlots(){
        const picker=form.querySelector('[data-reschedule-slots]'),manual=form.querySelector('[data-reschedule-manual]'),date=form.querySelector('#vl-reschedule-date'),cards=form.querySelector('#vl-reschedule-slot-cards'),start=form.elements.starts_at;
        picker.hidden=false;manual.hidden=true;date.disabled=false;start.disabled=false;start.value='';date.min=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);const firstDate=new Date();firstDate.setDate(firstDate.getDate()+1);date.value=new Date(firstDate.getTime()-firstDate.getTimezoneOffset()*60000).toISOString().slice(0,10);
        const note=text=>{const p=document.createElement('p');p.className='vl-slot-empty';p.textContent=text;cards.replaceChildren(p);};
        const load=async()=>{const token=++slotRequest;start.value='';note(cards.dataset.loading);submit.disabled=true;error.hidden=true;
            try{const response=await fetch(root.dataset.visitBase+'/'+target[0]+'/reschedule-slots?date='+encodeURIComponent(date.value),{headers:{Accept:'application/json'}}),data=await response.json();if(token!==slotRequest)return;if(!response.ok)throw new Error(data.message||cards.dataset.error);if(!data.slots.length){note(cards.dataset.empty);return;}
                cards.replaceChildren(...data.slots.map(slot=>{const button=document.createElement('button');button.type='button';button.className='vl-slot-card';button.textContent=slot.label;button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>{start.value=slot.starts_at;cards.querySelectorAll('.vl-slot-card').forEach(card=>{card.classList.remove('is-selected');card.setAttribute('aria-pressed','false');});button.classList.add('is-selected');button.setAttribute('aria-pressed','true');});return button;}));
            }catch(e){if(token===slotRequest){note(cards.dataset.error);error.textContent=e.message;error.hidden=false;}}finally{if(token===slotRequest)submit.disabled=false;}
        };date.addEventListener('input',load);date.addEventListener('change',load);load();
    }
    // Keeps the visit's date: lists that day's free start times and shows the current one as a disabled card.
    async function setupStartSlots(day,current){
        const group=form.querySelector('[data-fields="start_time"]'),hint=group.querySelector('[data-start-hint]'),picker=group.querySelector('[data-start-slots]'),manual=group.querySelector('[data-start-manual]'),cards=group.querySelector('#vl-start-slot-cards'),value=picker.querySelector('[name="start_time"]'),typed=manual.querySelector('[name="start_time"]');
        const useManual=()=>{picker.hidden=true;value.disabled=true;manual.hidden=false;typed.disabled=false;typed.required=true;};
        hint.querySelector('[data-start-date]').textContent=day;hint.querySelector('[data-start-current]').textContent=current||'—';hint.hidden=false;
        picker.hidden=false;value.disabled=false;value.value='';manual.hidden=true;typed.disabled=true;typed.required=false;
        const token=++slotRequest,note=text=>{const p=document.createElement('p');p.className='vl-slot-empty';p.textContent=text;return p;};
        cards.replaceChildren(note(cards.dataset.loading));submit.disabled=true;
        try{
            const response=await fetch(root.dataset.visitBase+'/'+target[0]+'/reschedule-slots?date='+encodeURIComponent(day),{headers:{Accept:'application/json'}}),data=await response.json();
            if(token!==slotRequest)return;if(!response.ok)throw new Error(data.message);
            const times=[...new Set(data.slots.map(slot=>slot.label).concat(current?[current]:[]))].sort();
            cards.replaceChildren(...times.map(time=>{const button=document.createElement('button');button.type='button';button.className='vl-slot-card';button.textContent=time;
                if(time===current){button.classList.add('is-current');button.disabled=true;const tag=document.createElement('small');tag.textContent=cards.dataset.current;button.appendChild(tag);return button;}
                button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>{value.value=time;cards.querySelectorAll('.vl-slot-card').forEach(card=>{card.classList.remove('is-selected');card.setAttribute('aria-pressed','false');});button.classList.add('is-selected');button.setAttribute('aria-pressed','true');});return button;}));
            if(times.every(time=>time===current))cards.appendChild(note(cards.dataset.empty));
        }catch(e){if(token===slotRequest)useManual();}finally{if(token===slotRequest)submit.disabled=false;}
    }
    async function loadWorkers(replace){
        const choices=document.getElementById('vl-worker-choices'),context=document.getElementById('vl-worker-context'),token=form.elements.batch_id.value;
        choices.replaceChildren();workerSnapshot=[];workerRequired=0;workersLoading=true;submit.disabled=true;context.textContent='جارٍ التحقق من التوفر…';
        try{
            if(target.length!==1)throw new Error('التعيين اليدوي متاح لزيارة واحدة؛ اختر زر تعيين عاملة من البطاقة.');
            const response=await fetch(root.dataset.visitBase+'/'+target[0]+'/workers',{headers:{Accept:'application/json'}}),data=await response.json();
            if(token!==form.elements.batch_id.value || action.value!=='assign_workers')return;
            if(!response.ok)throw new Error(Object.values(data.errors||{}).flat().join('\n')||data.message||'تعذر تحميل العاملات');
            workerSnapshot=data.selected;workerRequired=data.required;
            // نص السياق مخفي ويُعاد استخدامه في معاينة التأكيد، والشرائح للعرض فقط.
            context.textContent='الموعد: '+data.starts_at+' — '+data.ends_at+' · المطلوب: '+data.required+' عاملة';
            const chips=document.createElement('div');chips.className='vl-w-chips';
            [['fa-calendar-days',data.starts_at+' — '+data.ends_at],['fa-users','المطلوب: '+data.required+' عاملة'],['fa-user-check','المتاحات: '+data.workers.length]].forEach(([icon,text])=>{const chip=document.createElement('span'),i=document.createElement('i');i.className='fa '+icon;chip.append(i,' '+text);chips.appendChild(chip);});
            choices.appendChild(chips);
            const list=document.createElement('div');list.className='vl-w-list';
            data.workers.forEach(worker=>{const label=document.createElement('label'),input=document.createElement('input'),name=document.createElement('span'),id=document.createElement('small');label.className='vl-w-item';input.type='checkbox';input.name='worker_ids[]';input.value=worker.id;input.dataset.workerName=worker.name;input.checked=data.selected.map(String).includes(String(worker.id))&&String(worker.id)!==String(replace);name.textContent=worker.name;id.textContent='#'+worker.id;label.append(input,name,id);list.appendChild(label);});
            if(!data.workers.length){const empty=document.createElement('p');empty.className='vl-w-empty';empty.textContent='لا توجد عاملات متاحات لهذا الموعد.';list.appendChild(empty);}
            choices.appendChild(list);
            if(data.excluded_workers?.length){
                const details=document.createElement('details'),summary=document.createElement('summary'),rows=document.createElement('ul');details.className='vl-w-excluded';
                summary.textContent='العاملات غير المتاحات وأسباب الاستبعاد ('+data.excluded_workers.length+')';details.appendChild(summary);
                data.excluded_workers.forEach(worker=>{const row=document.createElement('li'),head=document.createElement('div'),name=document.createElement('strong'),id=document.createElement('small'),reasons=document.createElement('div');name.textContent=worker.name;id.textContent='#'+worker.id;head.append(name,id);reasons.className='vl-w-reasons';worker.reasons.forEach(reason=>{const tag=document.createElement('span');tag.textContent=reason;reasons.appendChild(tag);});row.append(head,reasons);rows.appendChild(row);});
                details.appendChild(rows);choices.appendChild(details);
            }
            // بحث بالاسم أو الرقم في المتاحات وغير المتاحات معًا؛ يفتح قائمة الاستبعاد عند وجود نتائج فيها.
            if(data.workers.length+(data.excluded_workers?.length||0)>1){
                const search=document.createElement('div'),icon=document.createElement('i'),field=document.createElement('input'),none=document.createElement('p');
                search.className='vl-w-search';icon.className='fa fa-magnifying-glass';field.type='search';field.className='form-control';field.placeholder='ابحث باسم العاملة أو رقمها';field.setAttribute('aria-label',field.placeholder);
                none.className='vl-w-empty';none.textContent='لا توجد نتائج مطابقة.';none.hidden=true;
                search.append(icon,field);chips.after(search);list.after(none);
                const excludedBox=choices.querySelector('.vl-w-excluded');
                field.addEventListener('keydown',e=>{if(e.key==='Enter')e.preventDefault();});
                field.addEventListener('input',()=>{
                    const q=field.value.trim().toLowerCase().replace(/^#/,'');let shown=0,excludedShown=0;
                    list.querySelectorAll('.vl-w-item').forEach(item=>{const hit=!q||item.textContent.toLowerCase().includes(q);item.hidden=!hit;if(hit)shown++;});
                    excludedBox?.querySelectorAll('li').forEach(item=>{const hit=!q||item.firstChild.textContent.toLowerCase().includes(q);item.hidden=!hit;if(hit)excludedShown++;});
                    if(excludedBox){excludedBox.hidden=!!q&&!excludedShown;if(q&&excludedShown)excludedBox.open=true;}
                    none.hidden=!q||shown+excludedShown>0;
                });
            }
        }catch(e){error.textContent=e.message;error.hidden=false;}finally{if(token===form.elements.batch_id.value){workersLoading=false;submit.disabled=false;}}
    }
    modal.querySelector('[data-pick-action="assign_workers"]')?.addEventListener('click',()=>loadWorkers());
    root.querySelectorAll('[data-payments-url]').forEach(button=>button.addEventListener('click',async()=>{
        const body=document.getElementById('vl-payments-body');body.textContent='جارٍ تحميل الدفعات…';bootstrap.Modal.getOrCreateInstance(document.getElementById('vl-payments-modal')).show();
        try{const response=await fetch(button.dataset.paymentsUrl,{headers:{'X-Requested-With':'XMLHttpRequest'}});if(!response.ok)throw new Error('تعذر تحميل الدفعات.');body.innerHTML=await response.text();}catch(e){body.textContent=e.message;}
    }));
    fields();
    let hidden=[];try{hidden=JSON.parse(localStorage.getItem('hourly-visit-hidden-columns')||'[]');if(!Array.isArray(hidden))hidden=[];}catch{}
    const applyColumns=()=>{root.querySelectorAll('[data-column]').forEach(cell=>cell.hidden=hidden.includes(cell.dataset.column));root.querySelectorAll('[data-column-toggle]').forEach(input=>input.checked=!hidden.includes(input.dataset.columnToggle));};
    root.querySelectorAll('[data-column-toggle]').forEach(input=>input.addEventListener('change',()=>{hidden=hidden.filter(k=>k!==input.dataset.columnToggle);if(!input.checked)hidden.push(input.dataset.columnToggle);try{localStorage.setItem('hourly-visit-hidden-columns',JSON.stringify(hidden));}catch{}applyColumns();}));applyColumns();
    form.addEventListener('submit',async event=>{
        event.preventDefault();if(busy||workersLoading||!action.value)return;
        if(blockedStartedAction(action.value)){error.textContent='بدأ تنفيذ إحدى الزيارات؛ لا يمكن إلغاؤها أو تغيير موعدها أو مدتها.';error.hidden=false;return;}
        const label=modal.querySelector('[data-pick-action="'+action.value+'"]')?.dataset.label||'الإجراء';
        busy=true;submit.disabled=true;error.hidden=true;
        try{
            if(action.value==='collect'){
                const limit=collectibleCents(),amount=Math.round(Number(form.elements.amount.value)*100);
                if(limit<=0)throw new Error('لا يوجد مبلغ متاح للتحصيل للزيارات المحددة. حدّث القائمة وراجع سجل الدفعات.');
                if(amount>limit)throw new Error('المبلغ المدخل يتجاوز المتاح للتحصيل: '+(limit/100).toFixed(2)+' ر.س بعد خصم السداد السابق.');
            }
            let preview='سيُنفَّذ على '+target.length+' زيارة. السبب: '+form.elements.reason.value;
            if(action.value==='assign_workers'){
                const chosen=[...root.querySelectorAll('[name="worker_ids[]"]:checked')];
                if(!chosen.length||chosen.length>workerRequired)throw new Error('اختر من عاملة واحدة إلى '+workerRequired+' عاملات.');
                preview=document.getElementById('vl-worker-context').textContent+'\nالتعيين بعد الحفظ: '+chosen.map(input=>input.dataset.workerName).join('، ')+'\n'+preview;
            }
            const slotTime=form.querySelector('[data-start-slots] [name="start_time"]');
            if(action.value==='start_time'&&!slotTime.disabled){if(!slotTime.value)throw new Error('اختر أحد الأوقات المتاحة أولًا.');preview='الوقت الجديد: '+slotTime.value+'\n'+preview;}
            if(!(await confirmAction('معاينة وتأكيد: '+label,preview,['cancel_visit','unassign_workers','unassign_driver','unassign_all'].includes(action.value))))return;
            if(action.value==='reschedule'&&form.elements.starts_at&&!form.elements.starts_at.disabled&&!form.elements.starts_at.value)throw new Error('اختر أحد المواعيد المتاحة أولًا.');
            const data=new FormData(form);target.forEach(id=>data.append('visit_ids[]',id));
            if(action.value==='assign_workers')workerSnapshot.forEach(id=>data.append('expected_worker_ids[]',id));
            if(action.value==='unassign_driver'){data.set('driver_role',form.elements.remove_driver_role.value);data.delete('remove_driver_role');}
            const csrf=document.querySelector('meta[name="csrf-token"]')?.content||form.elements._token?.value;
            if(csrf)data.set('_token',csrf);
            const response=await fetch(root.dataset.endpoint,{method:'POST',credentials:'same-origin',headers:{Accept:'application/json','X-CSRF-TOKEN':csrf||''},body:data});
            if(response.status===419)throw new Error('انتهت صلاحية الجلسة. حدّث الصفحة ثم أعد تنفيذ الإجراء، وسجّل الدخول إذا طُلب منك ذلك.');
            const result=await response.json();if(!response.ok)throw new Error(Object.values(result.errors||{}).flat().join('\n')||result.message||'تعذر تنفيذ الإجراء');
            if(!result.receipts?.length){
                bootstrap.Modal.getOrCreateInstance(modal).hide();
                await swal({icon:'success',title:'تم التنفيذ',text:result.message||(label+' على '+target.length+' زيارة'),timer:1600,showConfirmButton:false});
                location.reload();return;
            }
            const message=document.getElementById('vl-result');message.replaceChildren();message.textContent=result.message+' ';
            result.receipts.forEach(receipt=>{const link=document.createElement('a');link.href=root.dataset.receiptBase+'/'+receipt.id;link.textContent='إيصال #'+receipt.id+' ('+receipt.amount+' ر.س) ';link.target='_blank';link.rel='noopener';link.className='btn btn-light mx-1';message.appendChild(link);});
            const reload=document.createElement('button');reload.type='button';reload.className='btn btn-primary';reload.textContent='تحديث القائمة';reload.onclick=()=>location.reload();message.appendChild(reload);message.hidden=false;bootstrap.Modal.getOrCreateInstance(modal).hide();
            // Prevent a second collection against stale balances until the list is refreshed.
            root.querySelectorAll('[data-single],#vl-open-batch').forEach(b=>b.disabled=true);
        }catch(e){error.textContent=e.message||'تعذر الاتصال. أعد المحاولة بنفس العملية.';error.hidden=false;}
        finally{busy=false;submit.disabled=false;}
    });
})();
