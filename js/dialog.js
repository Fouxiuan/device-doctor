/**
 * 自定义对话框工具
 * 替代原生 confirm() / prompt()
 * 原生对话框在 VS Code / TRAE IDE 的 webview 中不被支持，会导致 React error #185
 */
const Dialog = (function() {
    let overlay = null;
    let lastFocusedElement = null;

    /**
     * 确认对话框
     * @param {string|object} options - 消息字符串或 { title, message, confirmText, cancelText, danger }
     * @returns {Promise<boolean>} true=确认, false=取消
     */
    function confirm(options) {
        const opts = typeof options === 'string' ? { message: options } : options;
        return new Promise((resolve) => {
            _show({
                title: opts.title || '确认操作',
                message: opts.message,
                confirmText: opts.confirmText || '确定',
                cancelText: opts.cancelText || '取消',
                danger: opts.danger === true,
                type: 'confirm',
                resolve
            });
        });
    }

    /**
     * 输入对话框
     * @param {string|object} options - 消息字符串或 { title, message, defaultValue, placeholder, confirmText }
     * @returns {Promise<string|null>} 输入值或 null（取消）
     */
    function prompt(options) {
        const opts = typeof options === 'string' ? { message: options } : options;
        return new Promise((resolve) => {
            _show({
                title: opts.title || '请输入',
                message: opts.message || '',
                defaultValue: opts.defaultValue || '',
                placeholder: opts.placeholder || '',
                confirmText: opts.confirmText || '确定',
                cancelText: opts.cancelText || '取消',
                danger: false,
                type: 'prompt',
                resolve
            });
        });
    }

    function _show(config) {
        _createOverlay();
        lastFocusedElement = document.activeElement;

        const isPrompt = config.type === 'prompt';
        const confirmClass = config.danger
            ? 'dialog-btn dialog-btn-confirm dialog-btn-danger'
            : 'dialog-btn dialog-btn-confirm';

        overlay.innerHTML = `
            <div class="dialog-box" role="dialog" aria-modal="true" aria-labelledby="dialog-title-text" aria-describedby="dialog-message-text">
                <div class="dialog-title" id="dialog-title-text">${_escapeHtml(config.title)}</div>
                ${config.message ? `<div class="dialog-message" id="dialog-message-text">${_escapeHtml(config.message).replace(/\n/g, '<br>')}</div>` : ''}
                ${isPrompt ? `
                    <input class="dialog-input" id="dialog-input-field"
                           type="text"
                           value="${_escapeHtml(config.defaultValue)}"
                           placeholder="${_escapeHtml(config.placeholder)}"
                           autocomplete="off"
                           aria-label="${_escapeHtml(config.title)}" />
                ` : ''}
                <div class="dialog-actions">
                    <button class="dialog-btn dialog-btn-cancel" id="dialog-btn-cancel">${_escapeHtml(config.cancelText)}</button>
                    <button class="${confirmClass}" id="dialog-btn-confirm">${_escapeHtml(config.confirmText)}</button>
                </div>
            </div>
        `;

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        const cancelBtn = document.getElementById('dialog-btn-cancel');
        const confirmBtn = document.getElementById('dialog-btn-confirm');
        const inputField = document.getElementById('dialog-input-field');

        function cleanup() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            overlay.innerHTML = '';
            document.removeEventListener('keydown', handleKeydown);
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                setTimeout(() => {
                    try { lastFocusedElement.focus(); } catch (e) {}
                }, 50);
            }
        }

        function handleConfirm() {
            cleanup();
            if (isPrompt) {
                config.resolve(inputField ? inputField.value : '');
            } else {
                config.resolve(true);
            }
        }

        function handleCancel() {
            cleanup();
            config.resolve(isPrompt ? null : false);
        }

        function handleKeydown(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
            }
        }

        if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
        if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);

        // 点击遮罩取消
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                handleCancel();
            }
        });

        document.addEventListener('keydown', handleKeydown);

        // 聚焦
        setTimeout(() => {
            if (isPrompt && inputField) {
                inputField.focus();
                inputField.select();
            } else if (confirmBtn) {
                confirmBtn.focus();
            }
        }, 50);
    }

    function _createOverlay() {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'dialog-overlay';
            overlay.className = 'dialog-overlay';
            document.body.appendChild(overlay);
        }
    }

    function _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    return { confirm, prompt };
})();
