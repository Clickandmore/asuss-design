# نظام التصميم — لوحة تحكم أسس

> **التصميم الجديد (من 24-11-2026):** المرجع هو نظام التصميم «أسس الإنجاز» (claude.ai artifact، `tokens.json`). طُبّق على تسجيل الدخول ولوحة المعلومات والتقارير والقائمة الجانبية، في `assets/admin/custom/kit-overrides.css` و`asuss-ui.js`. انظر القسم الأخير «التصميم الجديد». باقي هذا الملف يصف التصميم القديم الذي ما زال في بقية الشاشات.

# التصميم الحالي (القديم)

وصف لما هو موجود فعلًا في asuss اليوم (24-11-2026)، وليس لما يجب أن يكون. هو نقطة البداية للتصحيح.

## الأساس

- **القالب:** Luno (Bootstrap 5)، الثيم `theme-blue` (`<body data-luno="theme-blue">`).
- **الاتجاه:** عربي RTL افتراضيًا (`<html dir="rtl">` + `body.rtl_mode`)، مع إمكانية الإنجليزي LTR.
- **الأيقونات:** Font Awesome 6.5.1 من CDN، مع Font Awesome 4.7 داخل luno-style.css.
- **المكتبات المرئية:** DataTables 1.12، Select2، Dropify (رفع الملفات)، SweetAlert2، jQuery Toast، TinyMCE.

## ترتيب ملفات CSS (من الأقدم للأحدث، كل ملف يغطي ما قبله)

| # | الملف (تحت `assets/`) | الأسطر | الدور |
|---|---|---|---|
| 1 | `admin/assets/cssbundle/select2.min.css` | — | مكتبة |
| 2 | `admin/assets/vendor/toster/css/jquery.toast.css` | — | مكتبة |
| 3 | Font Awesome 6.5.1 (CDN) | — | أيقونات |
| 4 | `admin/assets/css/luno-style.css` | 36,313 | القالب الأساسي، بما فيه Bootstrap. **لا يُعدّل** |
| 5 | `admin/assets/css/custom.css` | 58 | تعديلات قديمة صغيرة |
| 6 | `admin/assets/css/sidebar-custom.css` | 317 | القائمة الجانبية (متغيرات `--sb-*`) |
| 7 | `admin/assets/cssbundle/dropify.min.css` | — | مكتبة |
| 8 | `admin/custom/style.css` | 743 | تعديلات عامة على القالب |
| 9 | `admin/custom/style-rtl.css` | 83 | الخطوط العربية وتعديلات RTL (للعربي فقط) |
| 10 | `admin/custom/admin-tables.css` | 2,531 | «Admin Tables & Sidebar Design System»: الجداول والبطاقات والفلاتر |
| 11 | `<style>` داخل كل صفحة | 480–1,030 سطرًا لكل صفحة | تنسيقات خاصة بكل شاشة، 9 إلى 17 كتلة لكل صفحة |

ملفات إضافية تُحمّل في بعض الشاشات: `admin/custom/status-badges.css`، `admin/custom/table-actions.css`، `admin/assets/cssbundle/dataTables.min.css`.

**المكان المقترح لأي تعديل جديد:** ملف واحد جديد `admin/custom/kit-overrides.css` يُحمّل بعد `admin-tables.css`، حتى تبقى التعديلات قابلة للنقل لـ asuss كملف واحد.

## الألوان

### متغيرات الثيم (`luno-style.css` → `[data-luno=theme-blue]`)

| المتغير | القيمة | الاستخدام |
|---|---|---|
| `--primary-color` | `#2794eb` | اللون الأساسي (الأزرار، الروابط، العناصر النشطة) |
| `--secondary-color` | `#00AC9A` | الثانوي (فيروزي) |
| `--primary-gradient` | `linear-gradient(145deg, #2794eb, #00AC9A)` | الخلفيات المتدرجة |
| `--chart-color1..5` | `#2794eb` `#6382D8` `#8D61A5` `#90476F` `#00AC9A` | الرسوم البيانية |
| `--body-color` | `#f8f9fa` (معرّف مرتين، الأولى `#f7f6f1`) | خلفية الصفحة |

### القائمة الجانبية (`sidebar-custom.css`)

| المتغير | القيمة |
|---|---|
| `--sb-navy` | `#191936` (العنصر النشط والعناوين) |
| `--sb-blue` | `#1d70b7` |
| `--sb-tint` | `#eef5fb` (خلفية الأيقونات) |
| `--sb-text` | `#4b5563` |
| `--sb-muted` | `#9aa4b2` |

### طبقة الجداول (`admin-tables.css`)

`--contract-primary: #2794eb`، `--contract-primary-dark: #1e7bc8`، `--contract-primary-light: #e3f2fd`، `--contract-success: #48bb78`، `--contract-text: #2d3748`، `--contract-text-muted: #718096`، `--contract-border: #e2e8f0`.
والملف نفسه يعرّف أيضًا ألوان Bootstrap 4 القديمة: `--primary-color: #007bff`، `--success-color: #28a745`، `--danger-color: #dc3545`، `--warning-color: #ffc107`، `--info-color: #17a2b8`.

> **ملاحظة:** يوجد ثلاثة «أزرق أساسي» مستخدمة معًا: `#2794eb` (الثيم)، `#007bff` (Bootstrap 4)، `#0d6efd` (Bootstrap 5). وهذا سبب اختلاف درجات الأزرق بين الشاشات.

## الخطوط

- `style-rtl.css` يعرّف `IBMPlexSansArabic` و`droidarabickufi` من `admin/custom/fonts/`. **المجلد غير موجود في asuss**، فالخطان لا يُحمّلان فعليًا، والمتصفح يعرض خطًا بديلًا. (انظر ISSUES.md #1)
- صفحة تسجيل الدخول (`dashboard/login`) تستخدم IBM Plex Sans Arabic من Google Fonts، وألوانها في `admin/login/css/login.css`: `--brand: #1a5f9e`، `--navy: #191936`، `--navy-2: #1d3360`.

## هوية أسس (من الشعار `web/assets/images/logoh.svg`)

- الشعار بتدرج من الكحلي `#191936` إلى الأزرق `#1D70B7`، وهما نفس `--sb-navy` و`--sb-blue` في القائمة الجانبية.
- الاسم: «شركة أسس الإنجاز للاستقدام».

## الأشكال

- نصف القطر الغالب: `8px` (البطاقات، الحقول، الأزرار)، و`6px` و`4px` للعناصر الصغيرة، و`50%` للصور الرمزية.
- البطاقات: خلفية بيضاء، ظل خفيف، وفي بطاقات الإحصاء حدّ علوي ملوّن بسماكة 4px تقريبًا حسب الحالة.

## المكونات المتكررة (أين تراها في الكيت)

| المكوّن | مثال |
|---|---|
| ترحيب بخلفية متدرجة + أربع أرقام رئيسية | `screens/dashboard.html` |
| بطاقات إحصاء بحد علوي ملوّن وأيقونة | `screens/recruitment-contracts.html`، `screens/clients.html` |
| لوحة فلاتر قابلة للطي + زر «تصفية» و«تفريغ» | `screens/clients.html`، `screens/recruitment-contracts.html` |
| شريط تصدير (Excel أخضر، PDF أحمر) | `screens/recruitment-contracts.html` |
| جدول DataTables مع شارات حالة ملونة | `screens/clients.html`، `screens/maids.html` |
| نماذج إضافة طويلة متعددة الأقسام | `screens/recruitment-contract-create.html`، `screens/maid-create.html` |
| جدول زمني شبكي (عاملات × أيام) | `screens/hourly-schedule.html` |
| القائمة الجانبية بأيقونات داخل مربعات فاتحة، والعنصر النشط كحبة كحلية | كل الشاشات |
| الشريط العلوي: بحث، إشعارات، لغة، ملء الشاشة، صورة المستخدم | كل الشاشات |

## خريطة الملفات إلى asuss

| في الكيت | في asuss |
|---|---|
| `assets/admin/...` | `public/admin/...` |
| `source/views/layout/...` | `resources/views/admin/layout/...` |
| `screens/<slug>.html` | ملف الـ Blade المذكور في `kit/screens.json` → `view` |

## التصميم الجديد (المرحلة 1)

### الملفات والنقل إلى asuss

| في الكيت | في asuss | ملاحظة |
|---|---|---|
| `assets/admin/custom/kit-overrides.css` | `public/admin/custom/kit-overrides.css` | كل الأصناف تبدأ بـ`as-`؛ الشاشة الجديدة تضع `class="as-app"` على `body` ولا تحمّل Luno |
| `assets/admin/custom/asuss-ui.js` | `public/admin/custom/asuss-ui.js` | القائمة (فتح/بحث/درج الجوال)، القوائم المنسدلة، الرسوم (`AsUI.columns`، `AsUI.meters`، `AsUI.chartTable`) |
| القائمة في `kit/redesign/build.py` → `MENU` | `resources/views/admin/layout/inc/sidebar.blade.php` | الأعداد تأتي من الاستعلامات الحالية؛ كل عنصر يبقى خلف صلاحيته (`@can`) كما هو |
| `screens/dashboard.html` | `resources/views/admin/dashboard-new.blade.php` | |
| `screens/reports.html` | جديدة (مقترح `admin/reports/index.blade.php`) | بيانات كل تقرير من استعلام واحد يرجع `kpis` و`chart` و`table` بنفس الشكل الموجود في الصفحة |
| `assets/admin/login/css/login.css` + `screens/login.html` | نفس المسار + `admin/auth/login.blade.php` | `header.auth-top` (شعار للجوال + English)، `a.auth-link` لنسيت كلمة المرور (يحتاج مسارًا في asuss)، `p.auth-help`؛ اللوحة الكحلية: `img.panel-logo` و`figure.journey` (خريطة SVG + `journey-card`) و`panel-points`؛ لا تنقل `kit-login.js` ولا `p.auth-demo` |
| `assets/web/assets/images/logoh-white.svg` | نفس المسار | الشعار الكامل بالأبيض للوحة الكحلية في تسجيل الدخول؛ نفس `logoh.svg` بتعبئة بيضاء |
| `assets/web/assets/images/logo-mark-white.svg` | نفس المسار | العلامة وحدها بالأبيض لشريط الأقسام، مقصوصة من `logoh.svg` بلا تعديل للشكل |

### الخط

**Readex Pro** (Google Fonts، أوزان 400 و500 و600) بدل IBM Plex Sans Arabic، بطلب صاحب المشروع: عربي ولاتيني بتصميم واحد، وأرقام واضحة. الأوزان: 400 للمتن، 500 للتسميات والأزرار والروابط، 600 للعناوين والأرقام. لا نستخدم 700 لأنه ثقيل في هذا الخط. المقارنة مع الخيارات الأخرى في `kit/fonts.html`. **يحتاج تحديث نظام التصميم** (`tokens.json` → `type.families.sans`).

### القيم

من `tokens.json`: `navy` للعنصر النشط في القائمة، `brand` للأزرار والروابط فقط، `blue` للأيقونات والرسوم، `tint` لمربعات الأيقونات، `page` للخلفية، `radius-lg` 8px للبطاقات والأزرار والحقول.

إضافات غير موجودة في نظام التصميم بعد (تستحق الإضافة إليه):
- **تحذير:** `#b54708` على `#fffaeb` بحد `#fedf89` (للمتأخر قليلًا وبانتظار الاعتماد).
- **سلسلة الرسم الثانية:** `#00AC9A` (فيروزي أسس القديم) مع `#1D70B7`. فُحص الزوج بأداة dataviz: تمييز عمى الألوان ΔE 19؛ تباين الفيروزي مع الأبيض 2.8:1، لذلك كل رسم له تلميح عند المرور وعرض جدول.

### المكونات

| المكون | الصنف |
|---|---|
| الهيكل | `as-layout` › `as-sidebar` + `as-main` › `as-topbar` + `as-content` |
| القائمة | `as-rail` (أقسام: `as-rail__btn[data-dept]`) + `as-panel` › `as-pane[data-dept]` › `as-nav__group` › `as-nav__label` + `as-nav__link`. `body.as-collapsed` يخفي اللوحة |
| خط اتجاه | `AsUI.spark(el, values)` |
| مراحل العقد (عمودي) | `as-stages` |
| الأداء حسب الإدارة | `as-tabs--inset` + `as-dept__stats` + `as-dept__body` |
| رأس الصفحة | `as-pagehead` |
| بطاقة | `as-card` › `as-card__head` / `as-card__body` / `as-card__foot` |
| رقم رئيسي | `as-kpi` |
| قائمة المهام العاجلة | `as-todo` |
| مراحل العقد | `as-pipe` |
| جدول | `as-table` (الأرقام `is-num`) |
| شارة حالة | `as-badge--info / success / warning / danger / neutral` |
| أزرار | `as-btn--primary / secondary / ghost`، `as-iconbtn` |
| اختيار مقطّع / تبويب | `as-seg` / `as-tabs` |
