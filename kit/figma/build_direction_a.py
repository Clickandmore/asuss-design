import base64, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
logo = 'data:image/svg+xml;base64,' + base64.b64encode((ROOT/'assets/web/assets/images/logoh.svg').read_bytes()).decode()

P = {  # 24px stroke icons
 'home':'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
 'inbox':'<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
 'file':'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
 'id':'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.5 1.7-2 3-2s2.4.5 3 2M14 10h4M14 13h3"/>',
 'users':'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 6M18 14c2 .8 3 2.8 3 6"/>',
 'hand':'<path d="M3 12l4-4 4 2 3-3 7 7-4 4-3-3-3 3-8-6z"/>',
 'clock':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 'house':'<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
 'headset':'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/>',
 'wallet':'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>',
 'cog':'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
 'search':'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 'cal':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 'down':'<path d="m6 9 6 6 6-6"/>',
 'plus':'<path d="M12 5v14M5 12h14"/>',
 'export':'<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 15v5h14v-5"/>',
 'sliders':'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
 'more':'<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',
 'left':'<path d="M19 12H5M11 6l-6 6 6 6"/>',
 'right':'<path d="M5 12h14M13 6l6 6-6 6"/>',
 'check':'<path d="m5 12 5 5 9-10"/>',
 'alert':'<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
 'print':'<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
 'bell':'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
 'x':'<path d="M6 6l12 12M18 6 6 18"/>',
 'upload':'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
 'phone':'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
}
def ic(name, size=18, color='currentColor', sw=1.7):
    return f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" style="flex:none">{P[name]}</svg>'

CSS = '''
*{box-sizing:border-box;margin:0;padding:0}
body{background:#d9dce3;font-family:"Cairo",sans-serif;padding:40px;display:flex;flex-direction:column;gap:40px;align-items:center}
.screen{width:1440px;height:900px;background:#fff;display:flex;direction:rtl;color:#344054;font-size:14px;line-height:1.5;overflow:hidden;font-family:"Cairo",sans-serif}
.n{direction:ltr;unicode-bidi:isolate;font-variant-numeric:tabular-nums}
/* sidebar */
.sb{width:248px;flex:none;background:#fcfcfd;border-left:1px solid #eaecf0;padding:20px 14px;display:flex;flex-direction:column}
.sb img{height:40px;width:auto;align-self:flex-start;margin:0 6px 22px}
.sb .grp{margin:16px 10px 6px;font-size:12px;font-weight:600;color:#98a2b3}
.sb a{display:flex;align-items:center;gap:10px;height:38px;padding:0 10px;border-radius:8px;color:#475467;text-decoration:none;font-weight:500}
.sb a svg{color:#98a2b3}
.sb a.on{background:#fff;color:#101828;font-weight:600;box-shadow:0 0 0 1px #eaecf0,0 1px 2px rgba(16,24,40,.06)}
.sb a.on svg{color:#191936}
.sb a .c{margin-right:auto;font-size:12px;font-weight:600;color:#98a2b3}
.sb a .c.r{color:#b42318}
.sb .me{margin-top:auto;display:flex;align-items:center;gap:10px;padding:12px 10px;border-top:1px solid #eaecf0}
.av{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:13px;flex:none}
.sb .me b{display:block;color:#101828;font-size:13.5px}
.sb .me span{font-size:12px;color:#667085}
/* main */
.mn{flex:1;display:flex;flex-direction:column;min-width:0}
.tb{height:60px;flex:none;display:flex;align-items:center;gap:16px;padding:0 36px;border-bottom:1px solid #f2f4f7}
.crumb{display:flex;gap:8px;font-size:13.5px;color:#667085}
.crumb b{color:#101828;font-weight:600}
.srch{margin-right:auto;width:340px;height:36px;border-radius:8px;background:#f9fafb;border:1px solid #eaecf0;display:flex;align-items:center;gap:8px;padding:0 12px;color:#98a2b3;font-size:13.5px}
.srch kbd{margin-right:auto;font-family:inherit;font-size:11px;border:1px solid #eaecf0;border-radius:4px;padding:0 6px;background:#fff;color:#667085}
.ib{width:36px;height:36px;display:grid;place-items:center;border-radius:8px;color:#667085;position:relative}
.ib i{position:absolute;top:8px;left:9px;width:7px;height:7px;border-radius:50%;background:#f04438;border:2px solid #fff}
.ct{flex:1;padding:28px 36px 0;overflow:hidden}
.hd{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}
h1{font-size:24px;font-weight:700;color:#101828;line-height:1.3}
.sub{margin-top:4px;color:#667085;font-size:14px}
.sub .r{color:#b42318;font-weight:600}
.acts{display:flex;gap:8px}
.btn{height:38px;padding:0 14px;border-radius:8px;border:1px solid #d0d5dd;background:#fff;color:#344054;font-family:inherit;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:8px;box-shadow:0 1px 2px rgba(16,24,40,.05)}
.btn.p{background:#191936;border-color:#191936;color:#fff}
.btn.sm{height:32px;padding:0 10px;font-size:13px}
.lnk{color:#1a5f9e;font-weight:600;font-size:13.5px;display:inline-flex;align-items:center;gap:6px}
/* list */
.views{display:flex;gap:22px;margin-top:20px;border-bottom:1px solid #eaecf0}
.views span{padding:0 2px 10px;font-weight:600;color:#667085;display:flex;gap:8px;align-items:center}
.views span em{font-style:normal;font-size:12px;padding:0 7px;border-radius:10px;background:#f2f4f7;color:#475467}
.views span.on{color:#101828;box-shadow:inset 0 -2px 0 #191936}
.views span.on em{background:#191936;color:#fff}
.pipe{display:grid;grid-template-columns:repeat(6,1fr);margin:18px 0 16px;border:1px solid #eaecf0;border-radius:10px;overflow:hidden}
.pipe div{padding:12px 16px;border-right:1px solid #eaecf0}
.pipe div:first-child{border:0}
.pipe span{display:block;font-size:13px;color:#667085;font-weight:500}
.pipe strong{font-size:22px;font-weight:700;color:#101828;line-height:1.3}
.pipe small{font-size:12px;color:#b42318;font-weight:600;margin-right:6px}
.pipe .on{background:#f9fafb;box-shadow:inset 0 -2px 0 #191936}
.bar{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.fi{height:34px;padding:0 12px;border-radius:8px;border:1px solid #d0d5dd;display:inline-flex;align-items:center;gap:8px;font-size:13.5px;color:#344054;font-weight:500;background:#fff}
.fi svg{color:#667085}
.fi.on{border-color:#191936;background:#f8f8fb;color:#191936}
.fi.s{width:300px;color:#98a2b3;font-weight:400}
.sp{flex:1}
table{width:100%;border-collapse:collapse}
th{text-align:right;font-size:12.5px;font-weight:600;color:#667085;padding:10px 12px;background:#f9fafb;border-top:1px solid #eaecf0;border-bottom:1px solid #eaecf0}
td{padding:11px 12px;border-bottom:1px solid #f2f4f7;vertical-align:middle;font-size:14px}
td b{display:block;font-weight:600;color:#101828}
td small{display:block;font-size:12.5px;color:#667085}
.st{display:inline-flex;align-items:center;gap:7px;font-weight:500}
.st .dt{width:7px;height:7px;border-radius:50%;background:#1d70b7;flex:none}
.st.r{color:#b42318}.st.r .dt{background:#f04438}
.ck{width:16px;height:16px;border:1.5px solid #d0d5dd;border-radius:4px;display:inline-block}
.pg{display:flex;align-items:center;justify-content:space-between;padding:12px 0;color:#667085;font-size:13.5px}
.pg .ps{display:flex;gap:4px}
.pg .ps span{min-width:32px;height:32px;border-radius:8px;display:grid;place-items:center;font-weight:600}
.pg .ps span.on{background:#f2f4f7;color:#101828}
/* detail */
.alert{display:flex;align-items:center;gap:10px;margin-top:18px;padding:11px 14px;border-radius:8px;background:#fef3f2;border:1px solid #fecdca;color:#b42318;font-weight:500}
.alert .lnk{margin-right:auto;color:#b42318}
.steps{display:flex;margin:22px 0 6px;padding:18px 20px;border:1px solid #eaecf0;border-radius:10px}
.steps div{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;text-align:center}
.steps div:not(:last-child):after{content:"";position:absolute;top:13px;right:calc(50% + 18px);left:calc(-50% + 18px);height:2px;background:#eaecf0}
.steps div.d:not(:last-child):after{background:#191936}
.steps i{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:12.5px;font-weight:700;background:#f2f4f7;color:#667085;position:relative;z-index:1}
.steps .d i{background:#191936;color:#fff}
.steps .x i{background:#fff;color:#b42318;box-shadow:0 0 0 2px #f04438,0 0 0 6px #fef3f2}
.steps b{font-size:13px;font-weight:600;color:#101828}
.steps small{font-size:12px;color:#667085}
.steps .x small{color:#b42318;font-weight:600}
.cols{display:grid;grid-template-columns:1fr 400px;gap:24px;margin-top:20px}
.sec{border:1px solid #eaecf0;border-radius:10px;margin-bottom:16px}
.sec h3{font-size:15px;font-weight:700;color:#101828;padding:14px 18px;border-bottom:1px solid #f2f4f7;display:flex;justify-content:space-between;align-items:center}
.dl{display:grid;grid-template-columns:repeat(3,1fr);padding:6px 18px 14px}
.dl div{padding:10px 0}
.dl span{display:block;font-size:12.5px;color:#667085}
.dl b{font-weight:600;color:#101828}
.ppl{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px 18px}
.pp{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #f2f4f7;border-radius:10px}
.pp b{display:block;color:#101828;font-weight:600}
.pp small{color:#667085;font-size:12.5px}
.money{display:grid;grid-template-columns:repeat(3,1fr);padding:14px 18px 6px}
.money span{display:block;font-size:12.5px;color:#667085}
.money b{font-size:20px;font-weight:700;color:#101828}
.money b em{font-style:normal;font-size:12px;color:#667085;font-weight:500;margin-right:4px}
.pb{height:6px;border-radius:3px;background:#f2f4f7;margin:6px 18px 16px;overflow:hidden}
.pb i{display:block;height:100%;width:30%;background:#191936;border-radius:3px}
.tl{padding:6px 18px 14px}
.tl>div{display:flex;gap:12px;padding:10px 0;position:relative}
.tl>div:not(:last-child):after{content:"";position:absolute;right:4px;top:26px;bottom:-4px;width:1px;background:#eaecf0}
.tl i{width:9px;height:9px;border-radius:50%;background:#d0d5dd;margin-top:7px;flex:none}
.tl>div:first-child i{background:#191936}
.tl b{display:block;font-weight:600;color:#101828;font-size:13.5px}
.tl small{color:#667085;font-size:12.5px}
/* form */
.fw{display:grid;grid-template-columns:1fr 260px;gap:40px;margin-top:22px}
.fs{padding:20px 0 24px;border-top:1px solid #eaecf0}
.fs:first-child{border-top:0;padding-top:4px}
.fs .t{display:grid;grid-template-columns:240px 1fr;gap:32px}
.fs h3{font-size:15.5px;font-weight:700;color:#101828}
.fs p.d{font-size:13px;color:#667085;margin-top:2px}
.g{display:grid;grid-template-columns:1fr 1fr;gap:16px 18px}
.f label{display:block;font-size:13.5px;font-weight:600;color:#344054;margin-bottom:6px}
.f label em{color:#b42318;font-style:normal}
.in{height:40px;border:1px solid #d0d5dd;border-radius:8px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;color:#101828;font-size:14px;background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.in.ph{color:#98a2b3}
.in.err{border-color:#fda29b}
.in .u{color:#667085;font-size:13px;border-right:1px solid #eaecf0;padding-right:10px;height:100%;display:flex;align-items:center}
.f .h{font-size:12.5px;color:#667085;margin-top:5px}
.f .e{font-size:12.5px;color:#b42318;margin-top:5px;font-weight:500}
.chs{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ch{border:1px solid #d0d5dd;border-radius:10px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start}
.ch .o{width:16px;height:16px;border-radius:50%;border:1.5px solid #d0d5dd;margin-top:3px;flex:none}
.ch b{display:block;color:#101828;font-weight:600}
.ch small{color:#667085;font-size:12.5px}
.ch.on{border-color:#191936;box-shadow:0 0 0 1px #191936;background:#fafafc}
.ch.on .o{border:5px solid #191936}
.idx{position:relative}
.idx p{font-size:12px;font-weight:600;color:#98a2b3;margin-bottom:8px}
.idx a{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;color:#475467;font-weight:500;text-decoration:none;font-size:13.5px}
.idx a i{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:11px;font-weight:700;background:#f2f4f7;color:#667085}
.idx a.dn i{background:#12b76a;color:#fff}
.idx a.on{background:#f9fafb;color:#101828;font-weight:600}
.idx a small{margin-right:auto;font-size:12px;color:#98a2b3}
.sum{margin-top:18px;border:1px solid #eaecf0;border-radius:10px;padding:14px 16px}
.sum h4{font-size:13px;color:#667085;font-weight:600;margin-bottom:8px}
.sum div{display:flex;justify-content:space-between;font-size:13.5px;padding:4px 0}
.sum div span{color:#667085}
.sum div b{color:#101828;font-weight:600}
.sum .tot{border-top:1px solid #f2f4f7;margin-top:6px;padding-top:8px}
.fbar{height:64px;flex:none;border-top:1px solid #eaecf0;display:flex;align-items:center;gap:10px;padding:0 36px;background:#fff}
.fbar .w{color:#b54708;font-weight:500;display:flex;align-items:center;gap:8px}
'''

def sidebar(active):
    items = [('الرئيسية','home',None,None),None,('الطلبات','inbox','12',None),('عقود الاستقدام','file','34',None),('السير الذاتية','id','820',None),('العملاء','users',None,None),'التأجير',('عقود التأجير','hand','22',None),('الزيارات بالساعة','clock','26','r'),'التشغيل',('الإيواء','house','14',None),('الشكاوى','headset','5','r'),'المالية والإدارة',('التعميدات','wallet','9','r'),('الإعدادات','cog',None,None)]
    out = [f'<aside class="sb"><img src="{logo}" alt="أسس الإنجاز">']
    for it in items:
        if it is None: out.append('<div class="grp">الاستقدام</div>'); continue
        if isinstance(it,str): out.append(f'<div class="grp">{it}</div>'); continue
        label,icon,c,tone = it
        cls = ' class="on"' if label==active else ''
        cc = f'<span class="c{" r" if tone else ""} n">{c}</span>' if c else ''
        out.append(f'<a{cls}>{ic(icon)}<span>{label}</span>{cc}</a>')
    out.append('<div class="me"><span class="av" style="background:#191936;color:#fff">م</span><div><b>مشرف</b><span>مدير النظام</span></div></div></aside>')
    return ''.join(out)

def topbar(crumbs):
    c = '<span>/</span>'.join(f'<b>{x}</b>' if i==len(crumbs)-1 else f'<span>{x}</span>' for i,x in enumerate(crumbs))
    return f'<div class="tb"><div class="crumb">{c}</div><div class="srch">{ic("search",16)}ابحث برقم العقد أو الجوال أو الاسم<kbd>/</kbd></div><span class="ib">{ic("bell")}<i></i></span></div>'

ROWS = [
 ('#335','2026-10-19','العنود الحربي','056 ••• 1139','#ecfdf3','#067647','FATIMA MENDOZA','إندونيسيا · L6124802','التفويض · متأخر 7 أيام','r','سلطان الزهراني'),
 ('#284','2026-10-30','عبير الشهري','056 ••• 7572','#fdf2fa','#c11574','HELEN CRUZ','سريلانكا · Z9497482','التفويض · متأخر 4 أيام','r','ريم العتيبي'),
 ('#277','2026-10-20','تركي القحطاني','058 ••• 6966','#eef4ff','#3538cd','JOY TESFAYE','كينيا · Y5973497','التفويض · متأخر 8 أيام','r','نورة الحربي'),
 ('#246','2026-10-25','ماجد السهلي','050 ••• 3461','#fffaeb','#b54708','HANA WANJIRU','إثيوبيا · X1817562','التفويض · منذ 5 أيام','','فهد الدوسري'),
 ('#222','2026-10-19','خالد الشهري','057 ••• 4183','#f0f9ff','#026aa2','MARIA SANTOS','كينيا · P0409890','التفويض · منذ 7 أيام','','سارة أحمد'),
 ('#201','2026-11-13','سلمان السبيعي','054 ••• 9621','#f4f3ff','#5925dc','HANA REYES','الفلبين · M8449308','التفويض · منذ يومين','','ريم العتيبي'),
 ('#175','2026-11-02','ريم المطيري','055 ••• 2210','#ecfdf3','#067647','DIANA PERERA','سريلانكا · K3305127','التفويض · منذ 3 أيام','','نورة الحربي'),
]
def list_screen():
    rows=''.join(f'<tr><td style="width:36px"><span class="ck"></span></td><td><b class="n" style="text-align:right">{r[0]}</b><small class="n" style="text-align:right">{r[1]}</small></td>'
                 f'<td><div style="display:flex;gap:10px;align-items:center"><span class="av" style="background:{r[4]};color:{r[5]}">{r[2][0]}</span><div><b>{r[2]}</b><small class="n" style="text-align:right">{r[3]}</small></div></div></td>'
                 f'<td><b>{r[6]}</b><small>{r[7]}</small></td><td><span class="st {r[9]}"><i class="dt"></i><span>{r[8]}</span></span></td><td>{r[10]}</td>'
                 f'<td style="text-align:left"><span class="lnk">نقل إلى التفييز {ic("left",15)}</span></td><td style="width:36px;color:#98a2b3">{ic("more")}</td></tr>' for r in ROWS)
    return f'''<div class="screen" data-name="1 — قائمة عقود الاستقدام">{sidebar("عقود الاستقدام")}<div class="mn">{topbar(["الاستقدام","عقود الاستقدام"])}<div class="ct">
<div class="hd"><div><h1>عقود الاستقدام</h1><p class="sub"><span class="n">34</span> عقدًا نشطًا · <span class="r"><span class="n">4</span> متأخرة عن مدة المرحلة</span></p></div>
<div class="acts"><span class="btn">{ic("export",16)}تصدير</span><span class="btn p">{ic("plus",16)}عقد استقدام جديد</span></div></div>
<div class="views"><span class="on">النشطة <em class="n">34</em></span><span>تحت الضمان <em class="n">89</em></span><span>المنتهية <em class="n">95</em></span><span>الكل <em class="n">218</em></span></div>
<div class="pipe"><div><span>جديد</span><strong class="n">6</strong></div><div><span>مساند</span><strong class="n">9</strong><small>1 متأخر</small></div><div class="on"><span>التفويض</span><strong class="n">7</strong><small>3 متأخرة</small></div><div><span>التفييز</span><strong class="n">5</strong></div><div><span>التذكرة</span><strong class="n">4</strong></div><div><span>الوصول</span><strong class="n">3</strong></div></div>
<div class="bar"><span class="fi s">{ic("search",16)}رقم العقد، مساند، العميل أو العاملة</span><span class="fi">{ic("cal",16)}تاريخ العقد: كل الوقت{ic("down",14)}</span><span class="fi on">مدة المرحلة: تجاوزت المدة {ic("x",14)}</span><span class="fi">الجنسية{ic("down",14)}</span><span class="fi">المسوّق{ic("down",14)}</span><span class="sp"></span><span class="fi">{ic("sliders",16)}فلاتر أخرى</span></div>
<table><thead><tr><th></th><th>العقد</th><th>العميل</th><th>العاملة</th><th>المرحلة</th><th>المسوّق</th><th style="text-align:left">الإجراء التالي</th><th></th></tr></thead><tbody>{rows}</tbody></table>
<div class="pg"><span>عرض <span class="n">1–7</span> من <span class="n">7</span></span><div class="ps"><span class="on n">1</span></div></div>
</div></div></div>'''

def detail_screen():
    steps=[('جديد','8 نوفمبر','d'),('مساند','10 نوفمبر','d'),('التفويض','متأخر 7 أيام','x'),('التفييز','','') ,('التذكرة','',''),('الوصول','',''),('تحت الضمان','','')]
    st=''.join(f'<div class="{c}"><i>{"✓" if c=="d" else i+1}</i><b>{l}</b><small>{d}</small></div>' for i,(l,d,c) in enumerate(steps))
    tl=[('نُقل العقد إلى مرحلة التفويض','سلطان الزهراني · 11 نوفمبر، 10:24 ص'),('أُدخل رقم عقد مساند 84613792','سلطان الزهراني · 10 نوفمبر، 2:10 م'),('سُجّل سند قبض بمبلغ 6,300 ر.س','المالية · 8 نوفمبر، 11:02 ص'),('أُنشئ العقد','سلطان الزهراني · 8 نوفمبر، 10:47 ص')]
    tlh=''.join(f'<div><i></i><div><b>{a}</b><small>{b}</small></div></div>' for a,b in tl)
    return f'''<div class="screen" data-name="2 — تفاصيل عقد">{sidebar("عقود الاستقدام")}<div class="mn">{topbar(["الاستقدام","عقود الاستقدام","عقد #335"])}<div class="ct">
<div class="hd"><div><h1>عقد <span class="n">#335</span></h1><p class="sub">العنود الحربي · FATIMA MENDOZA · أُنشئ <span class="n">2026-11-08</span></p></div>
<div class="acts"><span class="btn">{ic("print",16)}طباعة العقد</span><span class="btn">{ic("more",16)}</span><span class="btn p">نقل إلى التفييز{ic("left",16)}</span></div></div>
<div class="alert">{ic("alert",18)}تجاوز العقد مدة مرحلة التفويض (7 أيام) بـ 7 أيام.<span class="lnk">سجّل سبب التأخير</span></div>
<div class="steps">{st}</div>
<div class="cols"><div>
<div class="sec"><h3>الأطراف</h3><div class="ppl"><div class="pp"><span class="av" style="background:#ecfdf3;color:#067647;width:42px;height:42px">ع</span><div><b>العنود الحربي</b><small>العميل · <span class="n">056 ••• 1139</span> · الرياض</small></div></div><div class="pp"><span class="av" style="background:#eef4ff;color:#3538cd;width:42px;height:42px">FM</span><div><b>FATIMA MENDOZA</b><small>العاملة · إندونيسيا · <span class="n">L6124802</span></small></div></div></div></div>
<div class="sec"><h3>بيانات العقد<span class="lnk">تعديل</span></h3><div class="dl">
<div><span>رقم مساند</span><b class="n" style="display:block;text-align:right">84613792</b></div><div><span>رقم التأشيرة</span><b class="n" style="display:block;text-align:right">5057409892</b></div><div><span>نوع التأشيرة</span><b>عاملة منزلية</b></div>
<div><span>المكتب الخارجي</span><b>Golden Hands Agency</b></div><div><span>المسوّق</span><b>سلطان الزهراني</b></div><div><span>مدة العقد</span><b>سنتان</b></div></div></div>
<div class="sec"><h3>المالية<span class="lnk">سند قبض</span></h3><div class="money"><div><span>قيمة العقد</span><b class="n">21,000<em>ر.س</em></b></div><div><span>المدفوع</span><b class="n">6,300<em>ر.س</em></b></div><div><span>المتبقي</span><b class="n" style="color:#b42318">14,700<em>ر.س</em></b></div></div><div class="pb"><i></i></div></div>
</div><div><div class="sec"><h3>سجل النشاط</h3><div class="tl">{tlh}</div></div>
<div class="sec"><h3>المرفقات</h3><div class="tl"><div><i style="background:#d0d5dd"></i><div><b>عقد مساند.pdf</b><small>2.1 ميجابايت</small></div></div><div><i style="background:#d0d5dd"></i><div><b>جواز العاملة.jpg</b><small>640 كيلوبايت</small></div></div></div></div></div></div>
</div></div></div>'''

def f(label, val, req=False, ph=False, unit=None, hint=None, err=None, full=False):
    u = f'<span class="u">{unit}</span>' if unit else ''
    h = f'<p class="h">{hint}</p>' if hint else ''
    e = f'<p class="e">{err}</p>' if err else ''
    sty = ' style="grid-column:1/-1"' if full else ''
    return f'<div class="f"{sty}><label>{label}{" <em>*</em>" if req else ""}</label><div class="in{" ph" if ph else ""}{" err" if err else ""}"><span>{val}</span>{u}</div>{h}{e}</div>'

def form_screen():
    s1 = '<div class="chs"><div class="ch on"><span class="o"></span><div><b>عميل مسجّل</b><small>ابحث بالاسم أو الجوال أو الهوية</small></div></div><div class="ch"><span class="o"></span><div><b>عميل جديد</b><small>يُنشأ ملفه مع العقد</small></div></div></div><div class="g" style="margin-top:14px">' + f('العميل','العنود الحربي — 056 ••• 1139',True,full=True) + '</div>'
    s2 = '<div class="chs" style="grid-template-columns:1fr 1fr 1fr"><div class="ch on"><span class="o"></span><div><b>من السير المتاحة</b><small>578 سيرة</small></div></div><div class="ch"><span class="o"></span><div><b>بالمواصفات</b><small>يختار المكتب لاحقًا</small></div></div><div class="ch"><span class="o"></span><div><b>برقم الجواز</b><small>عاملة يعرفها العميل</small></div></div></div><div class="g" style="margin-top:14px">' + f('السيرة الذاتية','‏FATIMA MENDOZA · إندونيسيا · 29 سنة · 1,200 ر.س',True,full=True,hint='تُحجز السيرة لهذا العميل عند حفظ العقد.') + '</div>'
    s3 = '<div class="g">' + f('رقم عقد مساند','84613792',True) + f('تاريخ العقد','2026-11-25',True) + f('رقم التأشيرة','',True,err='هذا الحقل مطلوب') + f('نوع التأشيرة','اختر',True,ph=True) + '</div>'
    s4 = '<div class="g">' + f('قيمة العقد','21,000',True,unit='ر.س',hint='شاملة الضريبة.') + f('المدفوع الآن','6,300',unit='ر.س',hint='يُسجَّل به سند قبض.') + f('المسوّق','سلطان الزهراني',True) + f('مدة العقد','سنتان',True) + '</div>'
    def sec(t,d,b): return f'<div class="fs"><div class="t"><div><h3>{t}</h3><p class="d">{d}</p></div><div>{b}</div></div></div>'
    return f'''<div class="screen" data-name="3 — عقد استقدام جديد">{sidebar("عقود الاستقدام")}<div class="mn">{topbar(["الاستقدام","عقود الاستقدام","عقد استقدام جديد"])}<div class="ct" style="overflow:hidden">
<div class="hd"><div><h1>عقد استقدام جديد</h1><p class="sub">يبدأ العقد في مرحلة «جديد»، ويتنقل بين المراحل من قائمة العقود.</p></div></div>
<div class="fw"><div>{sec("العميل","صاحب التأشيرة.",s1)}{sec("العاملة","اختر طريقة تحديد العاملة.",s2)}{sec("مساند والتأشيرة","من منصة مساند.",s3)}{sec("المالية والمسوّق","قيمة العقد وما دُفع منها.",s4)}</div>
<div class="idx"><p>أقسام النموذج</p><a class="dn"><i>✓</i>العميل</a><a class="dn"><i>✓</i>العاملة</a><a class="on"><i>3</i>مساند والتأشيرة<small>حقلان ناقصان</small></a><a><i>4</i>المالية والمسوّق</a>
<div class="sum"><h4>ملخص العقد</h4><div><span>العميل</span><b>العنود الحربي</b></div><div><span>العاملة</span><b>FATIMA MENDOZA</b></div><div class="tot"><span>القيمة</span><b class="n">21,000 ر.س</b></div><div><span>المدفوع</span><b class="n">6,300 ر.س</b></div><div><span>المتبقي</span><b class="n" style="color:#101828">14,700 ر.س</b></div></div></div></div>
</div><div class="fbar"><span class="w">{ic("alert",18)}حقلان مطلوبان لم يُعبّآ</span><span class="sp"></span><span class="btn" style="border:0;box-shadow:none;color:#475467">إلغاء</span><span class="btn p">{ic("check",16)}إنشاء العقد</span></div></div></div>'''

html = f'''<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>أسس — الاتجاه أ (Cairo)</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap">
<style>{CSS}</style></head><body>{list_screen()}{detail_screen()}{form_screen()}</body></html>'''
out = ROOT/'kit/figma/direction-a.html'
out.write_text(html, encoding='utf-8')
print(out, len(html))
