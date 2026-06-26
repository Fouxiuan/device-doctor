const Devices = {
  _searchKeyword: '',

  init() {
    this.bindEvents();
    this.render();
    Store.subscribe(() => this.render());
  },

  bindEvents() {
    const searchInput = document.getElementById('device-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this._searchKeyword = e.target.value.trim();
        this.render();
      });
    }

    const addBtn = document.getElementById('btn-add-device');
    if (addBtn) {
      addBtn.addEventListener('click', () => Modal.openDeviceModal());
    }
  },

  render() {
    let devices = Store.getDevices();

    if (this._searchKeyword) {
      devices = Store.searchDevices(this._searchKeyword);
    }

    const totalCount = Store.getDevices().length;
    document.getElementById('device-total-count').textContent = totalCount;

    const grid = document.getElementById('devices-grid');
    if (!grid) return;

    if (devices.length === 0) {
      grid.innerHTML = `
        <div class="devices-empty">
          <svg class="devices-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="6" y="2" width="12" height="20" rx="2"/>
            <path d="M12 18h.01" stroke-linecap="round"/>
            <path d="M8 6h8" stroke-linecap="round"/>
          </svg>
          <div class="devices-empty-title">${this._searchKeyword ? '未找到匹配的设备' : '暂无设备'}</div>
          <div class="devices-empty-desc">${this._searchKeyword ? '换个关键词试试' : '点击右上角新增设备开始管理'}</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = devices.map(device => this.renderCard(device)).join('');

    grid.querySelectorAll('.device-card').forEach(card => {
      const editBtn = card.querySelector('.device-action-btn.edit');
      const deleteBtn = card.querySelector('.device-action-btn.danger');

      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          Modal.openDeviceModal(card.dataset.id);
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteDevice(card.dataset.id);
        });
      }
    });
  },

  renderCard(device) {
    const statusConfig = DEVICE_STATUS[device.status] || DEVICE_STATUS.active;
    const issues = Store.getIssuesByDeviceId(device.id);
    const activeIssues = issues.filter(i => i.stage !== 'normal' && i.stage !== 'wearing');

    return `
      <div class="device-card" data-id="${device.id}">
        <div class="device-card-header">
          <div class="device-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="6" y="2" width="12" height="20" rx="2"/>
              <path d="M12 18h.01" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="device-status-badge ${statusConfig.class}">${statusConfig.label}</span>
        </div>
        <div class="device-info">
          <div class="device-name">${this.escapeHtml(device.name)}</div>
          <div class="device-id">${device.id} · ${this.escapeHtml(device.model || '')}</div>
        </div>
        <div class="device-meta">
          <div class="device-meta-item">
            <span class="device-meta-label">设备类型</span>
            <span class="device-meta-value">${this.escapeHtml(device.type || '-')}</span>
          </div>
          <div class="device-meta-item">
            <span class="device-meta-label">出厂时间</span>
            <span class="device-meta-value">${device.manufactureDate || '-'}</span>
          </div>
          <div class="device-meta-item">
            <span class="device-meta-label">异常总数</span>
            <span class="device-meta-value">${issues.length} 条</span>
          </div>
          <div class="device-meta-item">
            <span class="device-meta-label">处理中</span>
            <span class="device-meta-value" style="color: ${activeIssues.length ? 'var(--stage-danger)' : 'inherit'}">${activeIssues.length} 条</span>
          </div>
        </div>
        ${device.note ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-light);">
            <div class="device-meta-label" style="margin-bottom: 4px;">备注</div>
            <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">${this.escapeHtml(device.note)}</div>
          </div>
        ` : ''}
        <div class="device-actions">
          <button class="device-action-btn edit">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M13.5 2.5L17.5 6.5L6 18H2V14L13.5 2.5Z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            编辑
          </button>
          <button class="device-action-btn danger">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 6H16M8 6V4C8 3.44772 8.44772 3 9 3H11C11.5523 3 12 3.44772 12 4V6M6 6L7 17C7 17.5523 7.44772 18 8 18H12C12.5523 18 13 17.5523 13 17L14 6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            删除
          </button>
        </div>
      </div>
    `;
  },

  deleteDevice(id) {
    const device = Store.getDeviceById(id);
    if (!device) return;

    const issues = Store.getIssuesByDeviceId(id);
    let message = `确定要删除设备「${device.name}」吗？`;
    if (issues.length > 0) {
      message += `\n\n该设备关联了 ${issues.length} 条异常记录，删除后这些记录的设备信息将被清空。`;
    }

    Dialog.confirm({
      title: '删除设备',
      message: message,
      type: 'danger',
      confirmText: '确认删除',
      onConfirm: () => {
        issues.forEach(issue => {
          Store.updateIssue(issue.id, { device: '', deviceId: null });
        });
        Store.deleteDevice(id);
        Toast.show('设备已删除', 'success');
      }
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};