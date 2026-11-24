/*
 * Design kit only (not ported to asuss): sample rows for «السجلات» (screens/records.html).
 * Everything here is generated: names come from small generic lists, phones and IDs are masked
 * random digits. Status counts match the numbers shown in the sidebar and on the dashboard.
 * Implements AsRecords.source(entity, query) with filtering, search, sorting and paging in memory.
 */
(function () {
    'use strict';
    var R = window.AsRecords;
    var TODAY = new Date(Date.UTC(2026, 10, 24));

    function rng(seed) {             // mulberry32: same rows on every load
        var a = 0;
        for (var i = 0; i < seed.length; i++) a = (a * 31 + seed.charCodeAt(i)) >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            var t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function pick(r, list) { return list[Math.floor(r() * list.length)]; }
    function int(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
    function iso(daysAgo) {
        var d = new Date(TODAY.getTime() - daysAgo * 864e5);
        return d.toISOString().slice(0, 10);
    }
    function deal(r, dist) {         // exact counts per status, shuffled
        var out = [];
        Object.keys(dist).forEach(function (k) { for (var i = 0; i < dist[k]; i++) out.push(k); });
        for (var i = out.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = out[i]; out[i] = out[j]; out[j] = t; }
        return out;
    }
    function digits(r, n) { var s = ''; for (var i = 0; i < n; i++) s += int(r, 0, 9); return s; }
    function phone(r) { return '05' + int(r, 0, 9) + ' ••• ' + digits(r, 4); }

    // generic name parts (no real records)
    var C_FIRST = ['محمد', 'عبدالله', 'فهد', 'سعد', 'خالد', 'نورة', 'سارة', 'منى', 'عبدالعزيز', 'ريم', 'تركي', 'هند', 'فيصل', 'أحمد', 'لطيفة', 'ماجد', 'عبير', 'سلمان', 'هيفاء', 'بندر', 'نوف', 'يزيد', 'العنود', 'مشاعل'];
    var C_LAST = ['القحطاني', 'الشهري', 'الغامدي', 'العتيبي', 'الدوسري', 'الزهراني', 'الحربي', 'المطيري', 'السبيعي', 'العنزي', 'الشمري', 'الرشيدي', 'البقمي', 'الأحمدي', 'السهلي', 'العمري'];
    var M_FIRST = ['MARIA', 'JOY', 'ANNA', 'GRACE', 'SITI', 'FATIMA', 'MERCY', 'RUTH', 'ROSE', 'AMINA', 'HANA', 'ESTHER', 'NUR', 'LILY', 'JANE', 'HELEN', 'SARAH', 'MARTHA', 'RINA', 'DIANA'];
    var M_LAST = ['SANTOS', 'ACHIENG', 'WANJIRU', 'BEGUM', 'AMINAH', 'REYES', 'CRUZ', 'OTIENO', 'BEKELE', 'TESFAYE', 'RAHMAN', 'MENDOZA', 'NAKATO', 'AKTER', 'PERERA', 'WATI', 'GIRMA', 'NAMULI'];
    var NAT = [['ph', 'الفلبين'], ['ke', 'كينيا'], ['ug', 'أوغندا'], ['et', 'إثيوبيا'], ['bd', 'بنغلاديش'], ['lk', 'سريلانكا'], ['id', 'إندونيسيا'], ['in', 'الهند']];
    var STAFF = [['s1', 'سارة أحمد'], ['s2', 'سلطان الزهراني'], ['s3', 'ريم العتيبي'], ['s4', 'فهد الدوسري'], ['s5', 'نورة الحربي']];
    var SHELTERS = [['rimal', 'إيواء حي الرمال'], ['narjis', 'إيواء حي النرجس'], ['malqa', 'إيواء حي الملقا']];
    function client(r) { return pick(r, C_FIRST) + ' ' + pick(r, C_LAST); }
    function maid(r) { return pick(r, M_FIRST) + ' ' + pick(r, M_LAST); }
    function passport(r) { return String.fromCharCode(65 + int(r, 0, 25)) + digits(r, 7); }
    R.mock = { NAT: NAT, STAFF: STAFF, SHELTERS: SHELTERS };
    R.today = function () { return new Date(2026, 10, 24); };   // the kit's «today», same as the sample dates
    var OFFICES = [['trust', 'Trust Manpower Agency'], ['golden', 'Golden Hands Agency'], ['bright', 'Bright Future Placement'], ['star', 'Star Overseas Services']];
    var CITIES = ['الرياض', 'الرياض', 'الرياض', 'جدة', 'الدمام', 'الخبر', 'مكة المكرمة', 'المدينة المنورة'];

    /* ---------- one generator per entity ---------- */
    var STAGES = ['new', 'msaned', 'tafwed', 'taffez', 'tazker', 'arrival'];
    var STAGE_LIMIT = { new: 5, msaned: 10, tafwed: 7, taffez: 10, tazker: 7, arrival: 5 };
    var GEN = {
        recruitment: function (r) {
            var st = deal(r, { new: 6, msaned: 9, tafwed: 7, taffez: 5, tazker: 4, arrival: 3, warranty: 89, completed: 76, back: 7, cancelled: 5, closed: 7 });
            var lateLeft = { msaned: 1, tafwed: 3 }, approvalLeft = 4, noMaidLeft = 2, escLeft = 3, depLeft = 2;   // as on the dashboard
            return st.map(function (s, i) {
                var id = 360 - i, nat = pick(r, NAT), staff = pick(r, STAFF);
                var running = STAGES.indexOf(s) >= 0;
                var late = running && lateLeft[s] > 0 && lateLeft[s]--;
                var inStage = !running ? 0 : late ? STAGE_LIMIT[s] + int(r, 1, 9) : int(r, 0, STAGE_LIMIT[s]);
                var age = running ? inStage + int(r, 2, 40) : int(r, 60, 400);
                late = !!late;
                var needsOk = s === 'new' && approvalLeft > 0 && approvalLeft--;
                var c = client(r), m = maid(r), off = pick(r, OFFICES), rel = r() < .55 ? 'm' : 'c', city = pick(r, CITIES);
                var noMaid = s === 'new' && !needsOk && noMaidLeft > 0 && noMaidLeft--;
                var pipe = s === 'warranty' && escLeft > 0 && escLeft-- ? 'escape' : s === 'warranty' && depLeft > 0 && depLeft-- ? 'deport' : '';
                return {
                    id: String(id), ref: '#' + id, status: s, created: iso(age), age: age, inStage: inStage, city: city, noMaid: !!noMaid, pipe: pipe, late: late, lateBy: late ? inStage - STAGE_LIMIT[s] : 0,
                    approval: !!needsOk, client: c, phone: phone(r), maid: m, nat: nat[1], passport: passport(r), staff: staff[1],
                    msaned: s === 'new' ? '' : digits(r, 8), visa: STAGES.indexOf(s) >= 2 || STAGES.indexOf(s) < 0 ? digits(r, 10) : '',
                    office: off[1],
                    price: pick(r, [14500, 15800, 16900, 18500, 21000]), paid: 0,
                    warrantyLeft: s === 'warranty' ? int(r, 1, 90) : 0,
                    _tone: late ? 'late' : '',
                    _d: iso(age),
                    _f: { nat: nat[0], staff: staff[0], stage: late ? 'late' : running ? 'within' : 'none', office: off[0], rel: rel, city: city,
                          warranty: s === 'warranty' ? 'on' : s === 'completed' ? 'off' : 'na', pipe: pipe },
                    _flags: { late: late, approval: !!needsOk, nomaid: !!noMaid },
                    _q: [id, c, m, nat[1], staff[1], digits(r, 8)].join(' '), _s: { id: id, created: -age, client: c, inStage: inStage }
                };
            }).map(function (x) { x.paid = x.status === 'new' ? Math.round(x.price * .3) : x.price; return x; });
        },
        orders: function (r) {
            var st = deal(r, { new: 12, review: 9, contracted: 25, refund: 3, nocontract: 3, done: 4, expired: 4, rejected: 4 }), overLeft = 2;
            return st.map(function (s, i) {
                var code = 31040 - i * 3, nat = pick(r, NAT), staff = pick(r, STAFF), age = i < 12 ? int(r, 0, 3) : int(r, 2, 120);
                var type = r() < .72 ? ['rec', 'استقدام'] : ['rent', 'تأجير'];
                var c = client(r), m = r() < .6 ? maid(r) : '';
                var hours = s === 'new' ? (overLeft > 0 && overLeft-- ? -int(r, 1, 5) : int(r, 1, 23)) : 0;
                var job = pick(r, [['maid', 'عاملة منزلية'], ['maid', 'عاملة منزلية'], ['maid', 'عاملة منزلية'], ['driver', 'سائق خاص'], ['nanny', 'مربية أطفال']]);
                return {
                    id: String(code), ref: '#' + code, status: s, created: iso(age), age: age, client: c, phone: phone(r), type: type[1],
                    maid: m, nat: nat[1], staff: staff[1], hours: hours, job: job[1], contract: s === 'contracted' ? String(int(r, 120, 360)) : '',
                    channel: pick(r, ['التطبيق', 'الموقع', 'الفرع', 'واتساب']),
                    _d: iso(age), _f: { type: type[0], nat: nat[0], staff: staff[0], job: job[0], timer: s !== 'new' ? '' : hours <= 0 ? 'over' : hours < 6 ? 'urgent' : 'normal' }, _flags: {},
                    _q: [code, c, m, nat[1]].join(' '), _s: { id: code, created: -age }
                };
            });
        },
        rent: function (r) {
            var st = deal(r, { sent: 3, signed: 2, delivered: 2, trial: 5, active: 7, ended: 2, transferred: 1 });
            return st.map(function (s, i) {
                var n = 52 - i, nat = pick(r, NAT), months = pick(r, [1, 3, 6, 12]), age = int(r, 3, 200);
                var total = months * 30, used = s === 'ended' ? total : s === 'active' || s === 'trial' ? int(r, 1, total - 1) : 0;
                var amount = months * pick(r, [2800, 3200, 3500]), pay = s === 'ended' || s === 'transferred' || r() < .5 ? 'paid' : pick(r, ['partial', 'partial', 'unpaid', 'later', 'transfer']);
                var c = client(r), m = maid(r), staff = pick(r, STAFF);
                return {
                    id: 'RC-2026-' + String(n).padStart(4, '0'), ref: 'RC-2026-' + String(n).padStart(4, '0'), status: s, created: iso(age), client: c, phone: phone(r),
                    maid: m, nat: nat[1], months: months, total: total, used: used, left: total - used, amount: amount, pay: pay,
                    paidAmount: pay === 'paid' ? amount : pay === 'partial' ? Math.round(amount * .5) : 0, pkg: 'باقة ' + nat[1],
                    _d: iso(age), _f: { nat: nat[0], pay: pay, months: String(months), staff: staff[0] }, _flags: { ending: (s === 'active' || s === 'trial') && total - used <= 7 },
                    _q: [n, c, m, nat[1]].join(' '), _s: { id: n, created: -age, left: s === 'ended' ? 9999 : total - used, amount: amount }
                };
            });
        },
        shelter: function (r) {
            var st = deal(r, { in: 14, ready: 6, transfer: 4, deport: 3, out: 26 });
            return st.map(function (s, i) {
                var id = 180 - i, nat = pick(r, NAT), sh = pick(r, SHELTERS), days = s === 'out' ? int(r, 5, 90) : int(r, 1, 75);
                var src = pick(r, [['client', 'من العميل'], ['airport', 'من المطار'], ['escape', 'بلاغ تغيب']]);
                var warranty = r() < .45, wants = s === 'deport' ? false : r() < .7, wantsK = s === 'deport' ? 'no' : r() < .12 ? 'unknown' : wants ? 'yes' : 'no';
                var ctype = pick(r, [['rec', 'استقدام'], ['rec', 'استقدام'], ['rent', 'تأجير'], ['instant', 'استلام فوري'], ['transfer', 'نقل كفالة']]);
                var c = client(r), m = maid(r);
                return {
                    id: String(id), ref: '#' + id, status: s, maid: m, nat: nat[1], passport: passport(r), client: c, phone: phone(r),
                    shelter: sh[1], days: days, since: iso(days), src: src[1], warranty: warranty, warrantyLeft: warranty ? int(r, 1, 60) : int(r, 1, 40),
                    wants: wants, deport: s === 'deport' ? pick(r, [25, 50, 75]) : 0, msaned: digits(r, 8),
                    _tone: s === 'in' && days > 30 ? 'late' : '',
                    _d: iso(days), _f: { shelter: sh[0], nat: nat[0], src: src[0], ctype: ctype[0], wants: wantsK, warranty: warranty ? 'in' : 'out' }, _flags: { long: days > 30 && s !== 'out' },
                    _q: [id, m, c, nat[1], sh[1]].join(' '), _s: { id: id, days: days }
                };
            });
        },
        maids: function (r) {
            var st = deal(r, { available: 578, reserved: 200, backout: 24, suspended: 11, deported: 7 });
            return st.map(function (s, i) {
                var id = 4203 - i, nat = pick(r, NAT), age = int(r, 21, 45), job = r() < .68 ? ['rec', 'استقدام'] : pick(r, [['rent', 'إيجار عمالة'], ['rent', 'إيجار عمالة'], ['instant', 'استلام فوري'], ['hourly', 'بالساعة']]);
                var rel = r() < .55 ? ['m', 'مسلمة'] : ['c', 'غير مسلمة'];
                var exp = r() < .35 ? 0 : int(r, 1, 12), salary = pick(r, [1000, 1200, 1300, 1500, 1800]), added = int(r, 0, 300);
                var m = maid(r), off = pick(r, OFFICES), shown = s === 'available' && r() < .85;
                return {
                    id: String(id), ref: '#' + id, status: s, name: m, nat: nat[1], age: age, job: job[1], religion: rel[1], exp: exp, salary: salary,
                    passport: passport(r), shown: shown, added: iso(added), addedAgo: added,
                    langs: pick(r, ['العربية، الإنجليزية', 'الإنجليزية', 'العربية', 'الإنجليزية، التاغالوغ']), skills: pick(r, [['تنظيف', 'طبخ'], ['رعاية أطفال', 'تنظيف'], ['رعاية كبار السن'], ['طبخ', 'كي الملابس', 'تنظيف']]),
                    office: off[1],
                    _d: iso(added), _f: { nat: nat[0], job: job[0], rel: rel[0], age: age <= 30 ? 'a' : age <= 38 ? 'b' : 'c', exp: exp > 0 ? 'yes' : 'no', shown: shown ? 'yes' : 'no', office: off[0] }, _flags: { exp: exp > 0, new: added <= 7 },
                    _q: [id, m, nat[1], job[1]].join(' '), _s: { id: id, age: age, salary: salary, added: -added, exp: exp }
                };
            });
        },
        clients: function (r) {
            var st = deal(r, { active: 3341, blocked: 23 });
            return st.map(function (s, i) {
                var id = 3804 - i, c = client(r), reg = int(r, 0, 900);
                var recN = r() < .38 ? int(r, 1, 3) : 0, rentN = r() < .12 ? int(r, 1, 2) : 0, ordN = r() < .4 ? int(r, 1, 4) : 0;
                var src = pick(r, [['app', 'التطبيق'], ['app', 'التطبيق'], ['web', 'الموقع'], ['branch', 'الفرع']]);
                var city = pick(r, ['الرياض', 'الرياض', 'جدة', 'الدمام', 'الخبر', 'مكة المكرمة', 'المدينة المنورة']);
                return {
                    id: String(id), ref: '#' + id, status: s, name: c, phone: phone(r), nid: '1' + '•••••••' + digits(r, 2), city: city, src: src[1],
                    rec: recN, rentN: rentN, orders: ordN, reg: iso(reg), regAgo: reg, wallet: r() < .1 ? int(r, 1, 30) * 50 : 0,
                    _d: iso(reg), _f: { src: src[0], city: city, service: recN ? 'rec' : rentN ? 'rent' : 'none', orders: ordN ? 'yes' : 'no' }, _flags: { active: recN + rentN > 0 },
                    _q: [id, c, city].join(' '), _s: { id: id, reg: -reg, rec: recN + rentN, name: c }
                };
            });
        },
        complaints: function (r) {
            var st = deal(r, { pending: 5, progress: 3, noreply: 1, resolved: 5, closed: 1, rejected: 1 }), unassigned = 2;
            return st.map(function (s, i) {
                var id = 24 - i, c = client(r), age = s === 'pending' ? int(r, 0, 4) : int(r, 3, 60);
                var type = pick(r, [['escape', 'تغيب العاملة'], ['delay', 'تأخر الوصول'], ['behaviour', 'سلوك العاملة'], ['refund', 'استرجاع مبلغ'], ['health', 'صحة العاملة']]);
                var prio = s === 'pending' && i % 2 ? 'high' : pick(r, ['high', 'medium', 'medium', 'low']);
                var staff = s === 'pending' && unassigned-- > 0 ? null : pick(r, STAFF);
                var noContact = s === 'pending' && age >= 1;
                return {
                    id: String(id), ref: '#' + id, status: s, client: c, phone: phone(r), type: type[1], contract: r() < .7 ? String(int(r, 150, 360)) : '',
                    prio: prio, staff: staff ? staff[1] : '', age: age, created: iso(age), noContact: noContact,
                    channel: pick(r, ['التطبيق', 'الهاتف', 'الفرع', 'واتساب']), text: pick(r, ['العاملة غادرت المنزل صباح اليوم ولم تعد.', 'مضى على العقد أكثر من 70 يومًا ولم تصل العاملة.', 'أطلب استرجاع المبلغ المدفوع بعد إلغاء العقد.', 'العاملة تشتكي من ألم مستمر وتحتاج مراجعة طبية.', 'العاملة لا تلتزم بالتعليمات وأطلب الاستبدال.']),
                    _tone: noContact ? 'late' : '',
                    _d: iso(age), _f: { type: type[0], prio: prio, staff: staff ? staff[0] : 'none' }, _flags: { unassigned: !staff && s !== 'closed' && s !== 'resolved' },
                    _q: [id, c, type[1]].join(' '), _s: { id: id, age: age, prio: { high: 3, medium: 2, low: 1 }[prio] }
                };
            });
        },
        claims: function (r) {
            var st = deal(r, { pending: 9, approved: 6, paid: 22, done: 19, rejected: 4 });
            return st.map(function (s, i) {
                var n = 1088 - i, age = s === 'pending' ? int(r, 0, 6) : int(r, 2, 150);
                var type = pick(r, [['gov', 'رسوم حكومية', 'مساند'], ['office', 'مكتب خارجي', 'Trust Manpower Agency'], ['ticket', 'تذكرة طيران', 'وكالة سفر'], ['refund', 'استرجاع عميل', ''], ['medical', 'فحص طبي', 'مستوصف']]);
                var amount = type[0] === 'gov' ? pick(r, [2000, 2400, 4200]) : type[0] === 'office' ? pick(r, [3500, 4200, 6000]) : type[0] === 'ticket' ? pick(r, [1250, 1480, 1900]) : type[0] === 'refund' ? pick(r, [5000, 8000, 12500]) : pick(r, [300, 450]);
                var c = client(r), by = pick(r, STAFF), owner = pick(r, [['fm', 'المدير المالي'], ['gm', 'المدير العام'], ['bm', 'مدير الفرع']]), stuck = s === 'pending' ? owner[1] : '';
                var off = type[0] === 'office' ? pick(r, OFFICES) : ['', ''];
                if (off[1]) type = [type[0], type[1], off[1]];
                return {
                    id: 'TM-' + n, ref: 'TM-' + n, status: s, type: type[1], benef: type[2] || c, client: c, contract: String(int(r, 150, 360)), amount: amount,
                    by: by[1], stuck: stuck, created: iso(age), age: age,
                    _d: iso(age), _f: { type: type[0], by: by[0], owner: owner[0], office: off[0] }, _flags: { big: amount >= 5000 },
                    _q: [n, c, type[1], type[2]].join(' '), _s: { id: n, amount: amount, created: -age }
                };
            });
        },
        tasks: function (r) {
            var st = deal(r, { pending: 6, progress: 5, done: 11 });
            var TITLES = ['مراجعة عقود مساند المتأخرة', 'التواصل مع عميل الشكوى #21', 'تحديث أسعار باقات التأجير', 'تجهيز تقرير التحصيل الشهري', 'متابعة تذاكر وصول الأسبوع', 'مراجعة سير الفلبين الجديدة', 'إغلاق عُهد الموظفين المنتهية', 'متابعة تأشيرات الشركة', 'تحديث بيانات مقر إيواء الرمال', 'مراجعة الموقع الإلكتروني'];
            return st.map(function (s, i) {
                var id = 22 - i, due = int(r, -6, 12), staff = pick(r, STAFF), prio = pick(r, ['high', 'medium', 'medium', 'low']);
                var late = s !== 'done' && due < 0;
                return {
                    id: String(id), ref: '#' + id, status: s, title: TITLES[i % TITLES.length], prio: prio, to: staff[1], by: pick(r, ['مشرف', 'ريم العتيبي']),
                    due: iso(-due), dueIn: due, late: late, created: iso(int(r, 7, 40)),
                    _tone: late ? 'late' : '',
                    _f: { to: staff[0], prio: prio }, _flags: { late: late, mine: staff[0] === 's1' },
                    _q: [id, TITLES[i % TITLES.length], staff[1]].join(' '), _s: { id: id, due: due, prio: { high: 3, medium: 2, low: 1 }[prio] }
                };
            });
        },
        visits: function (r) {
            // hourly visits: 26 overdue and one not back at the shelter, as on the old screen
            var st = deal(r, { scheduled: 14, onway: 3, inprogress: 4, done: 8, missed: 26, cancelled: 3 }), noReturn = 1;
            var SERVICES = [['hour', 'خدمة بالساعة'], ['villa', 'تنظيف فلل'], ['stay', 'خدمة إقامة']];
            var TEAMS = [['t1', 'فريق الرمال'], ['t2', 'فريق النرجس'], ['t3', 'فريق الملقا']];
            return st.map(function (s, i) {
                var n = 5840 - i, c = client(r), svc = pick(r, SERVICES), team = pick(r, TEAMS);
                var day = s === 'missed' ? int(r, 1, 9) : s === 'done' || s === 'cancelled' ? int(r, 0, 20) : s === 'scheduled' ? -int(r, 0, 6) : 0;
                var hours = svc[0] === 'villa' ? pick(r, [6, 8]) : svc[0] === 'stay' ? 10 : pick(r, [4, 4, 5, 6]);
                var start = pick(r, ['08:00', '09:00', '10:00', '13:00', '16:00']);
                var maidsN = svc[0] === 'villa' ? int(r, 2, 4) : 1, price = hours * maidsN * pick(r, [35, 40, 45]) * 1.15;
                var pay = s === 'cancelled' ? 'refund' : s === 'done' || r() < .55 ? 'paid' : r() < .5 ? 'partial' : 'unpaid';
                var nr = s === 'done' && noReturn-- > 0;
                var maids = []; for (var k = 0; k < maidsN; k++) maids.push(maid(r));
                var method = pick(r, ['cash', 'card', 'card', 'bank', 'wallet']), vsrc = pick(r, ['app', 'app', 'web', 'admin']);
                return {
                    id: 'V-' + n, ref: 'V-' + n, status: s, client: c, phone: phone(r), district: pick(r, ['حي الملقا', 'حي النرجس', 'حي الياسمين', 'حي العارض', 'حي الرمال', 'حي قرطبة']),
                    date: iso(day), dayAgo: day, start: start, hours: hours, price: Math.round(price), pay: pay, service: svc[1], team: team[1],
                    maids: maids, leader: maids[0], driver: pick(r, ['سائق: أبو أحمد', 'سائق: عمران', 'سائق: راجو']), noReturn: nr,
                    _tone: s === 'missed' || nr ? 'late' : '',
                    _d: iso(day), _f: { svc: svc[0], team: team[0], pay: pay, part: +start.slice(0, 2) < 12 ? 'am' : 'pm', method: method, src: vsrc }, _flags: { noreturn: nr },
                    _q: [n, c, team[1], maids.join(' ')].join(' '), _s: { id: n, date: -day, price: price }
                };
            });
        },
        employees: function (r) {
            var st = deal(r, { active: 33, leave: 4, ended: 2 });
            var JOBS = [['rec', 'الاستقدام', 'موظفة استقدام'], ['rec', 'الاستقدام', 'مسوّق'], ['rent', 'التأجير', 'منسقة تأجير'], ['ops', 'التشغيل', 'مشرفة إيواء'], ['ops', 'التشغيل', 'سائق'], ['care', 'خدمة العملاء', 'موظفة خدمة عملاء'], ['fin', 'المالية', 'محاسب'], ['admin', 'الإدارة', 'موارد بشرية']];
            return st.map(function (s, i) {
                var n = 1039 - i, j = pick(r, JOBS), name = client(r), joined = int(r, 30, 1600);
                var branch = pick(r, ['الرياض — الرئيسي', 'الرياض — الملقا', 'جدة']), hasUser = j[2] !== 'سائق' && r() < .85;
                return {
                    id: 'E-' + n, ref: 'E-' + n, status: s, name: name, job: j[2], dept: j[1], branch: branch, phone: phone(r),
                    nat: r() < .8 ? 'سعودي' : pick(r, ['مصري', 'سوداني', 'فلبيني', 'هندي']), joined: iso(joined), joinedAgo: joined,
                    leaveBack: s === 'leave' ? iso(-int(r, 2, 20)) : '', hasUser: hasUser,
                    _f: { dept: j[0], branch: branch }, _flags: { nouser: !hasUser },
                    _q: [n, name, j[2], j[1]].join(' '), _s: { id: n, name: name, joined: -joined }
                };
            });
        },
        users: function (r) {
            var st = deal(r, { active: 21, disabled: 3 });
            var ROLES = [['admin', 'مدير النظام'], ['manager', 'مدير فرع'], ['staff', 'موظف'], ['staff', 'موظف'], ['staff', 'موظف'], ['finance', 'المالية'], ['viewer', 'اطلاع فقط']];
            return st.map(function (s, i) {
                var n = 224 - i, name = i === 0 ? 'مشرف' : client(r), role = i === 0 ? ROLES[0] : pick(r, ROLES), seen = s === 'disabled' ? int(r, 40, 200) : int(r, 0, 9);
                var fa = role[0] === 'admin' || r() < .6;
                var limit = role[0] === 'admin' ? 0 : role[0] === 'manager' ? 20000 : role[0] === 'finance' ? 50000 : role[0] === 'staff' && r() < .3 ? 2000 : -1;
                return {
                    id: 'U-' + n, ref: 'U-' + n, status: s, name: name, email: 'user' + n + '@example.com', role: role[1],
                    dept: pick(r, ['الاستقدام', 'التأجير', 'التشغيل', 'خدمة العملاء', 'المالية', 'الإدارة']), phone: phone(r),
                    seen: seen, twofa: fa, limit: limit,
                    _f: { role: role[0] }, _flags: { nofa: !fa },
                    _q: [n, name, role[1]].join(' '), _s: { id: n, name: name, seen: seen }
                };
            });
        }
    };

    var cache = {};
    function norm(s) {
        return String(s).toLowerCase().replace(/[ً-ْ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
    }
    R.source = function (e, q) {
        var all = cache[e.id] || (cache[e.id] = GEN[e.id](rng(e.id)).map(function (x) { x._n = norm(x._q); return x; }));
        var term = norm(q.q || '');
        var base = all.filter(function (x) {
            if (term && x._n.indexOf(term) < 0) return false;
            for (var k in q.filters) if (x._f[k] !== q.filters[k]) return false;
            for (var f in q.flags) if (q.flags[f] && !x._flags[f]) return false;
            if (q.range && x._d && ((q.range.from && x._d < q.range.from) || (q.range.to && x._d > q.range.to))) return false;
            return true;
        });
        var counts = { all: base.length };
        base.forEach(function (x) { counts[x.status] = (counts[x.status] || 0) + 1; });
        var rows = q.statusIn ? base.filter(function (x) { return q.statusIn.indexOf(x.status) >= 0; })
            : q.status && q.status !== 'all' ? base.filter(function (x) { return x.status === q.status; }) : base.slice();
        if (q.sort) {
            var k = q.sort.key, d = q.sort.dir === 'asc' ? 1 : -1;
            rows.sort(function (a, b) {
                var x = a._s[k], y = b._s[k];
                return (typeof x === 'string' ? x.localeCompare(y, 'ar') : x - y) * d;
            });
        }
        var start = (q.page - 1) * q.size;
        var out = { rows: rows.slice(start, start + q.size), total: rows.length, counts: counts };
        return new Promise(function (res) { setTimeout(function () { res(out); }, 140); });
    };
})();
