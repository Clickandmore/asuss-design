/**
 * إصلاح مشكلة القوائم المنسدلة في صفحة الطلبات
 * يعمل مع admin-tables.js
 */
$(document).ready(function() {
    if ($('.actions-dropdown .dropdown-toggle[data-admin-dropdown="actions"]').length) {
        return;
    }

    // إزالة أي event listeners متعارضة
    $(document).off('mouseenter', '.table tbody tr');
    $(document).off('mouseleave', '.table tbody tr');
    $(document).off('mouseenter', '.dropdown-menu');
    $(document).off('mouseover', '.table tbody tr');

    // التأكد من أن Bootstrap dropdown يعمل بشكل صحيح
    $('.actions-dropdown').each(function() {
        var dropdown = new bootstrap.Dropdown($(this).find('.dropdown-toggle')[0], {
            autoClose: true,
            boundary: 'window',
            reference: 'toggle',
            display: 'static',
            popperConfig: {
                strategy: 'fixed',
                modifiers: [
                    {
                        name: 'preventOverflow',
                        options: {
                            boundary: 'window'
                        }
                    },
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 2]
                        }
                    }
                ]
            }
        });
    });

    // إعادة تهيئة dropdowns بعد كل تحديث للجدول
    $(document).on('draw.dt', function() {
        setTimeout(function() {
            $('.actions-dropdown').each(function() {
                var existingDropdown = bootstrap.Dropdown.getInstance($(this).find('.dropdown-toggle')[0]);
                if (existingDropdown) {
                    existingDropdown.dispose();
                }

                var dropdown = new bootstrap.Dropdown($(this).find('.dropdown-toggle')[0], {
                    autoClose: true,
                    boundary: 'window',
                    reference: 'toggle',
                    display: 'static',
                    popperConfig: {
                        strategy: 'fixed',
                        modifiers: [
                            {
                                name: 'preventOverflow',
                                options: {
                                    boundary: 'window'
                                }
                            },
                            {
                                name: 'offset',
                                options: {
                                    offset: [0, 2]
                                }
                            }
                        ]
                    }
                });
            });
        }, 100);
    });

    // منع إغلاق القائمة عند النقر داخلها
    $(document).on('click', '.dropdown-menu', function(e) {
        e.stopPropagation();
    });

    // إصلاح z-index للقوائم المنسدلة
    $(document).on('shown.bs.dropdown', '.actions-dropdown', function() {
        var $menu = $(this).find('.dropdown-menu');
        $menu.css({
            'z-index': '2147483647',
            'position': 'fixed'
        });
    });
});
