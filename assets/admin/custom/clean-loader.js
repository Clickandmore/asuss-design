/**
 * Clean Loader - Universal Loading Component
 * استخدام سهل للـ loader النظيف في جميع أنحاء النظام
 */

class CleanLoader {
    /**
     * إظهار loader في عنصر محدد
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
            color: options.color || 'default', // default, primary, success, warning, danger, info
            ...options
        };

        const loaderClass = config.size === 'small' ? 'clean-loader-small' :
                           config.size === 'xs' ? 'clean-loader-xs' : 'clean-loader';

        const dotClass = config.size === 'small' ? 'loader-dot-small' :
                        config.size === 'xs' ? 'loader-dot-xs' : 'loader-dot';

        const colorClass = config.color !== 'default' ? ` ${config.color}` : '';

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'cleanLoaderOverlay';
        overlay.innerHTML = `
            <div class="text-center">
                <div class="${loaderClass}${colorClass} mb-3">
                    <div class="${dotClass}"></div>
                    <div class="${dotClass}"></div>
                    <div class="${dotClass}"></div>
                    ${config.size === 'normal' ? `<div class="${dotClass}"></div>` : ''}
                </div>
                <div class="loading-text">
                    <i class="fas fa-${config.icon || 'spinner'} me-2"></i>
                    ${config.text}
                </div>
                ${config.subtitle ? `<div class="loading-subtitle">${config.subtitle}</div>` : ''}
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
                <div class="loading-text">
                    <i class="fas fa-${options.icon || 'spinner'} me-2"></i>
                    ${options.text || 'جاري التحميل...'}
                </div>
                ${options.subtitle ? `<div class="loading-subtitle">${options.subtitle}</div>` : ''}
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
     * إظهار loader في button
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
}

// jQuery Plugin (إذا كان jQuery متوفر)
if (typeof jQuery !== 'undefined') {
    jQuery.fn.cleanLoader = function(action, options = {}) {
        if (action === 'show') {
            CleanLoader.show(`#${this.attr('id')}`, options);
        } else if (action === 'hide') {
            CleanLoader.hide(`#${this.attr('id')}`);
        }
        return this;
    };
}

// تصدير للاستخدام
window.CleanLoader = CleanLoader;
