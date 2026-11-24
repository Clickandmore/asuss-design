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

# (label, icon, href, key, count, children)   count: int, or ('alert', n)
# href '#' = screen not in the kit yet; data-route keeps the asuss route when known.
MENU = [
    ('عام', [
        ('لوحة المعلومات', 'fa-gauge-high', 'dashboard.html', 'dashboard', None, None),
        ('التقارير', 'fa-chart-column', 'reports.html', 'reports', None, None),
        ('المهام', 'fa-list-check', 'tasks.html', 'tasks', 6, None),
    ]),
    ('الاستقدام', [
        ('العملاء', 'fa-user-group', 'clients.html', 'clients', None, None),
        ('طلبات الاستقدام', 'fa-cart-shopping', None, None, None, [
            ('جميع الطلبات', 'orders.html', 'orders', None),
            ('الطلبات الجديدة', 'orders.html', None, 12),
            ('تم التعاقد', 'orders.html', None, None),
            ('غير مكتملة', '#', None, None),
        ]),
        ('عقود الاستقدام', 'fa-file-signature', None, None, None, [
            ('عقد استقدام جديد', 'recruitment-contract-create.html', 'recruitment-contract-create', None),
            ('جميع العقود', 'recruitment-contracts.html', 'recruitment-contracts', None),
            ('بانتظار الاعتماد', 'recruitment-contracts.html', None, ('alert', 4)),
            ('مساند', 'recruitment-contracts.html', None, 9),
            ('التفويض', 'recruitment-contracts.html', None, 7),
            ('التفييز', 'recruitment-contracts.html', None, 5),
            ('التذكرة', 'recruitment-contracts.html', None, 4),
            ('مرحلة الوصول', 'recruitment-contracts.html', None, 3),
            ('تحت الضمان', 'recruitment-contracts.html', None, 89),
            ('المكتملة', 'recruitment-contracts.html', None, None),
            ('المرتجعة والملغية', '#', None, None),
        ]),
        ('السير الذاتية', 'fa-id-card', None, None, None, [
            ('إضافة سيرة ذاتية', 'maid-create.html', 'maid-create', None),
            ('جميع السير', 'maids.html', 'maids', None),
            ('السير المتاحة', '#', None, 578),
            ('الحجوزات', '#', None, None),
            ('جلسات الإرسال', '#', None, None),
            ('باك اوت', '#', None, None),
        ]),
        ('المعينات', 'fa-user-tag', '#', None, None, None),
    ]),
    ('التأجير ونقل الكفالة', [
        ('عقود التأجير', 'fa-handshake', None, None, None, [
            ('عقد تأجير جديد', '#', None, None),
            ('جميع عقود التأجير', 'rent-contracts.html', 'rent-contracts', None),
            ('طلبات الإيجار', '#', None, None),
            ('سير الإيجار', '#', None, None),
            ('رواتب عاملات التأجير', '#', None, None),
        ]),
        ('نقل الكفالة', 'fa-right-left', None, None, None, [
            ('طلبات نقل الكفالة', '#', None, None),
            ('إضافة طلب نقل', '#', None, None),
            ('فترة التجربة', '#', None, 5),
            ('تم النقل', '#', None, None),
        ]),
        ('التأجير بالساعة', 'fa-clock', None, None, None, [
            ('لوحة الطلبات', '#', None, None),
            ('الزيارات', 'hourly-visits.html', 'hourly-visits', None),
            ('جدول الموظفين', 'hourly-schedule.html', 'hourly-schedule', None),
            ('الفرق والسائقون', '#', None, None),
            ('الخدمات والباقات', '#', None, None),
        ]),
    ]),
    ('التشغيل', [
        ('الإيواء', 'fa-house-chimney-user', None, None, None, [
            ('داخل الإيواء', 'shelter-contracts.html', 'shelter-contracts', 14),
            ('خارج الإيواء', '#', None, None),
            ('مرحلة الترحيل', '#', None, 3),
            ('خطابات الترحيل والتمديد', '#', None, None),
            ('مقرات الإيواء', '#', None, None),
        ]),
        ('الخدمات اللوجستية', 'fa-truck', None, None, None, [
            ('لوحة اللوجستيك', '#', None, None),
            ('طلبات الرحلات', '#', None, None),
            ('حجوزات الطيران', '#', None, None),
            ('توصيل العاملات', '#', None, None),
            ('الخدمات الطبية', '#', None, None),
        ]),
        ('تأشيرات الشركة', 'fa-passport', '#', None, None, None),
        ('الأرشيف الإلكتروني', 'fa-box-archive', '#', None, None, None),
    ]),
    ('خدمة العملاء', [
        ('الشكاوى', 'fa-triangle-exclamation', 'complaints.html', 'complaints', ('alert', 5), None),
        ('تحويلات العملاء', 'fa-shuffle', '#', None, None, None),
        ('طلبات الاسترجاع', 'fa-rotate-left', '#', None, None, None),
        ('التقييمات', 'fa-star-half-stroke', '#', None, None, None),
    ]),
    ('المالية', [
        ('التعميدات المالية', 'fa-receipt', 'finance-claims.html', 'finance-claims', None, None),
        ('المالية والحسابات', 'fa-building-columns', None, None, None, [
            ('مالية العقود', '#', None, None),
            ('مالية التأجير', '#', None, None),
            ('مالية النقل', '#', None, None),
            ('مالية الخارجية', '#', None, None),
            ('مكافآت وخصميات الموظفين', '#', None, None),
        ]),
        ('مدفوعات البوابات', 'fa-credit-card', '#', None, None, None),
        ('العهد والأصول', 'fa-laptop', '#', None, None, None),
    ]),
    ('الإدارة', [
        ('الموظفون', 'fa-id-badge', 'employees.html', 'employees', None, None),
        ('المستخدمون والصلاحيات', 'fa-user-shield', None, None, None, [
            ('المستخدمون', 'admins.html', 'admins', None),
            ('الصلاحيات', '#', None, None),
            ('سجل النشاط', '#', None, None),
        ]),
        ('التعاميم', 'fa-bullhorn', '#', None, None, None),
        ('الرسائل', 'fa-paper-plane', '#', None, None, None),
        ('البيانات الأساسية', 'fa-database', None, None, None, [
            ('الجنسيات', '#', None, None),
            ('المهن', '#', None, None),
            ('مكاتب الاستقدام', '#', None, None),
            ('الباقات', '#', None, None),
            ('الدول والمدن', '#', None, None),
        ]),
        ('الموقع والإعدادات', 'fa-gear', None, None, None, [
            ('إعدادات النظام', 'settings.html', 'settings', None),
            ('محتوى الموقع', '#', None, None),
            ('صفحات التطبيق', '#', None, None),
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


def sidebar(active):
    out = []
    gid = 0
    for label, items in MENU:
        out.append(f'<li class="as-nav__group"><p class="as-nav__label">{e(label)}</p><ul>')
        for text, icon, href, key, count, children in items:
            icon_html = f'<span class="as-nav__icon"><i class="fa-solid {icon}" aria-hidden="true"></i></span>'
            if children is None:
                cur = key == active
                cls = 'as-nav__link is-active' if cur else 'as-nav__link'
                aria = ' aria-current="page"' if cur else ''
                out.append(f'<li class="as-nav__item"><a class="{cls}" href="{href}"{aria}>{icon_html}'
                           f'<span class="as-nav__text">{e(text)}</span>{count_html(count)}</a></li>')
                continue
            gid += 1
            has_active = any(k == active and k for _, _, k, _ in children)
            li_cls = 'as-nav__item is-open has-active' if has_active else 'as-nav__item'
            out.append(f'<li class="{li_cls}"><button class="as-nav__link" type="button" aria-expanded="{"true" if has_active else "false"}" '
                       f'aria-controls="as-sub-{gid}">{icon_html}<span class="as-nav__text">{e(text)}</span>'
                       f'<i class="fa-solid fa-chevron-right as-nav__chev" aria-hidden="true"></i></button>'
                       f'<ul class="as-nav__sub" id="as-sub-{gid}">')
            for ctext, chref, ckey, ccount in children:
                cur = ckey == active and ckey
                cls = 'as-nav__link is-active' if cur else 'as-nav__link'
                aria = ' aria-current="page"' if cur else ''
                out.append(f'<li class="as-nav__item"><a class="{cls}" href="{chref}"{aria}>'
                           f'<span class="as-nav__text">{e(ctext)}</span>{count_html(ccount)}</a></li>')
            out.append('</ul></li>')
        out.append('</ul></li>')
    return '\n'.join(out)


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
  <div class="as-sidebar__brand">
    <a href="dashboard.html" aria-label="أسس الإنجاز للاستقدام — لوحة المعلومات"><img src="../assets/web/assets/images/logoh.svg" alt="أسس الإنجاز للاستقدام"></a>
    <button class="as-iconbtn as-sidebar__close" type="button" data-as-close-nav aria-label="إغلاق القائمة"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <div class="as-sidebar__search">
    <label class="as-search">
      <span class="as-sr">ابحث في القائمة</span>
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      <input id="as-nav-search" type="search" placeholder="ابحث في القائمة" autocomplete="off">
      <kbd aria-hidden="true">/</kbd>
    </label>
  </div>
  <nav class="as-nav">
    <ul>
{sidebar}
    </ul>
    <p class="as-nav__empty">لا توجد نتيجة. جرّب كلمة أخرى.</p>
  </nav>
  <div class="as-sidebar__user">
    <span class="as-avatar" aria-hidden="true">م</span>
    <div class="as-sidebar__who"><strong>مشرف</strong><span>مدير النظام</span></div>
    <a class="as-iconbtn" href="login.html" aria-label="تسجيل الخروج" title="تسجيل الخروج"><i class="fa-solid fa-arrow-right-from-bracket fa-flip-horizontal"></i></a>
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
        page = SHELL.format(title=e(meta['title']), crumbs=crumbs, sidebar=sidebar(slug),
                            body=body.strip(), scripts=scripts.strip())
        (ROOT / 'screens' / f'{slug}.html').write_text(page, encoding='utf-8')
        print('wrote screens/%s.html' % slug)


if __name__ == '__main__':
    build()
