# نظام التصميم الحالي — لوحة تحكم أسس

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
- صفحة تسجيل الدخول (`v2`) تستخدم Cairo وIBM Plex Sans من Google Fonts.

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
