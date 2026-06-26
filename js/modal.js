const Modal = {
  _currentType: null,
  _currentId: null,
  _editingTags: [],

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    closeBtn.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('show')) {
        this.close();
      }
    });
  },

  openIssueModal(issueId = null) {
    this._currentType = 'issue';
    this._currentId = issueId;
    this._editingTags = [];

    const issue = issueId ? Store.getIssueById(issueId) : null;
    const title = issue ? '编辑异常' : '新增异常';

    if (issue) {
      this._editingTags = [...(issue.tags || [])];
    }

    this.renderHeader(title);
    this.renderIssueBody(issue);
    this.renderIssueFooter(issue);
    this.show();
  },

  openDeviceModal(deviceId = null) {
    this._currentType = 'device';
    this._currentId = deviceId;

    const device = deviceId ? Store.getDeviceById(deviceId) : null;
    const title = device ? '编辑设备' : '新增设备';

    this.renderHeader(title);
    this.renderDeviceBody(device);
    this.renderDeviceFooter(device);
    this.show();
  },

  openAISettingsModal() {
    this._currentType = 'ai-settings';
    const settings = Store.getSettings();

    this.renderHeader('AI 诊疗设置');
    this.renderAISettingsBody(settings);
    this.renderAISettingsFooter();
    this.show();
  },

  renderHeader(title) {
    document.getElementById('modal-title').textContent = title;
  },

  renderIssueBody(issue) {
    const devices = Store.getDevices();
    const knowledge = Store.getKnowledge();

    const body = document.getElementById('modal-body');
    body.innerHTML = `
      <div class="ai-suggestion-box" id="ai-suggestion-box" style="display: none;">
        <div class="ai-suggestion-header">
          <svg class="ai-suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L14.5 8.5L21 10.5L15.5 14L16.5 20.5L12 17.5L7.5 20.5L8.5 14L3 10.5L9.5 8.5L12 2Z" stroke-linejoin="round"/>
          </svg>
          <span class="ai-suggestion-title">AI 智能诊疗建议</span>
        </div>
        <div class="ai-suggestion-body" id="ai-suggestion-content"></div>
        <div class="ai-suggestion-actions" id="ai-suggestion-actions"></div>
      </div>

      <div class="form-group">
        <label class="form-label required">异常标题</label>
        <input type="text" class="form-input" id="issue-title" placeholder="简要描述问题" value="${this.escapeHtml(issue?.title || '')}">
        <button class="ai-analyze-btn" id="btn-ai-analyze" ${!Store.getSettings().aiApiKey ? 'disabled title="请先在设置中配置 AI API Key"' : ''}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 2L11.5 6.5L16 8L11.5 9.5L10 14L8.5 9.5L4 8L8.5 6.5L10 2Z" stroke-linejoin="round"/>
          </svg>
          AI 智能诊断
        </button>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">当前阶段</label>
          <select class="form-select" id="issue-stage">
            ${STAGE_ORDER.map(stage => `
              <option value="${stage}" ${issue?.stage === stage ? 'selected' : ''}>${STAGE_CONFIG[stage]?.label || stage}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">负责人</label>
          <select class="form-select" id="issue-assignee">
            <option value="">未分配</option>
            ${ASSIGNEES.map(a => `
              <option value="${a.name}" data-initial="${a.initial}" ${issue?.assignee === a.name ? 'selected' : ''}>${a.name}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">关联设备</label>
        <select class="form-select" id="issue-device">
          <option value="">请选择设备</option>
          ${devices.map(d => `
            <option value="${d.id}" data-name="${this.escapeHtml(d.name)}" ${issue?.deviceId === d.id ? 'selected' : ''}>${this.escapeHtml(d.name)} (${d.id})</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">标签</label>
        <div class="tag-input-container" id="tag-input-container">
          ${this._editingTags.map(tag => this.renderTagChip(tag)).join('')}
          <input type="text" class="tag-input" id="tag-input" placeholder="输入标签后按回车添加">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">关联知识库</label>
        <select class="form-select" id="issue-knowledge">
          <option value="">暂未关联</option>
          ${knowledge.map(k => `
            <option value="${k.id}" ${issue?.knowledgeId === k.id ? 'selected' : ''}>${this.escapeHtml(k.title)}</option>
          `).join('')}
        </select>
        <div class="form-hint">选择对应的知识库方案，方便快速查阅处理方法</div>
      </div>

      <div class="form-group">
        <label class="form-label">问题描述</label>
        <textarea class="form-textarea" id="issue-description" placeholder="详细描述问题现象、复现步骤等..." rows="4">${this.escapeHtml(issue?.description || '')}</textarea>
      </div>
    `;

    this.bindIssueEvents();
  },

  bindIssueEvents() {
    const tagContainer = document.getElementById('tag-input-container');
    const tagInput = document.getElementById('tag-input');

    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addTag(tagInput.value.trim());
        tagInput.value = '';
      } else if (e.key === 'Backspace' && !tagInput.value && this._editingTags.length > 0) {
        this.removeTag(this._editingTags.length - 1);
      }
    });

    tagContainer.addEventListener('click', (e) => {
      if (e.target === tagContainer || e.target.closest('#tag-input-container')) {
        tagInput.focus();
      }
    });

    const analyzeBtn = document.getElementById('btn-ai-analyze');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.runAIAnalyze());
    }
  },

  renderTagChip(tag) {
    return `
      <span class="tag-chip" data-tag="${this.escapeHtml(tag)}">
        ${this.escapeHtml(tag)}
        <span class="tag-chip-remove" data-tag="${this.escapeHtml(tag)}" aria-label="移除标签">
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 1L9 9M9 1L1 9" stroke-linecap="round"/>
          </svg>
        </span>
      </span>
    `;
  },

  addTag(tag) {
    if (!tag || this._editingTags.includes(tag)) return;
    if (this._editingTags.length >= 10) {
      Toast.show('最多添加10个标签');
      return;
    }
    this._editingTags.push(tag);
    this.updateTagChips();
  },

  removeTag(indexOrTag) {
    if (typeof indexOrTag === 'number') {
      this._editingTags.splice(indexOrTag, 1);
    } else {
      this._editingTags = this._editingTags.filter(t => t !== indexOrTag);
    }
    this.updateTagChips();
  },

  updateTagChips() {
    const container = document.getElementById('tag-input-container');
    if (!container) return;
    const input = document.getElementById('tag-input');
    const chips = container.querySelectorAll('.tag-chip');
    chips.forEach(c => c.remove());

    this._editingTags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.dataset.tag = tag;
      chip.innerHTML = `
        ${this.escapeHtml(tag)}
        <span class="tag-chip-remove" data-tag="${this.escapeHtml(tag)}" aria-label="移除标签">
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 1L9 9M9 1L1 9" stroke-linecap="round"/>
          </svg>
        </span>
      `;
      chip.querySelector('.tag-chip-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeTag(chip.dataset.tag);
      });
      container.insertBefore(chip, input);
    });
  },

  runAIAnalyze() {
    const title = document.getElementById('issue-title').value.trim();
    const description = document.getElementById('issue-description').value.trim();

    if (!title) {
      Toast.show('请先填写异常标题');
      return;
    }

    const btn = document.getElementById('btn-ai-analyze');
    const box = document.getElementById('ai-suggestion-box');
    const content = document.getElementById('ai-suggestion-content');
    const actions = document.getElementById('ai-suggestion-actions');

    btn.classList.add('loading');
    btn.disabled = true;
    box.style.display = 'block';
    content.innerHTML = '<p><strong>正在分析中...</strong></p><p>请稍候，AI 正在分析问题...</p>';
    actions.innerHTML = '';

    AI.diagnose({
      title: title,
      description: description,
      device: document.getElementById('issue-device')?.selectedOptions?.[0]?.dataset?.name || ''
    }).then(result => {
      btn.classList.remove('loading');
      btn.disabled = false;

      let html = '';
      if (result.tags && result.tags.length) {
        html += `<p><strong>推荐标签：</strong>${result.tags.join('、')}</p>`;
      }
      if (result.stage) {
        html += `<p><strong>推荐阶段：</strong>${STAGE_CONFIG[result.stage]?.label || result.stage}</p>`;
      }
      if (result.suggestion) {
        html += `<p><strong>可能原因：</strong>${this.escapeHtml(result.suggestion)}</p>`;
      }
      if (result.solution) {
        html += `<p><strong>处理建议：</strong>${this.escapeHtml(result.solution)}</p>`;
      }

      content.innerHTML = html || '<p>暂无建议</p>';

      actions.innerHTML = `
        <button class="btn btn-primary" id="btn-apply-ai">应用推荐结果</button>
        <button class="btn btn-ghost" id="btn-close-ai">关闭</button>
      `;

      document.getElementById('btn-apply-ai').addEventListener('click', () => {
        if (result.tags && result.tags.length) {
          this._editingTags = [...result.tags];
          this.updateTagChips();
        }
        if (result.stage) {
          document.getElementById('issue-stage').value = result.stage;
        }
        box.style.display = 'none';
        Toast.show('已应用推荐结果', 'success');
      });

      document.getElementById('btn-close-ai').addEventListener('click', () => {
        box.style.display = 'none';
      });
    }).catch(err => {
      btn.classList.remove('loading');
      btn.disabled = false;
      content.innerHTML = `<p style="color: var(--stage-danger);"><strong>分析失败：</strong>${this.escapeHtml(err.message || '未知错误')}</p>`;
      actions.innerHTML = `<button class="btn btn-ghost" id="btn-close-ai">关闭</button>`;
      document.getElementById('btn-close-ai').addEventListener('click', () => {
        box.style.display = 'none';
      });
    });
  },

  renderIssueFooter(issue) {
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = `
      ${issue ? `<button class="btn btn-ghost" id="btn-delete-issue" style="margin-right: auto; color: var(--stage-danger);">删除</button>` : ''}
      <button class="btn btn-ghost" id="btn-cancel">取消</button>
      <button class="btn btn-primary" id="btn-save">保存</button>
    `;

    document.getElementById('btn-cancel').addEventListener('click', () => this.close());
    document.getElementById('btn-save').addEventListener('click', () => this.saveIssue());

    const deleteBtn = document.getElementById('btn-delete-issue');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteIssue());
    }
  },

  saveIssue() {
    const title = document.getElementById('issue-title').value.trim();
    if (!title) {
      Toast.show('请填写异常标题');
      return;
    }

    const stage = document.getElementById('issue-stage').value;
    const assigneeSelect = document.getElementById('issue-assignee');
    const assignee = assigneeSelect.value;
    const assigneeInitial = assigneeSelect.selectedOptions[0]?.dataset?.initial || '';
    const deviceSelect = document.getElementById('issue-device');
    const deviceId = deviceSelect.value;
    const device = deviceSelect.selectedOptions[0]?.dataset?.name || '';
    const description = document.getElementById('issue-description').value.trim();
    const knowledgeId = document.getElementById('issue-knowledge').value || null;

    const data = {
      title,
      stage,
      assignee: assignee || null,
      assigneeInitial: assigneeInitial || null,
      deviceId: deviceId || null,
      device: device || '',
      tags: [...this._editingTags],
      description,
      knowledgeId
    };

    if (this._currentId) {
      Store.updateIssue(this._currentId, data);
      Toast.show('已更新', 'success');
    } else {
      Store.addIssue(data);
      Toast.show('已添加', 'success');
    }

    this.close();
  },

  deleteIssue() {
    if (!this._currentId) return;

    Dialog.confirm({
      title: '删除异常',
      message: '确定要删除这条异常记录吗？此操作不可撤销。',
      type: 'danger',
      confirmText: '确认删除',
      onConfirm: () => {
        Store.deleteIssue(this._currentId);
        Toast.show('已删除', 'success');
        this.close();
      }
    });
  },

  renderDeviceBody(device) {
    const body = document.getElementById('modal-body');
    body.innerHTML = `
      <div class="form-group">
        <label class="form-label required">设备名称</label>
        <input type="text" class="form-input" id="device-name" placeholder="例如：HUAWEI WATCH GT 4" value="${this.escapeHtml(device?.name || '')}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label required">设备型号</label>
          <input type="text" class="form-input" id="device-model" placeholder="例如：TET-B19" value="${this.escapeHtml(device?.model || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">设备类型</label>
          <select class="form-select" id="device-type">
            ${DEVICE_TYPES.map(t => `
              <option value="${t}" ${device?.type === t ? 'selected' : ''}>${t}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">出厂时间</label>
          <input type="date" class="form-input" id="device-date" value="${device?.manufactureDate || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">设备状态</label>
          <select class="form-select" id="device-status">
            ${Object.entries(DEVICE_STATUS).map(([key, val]) => `
              <option value="${key}" ${device?.status === key ? 'selected' : ''}>${val.label}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">备注</label>
        <textarea class="form-textarea" id="device-note" placeholder="补充说明..." rows="3">${this.escapeHtml(device?.note || '')}</textarea>
      </div>
    `;
  },

  renderDeviceFooter(device) {
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = `
      ${device ? `<button class="btn btn-ghost" id="btn-delete-device" style="margin-right: auto; color: var(--stage-danger);">删除</button>` : ''}
      <button class="btn btn-ghost" id="btn-cancel">取消</button>
      <button class="btn btn-primary" id="btn-save">保存</button>
    `;

    document.getElementById('btn-cancel').addEventListener('click', () => this.close());
    document.getElementById('btn-save').addEventListener('click', () => this.saveDevice());

    const deleteBtn = document.getElementById('btn-delete-device');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        Devices.deleteDevice(this._currentId);
        this.close();
      });
    }
  },

  saveDevice() {
    const name = document.getElementById('device-name').value.trim();
    if (!name) {
      Toast.show('请填写设备名称');
      return;
    }

    const model = document.getElementById('device-model').value.trim();
    if (!model) {
      Toast.show('请填写设备型号');
      return;
    }

    const data = {
      name,
      model,
      type: document.getElementById('device-type').value,
      manufactureDate: document.getElementById('device-date').value || null,
      status: document.getElementById('device-status').value,
      note: document.getElementById('device-note').value.trim()
    };

    if (this._currentId) {
      Store.updateDevice(this._currentId, data);
      Toast.show('已更新', 'success');
    } else {
      Store.addDevice(data);
      Toast.show('已添加', 'success');
    }

    this.close();
  },

  renderAISettingsBody(settings) {
    const body = document.getElementById('modal-body');
    body.innerHTML = `
      <div class="settings-section">
        <div class="settings-section-title">API 配置</div>
        <div class="form-group">
          <label class="form-label">豆包 API Key</label>
          <input type="password" class="form-input" id="ai-api-key" placeholder="请输入 API Key" value="${this.escapeHtml(settings.aiApiKey || '')}">
          <div class="form-hint">API Key 仅保存在本地浏览器，不会上传到任何服务器。</div>
        </div>
        <div class="form-group">
          <label class="form-label">模型选择</label>
          <select class="form-select" id="ai-model">
            <option value="doubao-pro-32k" ${settings.aiModel === 'doubao-pro-32k' ? 'selected' : ''}>Doubao-pro-32k（推荐）</option>
            <option value="doubao-pro-128k" ${settings.aiModel === 'doubao-pro-128k' ? 'selected' : ''}>Doubao-pro-128k</option>
            <option value="doubao-lite-32k" ${settings.aiModel === 'doubao-lite-32k' ? 'selected' : ''}>Doubao-lite-32k</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">使用说明</div>
        <div style="font-size: 13px; line-height: 1.7; color: var(--text-secondary);">
          <p style="margin-bottom: 8px;">1. 在新增或编辑异常时，点击「AI 智能诊断」按钮</p>
          <p style="margin-bottom: 8px;">2. AI 会自动分析问题，推荐标签、阶段和解决方案</p>
          <p style="margin-bottom: 8px;">3. 点击「应用推荐结果」一键填充到表单</p>
          <p>4. API Key 请在火山引擎方舟平台获取</p>
        </div>
      </div>
    `;
  },

  renderAISettingsFooter() {
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = `
      <button class="btn btn-ghost" id="btn-cancel">取消</button>
      <button class="btn btn-primary" id="btn-save-settings">保存设置</button>
    `;

    document.getElementById('btn-cancel').addEventListener('click', () => this.close());
    document.getElementById('btn-save-settings').addEventListener('click', () => {
      const apiKey = document.getElementById('ai-api-key').value.trim();
      const model = document.getElementById('ai-model').value;
      Store.updateSettings({
        aiApiKey: apiKey,
        aiModel: model,
        aiEnabled: !!apiKey
      });
      Toast.show('设置已保存', 'success');
      this.close();
    });
  },

  show() {
    document.getElementById('modal-overlay').classList.add('show');
    const firstInput = document.querySelector('.modal-body input, .modal-body select, .modal-body textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  },

  close() {
    document.getElementById('modal-overlay').classList.remove('show');
    this._currentType = null;
    this._currentId = null;
    this._editingTags = [];
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};