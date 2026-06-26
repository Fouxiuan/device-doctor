const Dialog = {
  confirm({ title = '确认', message = '', type = 'warning', confirmText = '确定', cancelText = '取消', onConfirm, onCancel }) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay confirm-dialog show';
    modal.innerHTML = `
      <div class="modal animate-scale-in">
        <div class="modal-body" style="text-align: center; padding: 32px 24px;">
          <div class="confirm-dialog-icon ${type}">
            ${type === 'danger' ? '⚠' : type === 'success' ? '✓' : type === 'info' ? 'ℹ' : '?'}
          </div>
          <div class="confirm-dialog-title">${this.escapeHtml(title)}</div>
          <div class="confirm-dialog-message" style="white-space: pre-line;">${this.escapeHtml(message)}</div>
        </div>
        <div class="modal-footer" style="justify-content: center; gap: 12px;">
          <button class="btn btn-ghost" data-action="cancel" style="min-width: 100px;">${this.escapeHtml(cancelText)}</button>
          <button class="btn ${type === 'danger' ? 'btn-primary' : 'btn-primary'}" data-action="confirm" style="min-width: 100px; ${type === 'danger' ? 'background: var(--stage-danger);' : ''}">${this.escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = (action) => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 200);
      if (action === 'confirm' && onConfirm) onConfirm();
      if (action === 'cancel' && onCancel) onCancel();
    };

    modal.querySelector('[data-action="cancel"]').addEventListener('click', () => close('cancel'));
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => close('confirm'));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) close('cancel');
    });

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        close('cancel');
        document.removeEventListener('keydown', keyHandler);
      } else if (e.key === 'Enter') {
        close('confirm');
        document.removeEventListener('keydown', keyHandler);
      }
    };
    document.addEventListener('keydown', keyHandler);

    modal.querySelector('[data-action="confirm"]').focus();
  },

  prompt({ title = '输入', message = '', placeholder = '', defaultValue = '', confirmText = '确定', cancelText = '取消', onConfirm, onCancel }) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
      <div class="modal animate-scale-in" style="max-width: 420px;">
        <div class="modal-header">
          <h3 class="modal-title">${this.escapeHtml(title)}</h3>
        </div>
        <div class="modal-body">
          ${message ? `<p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">${this.escapeHtml(message)}</p>` : ''}
          <input type="text" class="form-input" id="prompt-input" placeholder="${this.escapeHtml(placeholder)}" value="${this.escapeHtml(defaultValue)}">
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" data-action="cancel">${this.escapeHtml(cancelText)}</button>
          <button class="btn btn-primary" data-action="confirm">${this.escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector('#prompt-input');
    setTimeout(() => {
      input.focus();
      input.select();
    }, 100);

    const close = (action) => {
      modal.classList.remove('show');
      const value = input.value;
      setTimeout(() => modal.remove(), 200);
      if (action === 'confirm' && onConfirm) onConfirm(value);
      if (action === 'cancel' && onCancel) onCancel?.();
    };

    modal.querySelector('[data-action="cancel"]').addEventListener('click', () => close('cancel'));
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => close('confirm'));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) close('cancel');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        close('confirm');
      } else if (e.key === 'Escape') {
        close('cancel');
      }
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

const Toast = {
  _timer: null,

  show(message, type = '', duration = 2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast show ' + type;

    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      toast.classList.remove('show');
      this._timer = null;
    }, duration);
  }
};