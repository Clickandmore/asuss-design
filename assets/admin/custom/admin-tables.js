/*
=======================================================
   Admin Tables JS - JavaScript عام للجداول الإدارية
   يحتوي على إصلاحات الـ dropdown وتحسينات الجداول
=======================================================
*/

$(document).ready(function () {
    // ضمان عدم تداخل الصفوف مع القائمة المنسدلة
    $(document).on('show.bs.dropdown', '.dropdown', function () {
        var $dropdown = $(this);
        var $dropdownMenu = $dropdown.find('.dropdown-menu');
        var $row = $dropdown.closest('tr');
        var isLastRow = $row.is(':last-child');
        var isOnlyChild = $row.is(':only-child');

        if (isOnlyChild) {
            $row.css('margin-bottom', '0');
        } else if (isLastRow) {
            $row.css('margin-bottom', '100px');
        } else {
            $row.css('margin-bottom', '0');
        }
    });

    // إزالة المساحة الإضافية عند إغلاق القائمة المنسدلة
    $(document).on('hide.bs.dropdown', '.dropdown', function () {
        var $dropdown = $(this);
        var $row = $dropdown.closest('tr');
        var isOnlyChild = $row.is(':only-child');

        if (isOnlyChild) {
            $row.css('margin-bottom', '0');
        } else {
            $row.css('margin-bottom', '');
        }
    });

    // إدارة موحدة وثابتة لقائمة الإجراءات داخل الجداول
    let openDropdown = null;
    let openDropdownMenu = null;

    /**
     * حساب أبعاد القائمة المنسدلة حتى لو كانت مخفية
     * يتم إنشاء نسخة خفية للحصول على عرض وارتفاع حقيقيين
     */
    function getMenuDimensions($menu) {
        const $clone = $menu.clone();
        $clone.removeAttr('id');
        $clone.css({
            visibility: 'hidden',
            display: 'block',
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            width: 'auto',
            height: 'auto',
            maxHeight: 'none'
        });

        $('body').append($clone);

        const dimensions = {
            width: $clone.outerWidth() || 220,
            height: $clone.outerHeight() || 280
        };

        $clone.remove();
        return dimensions;
    }

    /**
     * تحديد اتجاه الزر اعتماداً على الـ computed style
     * يفيد الصفحات التي لا تستخدم dir="rtl" في الـ HTML
     */
    function isElementRTL($element) {
        if ($element && $element.length && $element[0]) {
            const computedDir = window.getComputedStyle($element[0]).direction;
            if (computedDir) {
                return computedDir.toLowerCase() === 'rtl';
            }
        }

        return $('html').attr('dir') === 'rtl' || $('body').attr('dir') === 'rtl';
    }

    function setImportantStyles(element, styles) {
        if (!element) {
            return;
        }

        Object.keys(styles).forEach(function (property) {
            element.style.setProperty(property, styles[property], 'important');
        });
    }

    function resetMenuStyles(element) {
        if (!element) {
            return;
        }

        [
            'position',
            'top',
            'left',
            'right',
            'bottom',
            'display',
            'visibility',
            'opacity',
            'z-index',
            'min-width',
            'max-height',
            'overflow-y',
            'transform'
        ].forEach(function (property) {
            element.style.removeProperty(property);
        });
    }

    function prepareActionDropdowns() {
        $('.actions-dropdown .dropdown-toggle').each(function () {
            const toggle = $(this);

            toggle.removeAttr('data-bs-toggle');
            toggle.removeAttr('data-bs-display');
            toggle.attr('data-admin-dropdown', 'actions');
            toggle.attr('aria-expanded', 'false');

            if (window.bootstrap && window.bootstrap.Dropdown) {
                const instance = window.bootstrap.Dropdown.getInstance(this);
                if (instance) {
                    instance.dispose();
                }
            }
        });
    }

    function closeDropdown() {
        if (!openDropdownMenu) {
            return;
        }

        const $menu = openDropdownMenu;
        const $owner = $menu.data('dropdown-owner');

        if ($owner && $owner.length) {
            $menu.appendTo($owner);
        }

        resetMenuStyles($menu[0]);

        $menu.removeClass('show admin-actions-dropdown-menu');

        if (openDropdown && openDropdown.length) {
            openDropdown.removeClass('show actions-dropdown-open');
            openDropdown.closest('tr').removeClass('active-dropdown-row');
            openDropdown.find('.dropdown-toggle').first()
                .removeClass('show')
                .attr('aria-expanded', 'false');
        }

        $('body').removeClass('dropdown-menu-open');

        openDropdown = null;
        openDropdownMenu = null;
    }

    function openActionDropdown($dropdown) {
        const $button = $dropdown.find('.dropdown-toggle').first();
        const $menu = $dropdown.children('.dropdown-menu').first();
        const $row = $dropdown.closest('tr');

        if (!$button.length || !$menu.length) {
            return;
        }

        if (openDropdown && openDropdown[0] === $dropdown[0]) {
            closeDropdown();
            return;
        }

        closeDropdown();

        const rect = $button[0].getBoundingClientRect();
        const menuDimensions = getMenuDimensions($menu);
        const isRTL = isElementRTL($button);
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const spacing = 8;
        const minWidth = Math.max(Math.ceil(rect.width), menuDimensions.width);
        const availableBelow = viewportHeight - rect.bottom - spacing;
        const availableAbove = rect.top - spacing;
        const shouldOpenUpward = availableBelow < Math.min(menuDimensions.height, 240) && availableAbove > availableBelow;
        const computedMaxHeight = Math.max(160, shouldOpenUpward ? availableAbove : availableBelow);

        let top = shouldOpenUpward
            ? rect.top - Math.min(menuDimensions.height, computedMaxHeight)
            : rect.bottom;

        let left = isRTL
            ? rect.right - minWidth
            : rect.left;

        top = Math.max(spacing, Math.min(top, Math.max(spacing, viewportHeight - Math.min(menuDimensions.height, computedMaxHeight) - spacing)));
        left = Math.max(spacing, Math.min(left, Math.max(spacing, viewportWidth - minWidth - spacing)));

        $menu.data('dropdown-owner', $dropdown);
        $('body').append($menu);

        $('body').addClass('dropdown-menu-open');
        $row.addClass('active-dropdown-row');
        $dropdown.addClass('show actions-dropdown-open');
        $button.addClass('show').attr('aria-expanded', 'true');
        $menu.addClass('show admin-actions-dropdown-menu');

        setImportantStyles($menu[0], {
            position: 'fixed',
            top: Math.round(top) + 'px',
            left: Math.round(left) + 'px',
            right: 'auto',
            bottom: 'auto',
            display: 'block',
            visibility: 'visible',
            opacity: '1',
            'z-index': '2147483647',
            'min-width': Math.round(minWidth) + 'px',
            'max-height': Math.round(computedMaxHeight) + 'px',
            'overflow-y': menuDimensions.height > computedMaxHeight ? 'auto' : 'visible',
            transform: 'none'
        });

        openDropdown = $dropdown;
        openDropdownMenu = $menu;
    }

    prepareActionDropdowns();

    // معالج مخصص وموحد لقوائم الإجراءات
    $(document).on('click', '.actions-dropdown .dropdown-toggle', function (e) {
        e.preventDefault();
        e.stopPropagation();

        openActionDropdown($(this).closest('.actions-dropdown'));
    });

    // أغلق القائمة عند النقر خارجها
    $(document).on('click', function (e) {
        if (
            openDropdownMenu &&
            !$(e.target).closest('.actions-dropdown').length &&
            !$(e.target).closest('.admin-actions-dropdown-menu').length
        ) {
            closeDropdown();
        }
    });

    // إبقاء النقر داخل القائمة فعالاً بدون إغلاق مباشر
    $(document).on('click', '.admin-actions-dropdown-menu', function (e) {
        e.stopPropagation();
    });

    // أغلق القائمة بعد تنفيذ الإجراء
    $(document).on('click', '.admin-actions-dropdown-menu .dropdown-item', function () {
        window.setTimeout(function () {
            closeDropdown();
        }, 50);
    });

    // إعادة الضبط بعد إعادة رسم DataTables
    $(document).on('draw.dt', function () {
        closeDropdown();
        prepareActionDropdowns();
    });

    $(window).on('resize scroll', function () {
        closeDropdown();
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    // إضافة مساحة إضافية للصف الواحد
    function adjustTableForSingleRow() {
        const $tables = $('.table');

        $tables.each(function () {
            const $table = $(this);
            const $tbody = $table.find('tbody');
            const rowCount = $tbody.find('tr').length;

            if (rowCount === 1) {
                // للصف الواحد: إضافة مساحة كبيرة أسفل
                $tbody.css({
                    'min-height': '300px',
                    'position': 'relative'
                });
                $tbody.find('tr:only-child').css({
                    'margin-bottom': '250px',
                    'position': 'relative'
                });
            } else if (rowCount === 2) {
                // للصفين: إضافة مساحة متوسطة
                $tbody.css({
                    'min-height': '200px',
                    'position': 'relative'
                });
                $tbody.find('tr:first-child').css({
                    'margin-bottom': '50px',
                    'position': 'relative'
                });
                $tbody.find('tr:last-child').css({
                    'margin-bottom': '150px',
                    'position': 'relative'
                });
            } else if (rowCount >= 3) {
                // للصفوف الكثيرة: إضافة مساحة للصف الأول والأخير
                $tbody.css({
                    'min-height': 'auto',
                    'position': 'relative'
                });
                $tbody.find('tr:first-child').css({
                    'margin-top': '20px',
                    'position': 'relative'
                });
                $tbody.find('tr:last-child').css({
                    'margin-bottom': '50px',
                    'position': 'relative'
                });
                $tbody.find('tr:not(:first-child):not(:last-child)').css({
                    'margin-bottom': 'auto',
                    'margin-top': 'auto',
                    'position': 'relative'
                });
            } else {
                // للصفوف الكثيرة: إزالة المساحة الإضافية
                $tbody.css({
                    'min-height': 'auto',
                    'position': 'relative'
                });
                $tbody.find('tr').css({
                    'margin-bottom': 'auto',
                    'position': 'relative'
                });
            }
        });
    }

    // استدعاء الدالة عند تحميل الصفحة
    adjustTableForSingleRow();

    // استدعاء الدالة عند تحديث DataTables
    $(document).on('draw.dt', function () {
        adjustTableForSingleRow();
    });

    // تحسين تجربة المستخدم للنماذج
    $(document).on('submit', 'form', function () {
        const $form = $(this);
        const $submitBtn = $form.find('button[type="submit"]');

        if ($submitBtn.length) {
            $submitBtn.addClass('btn-loading').trigger('click');
        }
    });

    // إضافة تأثيرات للبطاقات
    $(document).on('mouseenter', '.card', function () {
        $(this).addClass('card-hover');
    });

    $(document).on('mouseleave', '.card', function () {
        $(this).removeClass('card-hover');
    });
});

// دالة مساعدة لإظهار رسائل التأكيد
function showConfirmDialog(title, text, confirmText = 'تأكيد', cancelText = 'إلغاء') {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true
    });
}

// دالة مساعدة لإظهار رسائل النجاح
function showSuccessMessage(title, text = '') {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'success',
        confirmButtonText: 'حسناً',
        timer: 3000,
        timerProgressBar: true
    });
}

// دالة مساعدة لإظهار رسائل الخطأ
function showErrorMessage(title, text = '') {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'error',
        confirmButtonText: 'حسناً'
    });
}

// دالة مساعدة لإعادة تحميل الجدول
function reloadDataTable() {
    if (typeof dataTable !== 'undefined' && dataTable) {
        dataTable.ajax.reload(null, false);
    }
}

// إدارة إصلاح RTL للقائمة الجانبية
function initRTLFix() {
    // التحقق من وجود مشكلة في القائمة الجانبية
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const sidebarRect = sidebar.getBoundingClientRect();
        // إذا كانت القائمة في الجانب الخطأ، طبق الإصلاح
        if (sidebarRect.left < 0) {
            document.body.classList.add('rtl-fix');
        }
    }
}

// تطبيق الإصلاح عند تحميل الصفحة
$(document).ready(function () {
    initRTLFix();
});

// إزالة الإصلاح عند مغادرة الصفحة (إذا لزم الأمر)
$(window).on('beforeunload', function () {
    document.body.classList.remove('rtl-fix');
});

/*
=======================================================
   Clean Loader - النسخة النظيفة الموحدة
   بدون خطوط طويلة - فقط نقاط أنيقة
=======================================================
*/

class CleanLoader {
    /**
     * إظهار loader نظيف في عنصر محدد
     * @param {string} targetSelector - محدد العنصر المستهدف
     * @param {object} options - خيارات التخصيص
     */
    static show(targetSelector, options = {}) {
        const target = document.querySelector(targetSelector);
        if (!target) return;

        const config = {
            text: options.text || 'جاري التحميل...',
            subtitle: options.subtitle || 'يرجى الانتظار',
            size: options.size || 'normal', // normal, small, xs
            color: options.color || 'default',
            icon: options.icon || 'database',
            ...options
        };

        const loaderClass = config.size === 'small' ? 'clean-loader-small' :
            config.size === 'xs' ? 'clean-loader-xs' : 'clean-loader';

        const dotClass = config.size === 'small' ? 'loader-dot-small' :
            config.size === 'xs' ? 'loader-dot-xs' : 'loader-dot';

        const colorClass = config.color !== 'default' ? ` ${config.color}` : '';

        const overlay = document.createElement('div');
        overlay.className = 'clean-loading-overlay';
        overlay.id = 'cleanLoaderOverlay';
        overlay.innerHTML = `
            <div class="text-center">
                <div class="${loaderClass}${colorClass} mb-3">
                    <div class="${dotClass}"></div>
                    <div class="${dotClass}"></div>
                    <div class="${dotClass}"></div>
                    ${config.size === 'normal' ? `<div class="${dotClass}"></div>` : ''}
                </div>
                <div class="clean-loading-text">
                    <i class="fas fa-${config.icon} me-2"></i>
                    ${config.text}
                </div>
                ${config.subtitle ? `<div class="clean-loading-subtitle">${config.subtitle}</div>` : ''}
            </div>
        `;

        target.style.position = 'relative';
        target.appendChild(overlay);
    }

    /**
     * إخفاء الـ loader
     * @param {string} targetSelector - محدد العنصر المستهدف
     */
    static hide(targetSelector) {
        const target = document.querySelector(targetSelector);
        if (!target) return;

        const overlay = target.querySelector('#cleanLoaderOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * إظهار loader في الصفحة كاملة
     * @param {object} options - خيارات التخصيص
     */
    static showFullPage(options = {}) {
        const overlay = document.createElement('div');
        overlay.id = 'cleanLoaderFullPage';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(5px);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        overlay.innerHTML = `
            <div class="text-center">
                <div class="clean-loader mb-3">
                    <div class="loader-dot"></div>
                    <div class="loader-dot"></div>
                    <div class="loader-dot"></div>
                    <div class="loader-dot"></div>
                </div>
                <div class="clean-loading-text">
                    <i class="fas fa-${options.icon || 'spinner'} me-2"></i>
                    ${options.text || 'جاري التحميل...'}
                </div>
                ${options.subtitle ? `<div class="clean-loading-subtitle">${options.subtitle}</div>` : ''}
            </div>
        `;

        document.body.appendChild(overlay);
    }

    /**
     * إخفاء loader الصفحة كاملة
     */
    static hideFullPage() {
        const overlay = document.getElementById('cleanLoaderFullPage');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * إظهار loader في button - بدون خطوط طويلة
     * @param {string} buttonSelector - محدد الزر
     * @param {string} text - النص المطلوب عرضه
     */
    static showInButton(buttonSelector, text = 'جاري المعالجة...') {
        const button = document.querySelector(buttonSelector);
        if (!button) return;

        button.disabled = true;
        button.dataset.originalContent = button.innerHTML;
        button.innerHTML = `
            <div class="clean-loader-xs me-2" style="display: inline-flex;">
                <div class="loader-dot-xs"></div>
                <div class="loader-dot-xs"></div>
                <div class="loader-dot-xs"></div>
            </div>
            ${text}
        `;
    }

    /**
     * إخفاء loader من button
     * @param {string} buttonSelector - محدد الزر
     */
    static hideFromButton(buttonSelector) {
        const button = document.querySelector(buttonSelector);
        if (!button) return;

        button.disabled = false;
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent;
            delete button.dataset.originalContent;
        }
    }

    /**
     * تحديث DataTable processing message - بدون خطوط طويلة
     */
    static getCleanProcessingMessage() {
        return '<div class="d-flex justify-content-center align-items-center p-4">' +
            '<div class="clean-loader-small me-3">' +
            '<div class="loader-dot-small"></div>' +
            '<div class="loader-dot-small"></div>' +
            '<div class="loader-dot-small"></div>' +
            '</div>' +
            '<div class="text-primary fw-bold">جاري المعالجة...</div>' +
            '</div>';
    }
}

// jQuery Plugin
if (typeof jQuery !== 'undefined') {
    jQuery.fn.cleanLoader = function (action, options = {}) {
        if (action === 'show') {
            CleanLoader.show(`#${this.attr('id')}`, options);
        } else if (action === 'hide') {
            CleanLoader.hide(`#${this.attr('id')}`);
        }
        return this;
    };
}

// تصدير للاستخدام العام
window.CleanLoader = CleanLoader;
