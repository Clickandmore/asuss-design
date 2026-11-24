#!/usr/bin/env python3
"""Build the redesigned screens (screens/dashboard.html, screens/reports.html).

The sidebar and topbar are defined once here and written into each page as
static HTML, so every screen stays a plain file that maps to one Blade view.
Page content lives in kit/redesign/pages/<slug>.html.

    python3 kit/redesign/build.py
"""
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGES = Path(__file__).resolve().parent / 'pages'

# Departments on the rail → sections in the panel → links.
# link: (label, href, key, count)   count: int, or ('alert', n)
# href '#' = screen not in the kit yet.
DEPTS = [
    ('home', 'الرئيسية', 'fa-house', [
        (None, [
            ('لوحة المعلومات', 'dashboard.html', 'dashboard', None),
            ('التقارير', 'reports.html', 'reports', None),
            ('المهام', 'tasks.html', 'tasks', 6),
            ('التعاميم', '#', None, None),
        ]),
        ('اختصارات', [
            ('عقد استقدام جديد', 'recruitment-contract-create.html', None, None),
            ('عميل جديد', 'client-create.html', 'client-create', None),
            ('سيرة ذاتية جديدة', 'maid-create.html', None, None),
        ]),
    ]),
    ('rec', 'الاستقدام', 'fa-file-signature', [
        ('العملاء والطلبات', [
            ('العملاء', 'clients.html', 'clients', None),
            ('طلبات الاستقدام', 'orders.html', 'orders', 12),
        ]),
        ('العقود حسب المرحلة', [
            ('جميع العقود', 'recruitment-contracts.html', 'recruitment-contracts', 218),
            ('بانتظار الاعتماد', 'recruitment-contracts.html', None, ('alert', 4)),
            ('مساند', 'recruitment-contracts.html', None, 9),
            ('التفويض', 'recruitment-contracts.html', None, 7),
            ('التفييز', 'recruitment-contracts.html', None, 5),
            ('التذكرة', 'recruitment-contracts.html', None, 4),
            ('الوصول', 'recruitment-contracts.html', None, 3),
            ('تحت الضمان', 'recruitment-contracts.html', None, 89),
            ('المرتجعة والملغية', '#', None, None),
        ]),
        ('السير الذاتية', [
            ('جميع السير', 'maids.html', 'maids', 820),
            ('إضافة سيرة', 'maid-create.html', 'maid-create', None),
            ('الحجوزات وجلسات الإرسال', '#', None, None),
            ('باك اوت', '#', None, None),
            ('المعينات', '#', None, None),
        ]),
    ]),
    ('rent', 'التأجير', 'fa-handshake', [
        ('عقود التأجير', [
            ('جميع عقود التأجير', 'rent-contracts.html', 'rent-contracts', 22),
            ('طلبات الإيجار', '#', None, None),
            ('سير الإيجار', '#', None, None),
            ('رواتب العاملات', '#', None, None),
        ]),
        ('نقل الكفالة', [
            ('طلبات النقل', '#', None, None),
            ('فترة التجربة', '#', None, 5),
            ('تم النقل', '#', None, None),
        ]),
        ('التأجير بالساعة', [
            ('لوحة الطلبات', '#', None, None),
            ('الزيارات', 'hourly-visits.html', 'hourly-visits', None),
            ('جدول الموظفين', 'hourly-schedule.html', 'hourly-schedule', None),
            ('الفرق والخدمات', '#', None, None),
        ]),
    ]),
    ('ops', 'التشغيل', 'fa-truck-fast', [
        ('الإيواء', [
            ('داخل الإيواء', 'shelter-contracts.html', 'shelter-contracts', 14),
            ('خارج الإيواء', '#', None, None),
            ('الترحيل والخطابات', '#', None, 3),
            ('مقرات الإيواء', '#', None, None),
        ]),
        ('اللوجستيك والسفر', [
            ('طلبات الرحلات', '#', None, None),
            ('حجوزات الطيران', '#', None, None),
            ('توصيل العاملات', '#', None, None),
            ('الخدمات الطبية', '#', None, None),
        ]),
        ('سجلات', [
            ('تأشيرات الشركة', '#', None, None),
            ('الأرشيف الإلكتروني', '#', None, None),
        ]),
    ]),
    ('care', 'العملاء', 'fa-headset', [
        ('خدمة ما بعد البيع', [
            ('الشكاوى', 'complaints.html', 'complaints', ('alert', 5)),
            ('شكاوى الخارجية', '#', None, None),
            ('تحويلات العملاء', '#', None, None),
            ('طلبات الاسترجاع', '#', None, None),
        ]),
        ('التواصل', [
            ('التقييمات', '#', None, None),
            ('الرسائل', '#', None, None),
        ]),
    ]),
    ('fin', 'المالية', 'fa-wallet', [
        ('التعميدات', [
            ('كل التعميدات', 'finance-claims.html', 'finance-claims', None),
            ('بانتظار الاعتماد', 'finance-claims.html', None, ('alert', 9)),
            ('الرسوم الحكومية', 'finance-claims.html', None, None),
        ]),
        ('الحسابات', [
            ('مالية العقود', '#', None, None),
            ('مالية التأجير', '#', None, None),
            ('مالية النقل والخارجية', '#', None, None),
            ('مدفوعات البوابات', '#', None, None),
            ('العهد والأصول', '#', None, None),
        ]),
    ]),
    ('admin', 'الإدارة', 'fa-sliders', [
        ('فريق العمل', [
            ('الموظفون', 'employees.html', 'employees', 39),
            ('المستخدمون', 'admins.html', 'admins', None),
            ('الصلاحيات', '#', None, None),
            ('سجل النشاط', '#', None, None),
        ]),
        ('الإعدادات', [
            ('إعدادات النظام', 'settings.html', 'settings', None),
            ('البيانات الأساسية', '#', None, None),
            ('محتوى الموقع', '#', None, None),
            ('الترجمة والنصوص', '#', None, None),
        ]),
    ]),
]

e = html.escape


def count_html(c):
    if c is None:
        return ''
    alert = isinstance(c, tuple)
    n = c[1] if alert else c
    cls = 'as-nav__count as-nav__count--alert' if alert else 'as-nav__count'
    return f'<span class="{cls} as-num">{n:,}</span>'


def dept_of(active):
    for dept, _, _, sections in DEPTS:
        for _, links in sections:
            if any(k == active for _, _, k, _ in links if k):
                return dept
    return 'home'


def sidebar(active):
    """Rail (departments) + panel (pages of each department, one shown at a time)."""
    cur = dept_of(active)
    rail, panes = [], []
    for dept, name, icon, sections in DEPTS:
        on = dept == cur
        alerts = sum(c[1] for _, links in sections for _, _, _, c in links if isinstance(c, tuple))
        dot = f'<span class="as-rail__dot as-num">{alerts}</span>' if alerts else ''
        rail.append(f'<li><button class="as-rail__btn{" is-active" if on else ""}" type="button" data-dept="{dept}" '
                    f'aria-pressed="{"true" if on else "false"}" title="{e(name)}"><i class="fa-solid {icon}" aria-hidden="true"></i>'
                    f'<span>{e(name)}</span>{dot}</button></li>')
        out = [f'<section class="as-pane" data-dept="{dept}"{"" if on else " hidden"} aria-label="{e(name)}">',
               f'<p class="as-pane__title">{e(name)}</p>']
        for title, links in sections:
            out.append('<div class="as-nav__group">')
            if title:
                out.append(f'<p class="as-nav__label">{e(title)}</p>')
            out.append('<ul>')
            for label, href, key, count in links:
                is_cur = key == active and key
                cls = 'as-nav__link is-active' if is_cur else 'as-nav__link'
                aria = ' aria-current="page"' if is_cur else ''
                out.append(f'<li class="as-nav__item"><a class="{cls}" href="{href}"{aria}>'
                           f'<span class="as-nav__text">{e(label)}</span>{count_html(count)}</a></li>')
            out.append('</ul></div>')
        out.append('</section>')
        panes.append('\n'.join(out))
    cur_name = [n for d, n, _, _ in DEPTS if d == cur][0]
    return '\n'.join(rail), '\n'.join(panes), cur_name


SHELL = '''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | أسس الإنجاز للاستقدام</title>
<link rel="icon" href="../assets/admin/assets/img/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="../assets/admin/custom/kit-overrides.css">
</head>
<body class="as-app">
<a class="as-sr" href="#as-content">تخطَّ إلى المحتوى</a>
<div class="as-layout">

<aside class="as-sidebar" aria-label="القائمة الرئيسية">
  <div class="as-rail">
    <a class="as-rail__logo" href="dashboard.html" aria-label="أسس الإنجاز — لوحة المعلومات"><img src="../assets/web/assets/images/logo-mark-white.svg" alt=""></a>
    <ul class="as-rail__list">
{rail}
    </ul>
    <div class="as-rail__foot">
      <button class="as-rail__btn as-rail__toggle" type="button" data-as-toggle-panel aria-label="إخفاء أو إظهار القائمة" title="إخفاء أو إظهار القائمة"><i class="fa-solid fa-table-columns" aria-hidden="true"></i></button>
      <a class="as-rail__me" href="login.html" title="مشرف · تسجيل الخروج"><span class="as-avatar">م</span></a>
    </div>
  </div>
  <div class="as-panel">
    <div class="as-panel__head">
      <img class="as-panel__logo" src="../assets/web/assets/images/logoh.svg" alt="أسس الإنجاز للاستقدام">
      <button class="as-iconbtn as-sidebar__close" type="button" data-as-close-nav aria-label="إغلاق القائمة"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="as-sidebar__search">
      <label class="as-search">
        <span class="as-sr">ابحث في كل الأقسام</span>
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input id="as-nav-search" type="search" placeholder="ابحث في كل الأقسام" autocomplete="off">
        <kbd aria-hidden="true">/</kbd>
      </label>
    </div>
    <nav class="as-nav" data-current="{cur_dept}">
{panes}
      <p class="as-nav__empty">لا توجد نتيجة. جرّب كلمة أخرى.</p>
    </nav>
  </div>
</aside>
<div class="as-overlay" aria-hidden="true"></div>

<div class="as-main">
  <header class="as-topbar">
    <button class="as-iconbtn as-topbar__menu" type="button" data-as-open-nav aria-label="فتح القائمة"><i class="fa-solid fa-bars"></i></button>
    <div class="as-topbar__title">
      <ol class="as-crumbs">{crumbs}</ol>
      <h1>{title}</h1>
    </div>
    <label class="as-search as-topbar__search">
      <span class="as-sr">بحث عام</span>
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      <input type="search" placeholder="ابحث برقم العقد أو اسم العميل أو الجوال">
    </label>
    <div class="as-topbar__actions">
      <div class="as-dd">
        <button class="as-btn as-btn--primary as-topbar__new" type="button" data-as-dd aria-expanded="false" aria-haspopup="true"><i class="fa-solid fa-plus"></i><span>جديد</span></button>
        <div class="as-dd__menu">
          <a href="recruitment-contract-create.html"><i class="fa-solid fa-file-signature"></i>عقد استقدام</a>
          <a href="#" data-route="/admin/RentContract/create"><i class="fa-solid fa-handshake"></i>عقد تأجير</a>
          <a href="client-create.html"><i class="fa-solid fa-user-plus"></i>عميل</a>
          <a href="maid-create.html"><i class="fa-solid fa-id-card"></i>سيرة ذاتية</a>
          <div class="as-dd__sep"></div>
          <a href="#" data-route="/admin/complaints/create"><i class="fa-solid fa-triangle-exclamation"></i>شكوى</a>
          <a href="#" data-route="/admin/tasks/create"><i class="fa-solid fa-list-check"></i>مهمة</a>
        </div>
      </div>
      <div class="as-dd">
        <button class="as-iconbtn" type="button" data-as-dd aria-expanded="false" aria-label="الإشعارات، 3 جديدة"><i class="fa-regular fa-bell"></i><span class="as-dot"></span></button>
        <div class="as-dd__menu" style="min-width:300px">
          <p class="as-dd__head">الإشعارات</p>
          <a href="recruitment-contracts.html"><i class="fa-solid fa-file-signature"></i>4 عقود بانتظار اعتمادك</a>
          <a href="complaints.html"><i class="fa-solid fa-triangle-exclamation"></i>شكوى جديدة على عقد #241</a>
          <a href="tasks.html"><i class="fa-solid fa-list-check"></i>أُسندت إليك مهمتان جديدتان</a>
        </div>
      </div>
      <div class="as-dd">
        <button class="as-iconbtn" type="button" data-as-dd aria-expanded="false" aria-label="حسابي"><span class="as-avatar" style="width:32px;height:32px;font-size:13px">م</span></button>
        <div class="as-dd__menu">
          <p class="as-dd__head">مشرف · مدير النظام</p>
          <a href="#" data-route="/admin/profile"><i class="fa-regular fa-user"></i>ملفي الشخصي</a>
          <a href="settings.html"><i class="fa-solid fa-gear"></i>الإعدادات</a>
          <a href="#" data-route="/lang/en"><i class="fa-solid fa-language"></i>English</a>
          <div class="as-dd__sep"></div>
          <a href="login.html"><i class="fa-solid fa-arrow-right-from-bracket fa-flip-horizontal"></i>تسجيل الخروج</a>
        </div>
      </div>
    </div>
  </header>

  <main class="as-content" id="as-content">
{body}
  </main>
  <footer class="as-footer">© <span data-as-year>2026</span> شركة أسس الإنجاز للاستقدام</footer>
</div>
</div>
<script src="../assets/admin/custom/asuss-ui.js"></script>
{scripts}
<script src="../kit/kit.js"></script>
</body>
</html>
'''

SCREENS = {
    'dashboard': {'title': 'لوحة المعلومات', 'crumbs': ['الرئيسية']},
    'reports': {'title': 'التقارير', 'crumbs': ['الرئيسية', 'التقارير']},
}


def build():
    for slug, meta in SCREENS.items():
        src = (PAGES / f'{slug}.html').read_text(encoding='utf-8')
        body, _, scripts = src.partition('<!-- scripts -->')
        crumbs = ''.join(f'<li>{e(c)}</li>' for c in meta['crumbs'])
        rail, panes, _ = sidebar(slug)
        page = SHELL.format(title=e(meta['title']), crumbs=crumbs, rail=rail, panes=panes, cur_dept=dept_of(slug),
                            body=body.strip(), scripts=scripts.strip())
        (ROOT / 'screens' / f'{slug}.html').write_text(page, encoding='utf-8')
        print('wrote screens/%s.html' % slug)


if __name__ == '__main__':
    build()
