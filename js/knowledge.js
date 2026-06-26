const Knowledge = {
  _currentDocId: null,
  _searchKeyword: '',
  _selectedTags: [],
  _expandedCategories: new Set(),
  _isEditing: false,
  _editContent: '',
  _allTags: [],

  init() {
    this.bindEvents();
    Store.getCategories().forEach(cat => this._expandedCategories.add(cat.id));
    this.render();
    Store.subscribe(() => this.render());
  },

  bindEvents() {
    const searchInput = document.getElementById('knowledge-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this._searchKeyword = e.target.value.trim();
        this.renderSidebar();
      });
    }

    const addCatBtn = document.getElementById('btn-add-category');
    if (addCatBtn) {
      addCatBtn.addEventListener('click', () => this.addCategory());
    }

    const addDocBtn = document.getElementById('btn-add-doc');
    if (addDocBtn) {
      addDocBtn.addEventListener('click', () => this.newDocument());
    }

    const toggleEditBtn = document.getElementById('kb-toggle-edit');
    if (toggleEditBtn) {
      toggleEditBtn.addEventListener('click', () => this.toggleEdit());
    }
  },

  render() {
    this.renderSidebar();
    this.renderContent();
  },

  renderSidebar() {
    this._allTags = Store.getAllTags();
    this.renderTagList();
    this.renderCategories();
  },

  renderTagList() {
    const tagList = document.getElementById('tag-list');
    if (!tagList) return;

    if (this._allTags.length === 0) {
      tagList.innerHTML = '<span style="font-size: 11px; color: var(--text-tertiary);">暂无标签</span>';
      return;
    }

    tagList.innerHTML = this._allTags.slice(0, 10).map(tag => `
      <span class="kb-sidebar-tag-chip ${this._selectedTags.includes(tag) ? 'active' : ''}" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>
    `).join('');

    tagList.querySelectorAll('.kb-sidebar-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        if (this._selectedTags.includes(tag)) {
          this._selectedTags = this._selectedTags.filter(t => t !== tag);
        } else {
          this._selectedTags.push(tag);
        }
        this.renderCategories();
        this.renderTagList();
      });
    });
  },

  renderCategories() {
    const container = document.getElementById('kb-categories');
    if (!container) return;

    const categories = Store.getCategories();
    const allKnowledge = this.getFilteredKnowledge();

    if (categories.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px 16px; text-align: center; color: var(--text-tertiary); font-size: 13px;">
          暂无分类，点击上方 + 新建
        </div>
      `;
      return;
    }

    container.innerHTML = categories.map(cat => {
      const docs = allKnowledge.filter(k => k.categoryId === cat.id);
      const isExpanded = this._expandedCategories.has(cat.id);

      return `
        <div class="kb-category-group" data-id="${cat.id}">
          <div class="kb-category-header" data-id="${cat.id}">
            <svg class="kb-category-toggle ${isExpanded ? 'expanded' : ''}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 5L13 10L7 15" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg class="kb-category-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 5C3 4.44772 3.44772 4 4 4H8L10 6H16C16.5523 6 17 6.44772 17 7V15C17 15.5523 16.5523 16 16 16H4C3.44772 16 3 15.5523 3 15V5Z" stroke-linejoin="round"/>
            </svg>
            <span class="kb-category-name">${this.escapeHtml(cat.name)}</span>
            <span class="kb-category-count">${docs.length}</span>
            <div class="kb-category-actions">
              <button class="kb-cat-action-btn" data-action="rename" title="重命名">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M8.5 1.5L10.5 3.5L4.5 9.5L2.5 9.5L2.5 7.5L8.5 1.5Z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="kb-cat-action-btn danger" data-action="delete" title="删除">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M2.5 3.5H9.5M5 3.5V2.5C5 2.22386 5.22386 2 5.5 2H6.5C6.77614 2 7 2.22386 7 2.5V3.5M3.5 3.5L4 10C4 10.2761 4.22386 10.5 4.5 10.5H7.5C7.77614 10.5 8 10.2761 8 10L8.5 3.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          ${isExpanded ? `
            <div class="kb-doc-list">
              ${docs.length === 0 ? `
                <div style="padding: 8px 12px 8px 34px; font-size: 12px; color: var(--text-tertiary);">暂无文档</div>
              ` : docs.map(doc => `
                <div class="kb-doc-list-item ${this._currentDocId === doc.id ? 'active' : ''}" data-id="${doc.id}">
                  <svg class="kb-doc-list-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 2H10L13 5V14C13 14.5523 12.5523 15 12 15H3C2.44772 15 2 14.5523 2 14V2C2 1.44772 2.44772 1 3 1Z" stroke-linejoin="round"/>
                    <path d="M10 2V5H13" stroke-linejoin="round"/>
                  </svg>
                  <span class="kb-doc-list-title">${this.escapeHtml(doc.title)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    container.querySelectorAll('.kb-category-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.kb-category-actions')) return;
        const catId = header.dataset.id;
        if (this._expandedCategories.has(catId)) {
          this._expandedCategories.delete(catId);
        } else {
          this._expandedCategories.add(catId);
        }
        this.renderCategories();
      });
    });

    container.querySelectorAll('.kb-cat-action-btn[data-action="rename"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const catId = btn.closest('.kb-category-group').dataset.id;
        this.renameCategory(catId);
      });
    });

    container.querySelectorAll('.kb-cat-action-btn[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const catId = btn.closest('.kb-category-group').dataset.id;
        this.deleteCategory(catId);
      });
    });

    container.querySelectorAll('.kb-doc-list-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectDocument(item.dataset.id);
      });
    });
  },

  getFilteredKnowledge() {
    let docs = Store.getKnowledge();

    if (this._searchKeyword) {
      docs = Store.searchKnowledge(this._searchKeyword);
    }

    if (this._selectedTags.length > 0) {
      docs = docs.filter(doc =>
        this._selectedTags.every(tag => (doc.tags || []).includes(tag))
      );
    }

    return docs;
  },

  renderContent() {
    const body = document.getElementById('kb-doc-body');
    const title = document.getElementById('kb-doc-title');
    const meta = document.getElementById('kb-doc-meta');
    const toggleBtn = document.getElementById('kb-toggle-edit');

    if (!this._currentDocId) {
      if (title) title.textContent = '选择一篇文档开始阅读';
      if (meta) meta.innerHTML = '';
      if (toggleBtn) toggleBtn.style.display = 'none';
      if (body) {
        body.innerHTML = `
          <div class="kb-doc-empty">
            <svg class="kb-doc-empty-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 8h32l12 12v36H12z" rx="3"/>
              <path d="M44 8v12h12"/>
              <path d="M20 28h24M20 36h20M20 44h16" stroke-linecap="round"/>
            </svg>
            <div class="kb-doc-empty-title">从左侧选择一篇文档</div>
            <div class="kb-doc-empty-desc">或点击右上角「新建文档」开始创作</div>
          </div>
        `;
      }
      return;
    }

    const doc = Store.getKnowledgeById(this._currentDocId);
    if (!doc) {
      this._currentDocId = null;
      this.renderContent();
      return;
    }

    if (title) title.textContent = doc.title;
    if (toggleBtn) {
      toggleBtn.style.display = 'inline-flex';
      toggleBtn.innerHTML = this._isEditing
        ? '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12L10 6L16 12" stroke-linecap="round" stroke-linejoin="round"/></svg> 预览'
        : '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 16V18H6L14.5 9.5L12.5 7.5L4 16Z"/><path d="M14 5.5L16 3.5L18 5.5L16 7.5L14 5.5Z"/></svg> 编辑';
    }

    if (meta) {
      const category = Store.getCategories().find(c => c.id === doc.categoryId);
      const relatedDevices = (doc.deviceIds || []).map(id => Store.getDeviceById(id)).filter(Boolean);

      meta.innerHTML = `
        ${category ? `<span class="kb-meta-item">📁 ${this.escapeHtml(category.name)}</span>` : ''}
        ${doc.updatedAt ? `<span class="kb-meta-item">📝 更新于 ${doc.updatedAt}</span>` : ''}
        ${doc.createdAt ? `<span class="kb-meta-item">📅 创建于 ${doc.createdAt}</span>` : ''}
        ${relatedDevices.length ? `<span class="kb-meta-item">📱 关联 ${relatedDevices.length} 台设备</span>` : ''}
      `;
    }

    if (body) {
      if (this._isEditing) {
        this.renderEditor(body, doc);
      } else {
        body.innerHTML = `<div class="kb-markdown">${this.renderMarkdown(doc.content || '')}</div>`;
      }
    }
  },

  renderEditor(body, doc) {
    body.innerHTML = `
      <div class="kb-editor-container">
        <div class="kb-editor-toolbar">
          <button class="kb-editor-btn" data-action="bold" title="粗体">**B**</button>
          <button class="kb-editor-btn" data-action="italic" title="斜体">*I*</button>
          <button class="kb-editor-btn" data-action="heading" title="标题"># H</button>
          <button class="kb-editor-btn" data-action="link" title="链接">🔗</button>
          <button class="kb-editor-btn" data-action="code" title="代码">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M7 15L2 10L7 5M13 5L18 10L13 15" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="kb-editor-btn" data-action="list" title="列表">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M5 6H17M5 10H17M5 14H17M2 6h.01M2 10h.01M2 14h.01" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="kb-editor-btn" data-action="quote" title="引用">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M7 4H4C3.44772 4 3 4.44772 3 5V8C3 8.55228 3.44772 9 4 9H5V16H8V9H7V4ZM17 4H14C13.4477 4 13 4.44772 13 5V8C13 8.55228 13.4477 9 14 9H15V16H18V9H17V4Z"/>
            </svg>
          </button>
          <span style="flex: 1;"></span>
          <button class="kb-editor-btn" id="kb-save-edit" style="color: var(--primary); font-weight: 600;">保存</button>
          <button class="kb-editor-btn" id="kb-cancel-edit" style="color: var(--stage-danger);">取消</button>
        </div>
        <div class="kb-editor-main">
          <textarea class="kb-editor-textarea" id="kb-edit-textarea" spellcheck="false">${this.escapeHtml(this._editContent)}</textarea>
          <div class="kb-editor-preview" id="kb-edit-preview"></div>
        </div>
      </div>
    `;

    const textarea = document.getElementById('kb-edit-textarea');
    const preview = document.getElementById('kb-edit-preview');

    if (textarea && preview) {
      preview.innerHTML = this.renderMarkdown(this._editContent);

      textarea.addEventListener('input', () => {
        this._editContent = textarea.value;
        preview.innerHTML = this.renderMarkdown(this._editContent);
      });

      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }

    document.getElementById('kb-save-edit')?.addEventListener('click', () => {
      this.saveEdit();
    });

    document.getElementById('kb-cancel-edit')?.addEventListener('click', () => {
      this.cancelEdit();
    });

    body.querySelectorAll('.kb-editor-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.insertMarkdown(btn.dataset.action);
      });
    });
  },

  insertMarkdown(action) {
    const textarea = document.getElementById('kb-edit-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    let prefix = '';
    let suffix = '';
    let newSelectionStart = start;
    let newSelectionEnd = end;

    switch (action) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        break;
      case 'heading':
        prefix = '\n## ';
        suffix = '';
        break;
      case 'link':
        prefix = '[';
        suffix = '](url)';
        break;
      case 'code':
        prefix = '`';
        suffix = '`';
        break;
      case 'list':
        prefix = '\n- ';
        suffix = '';
        break;
      case 'quote':
        prefix = '\n> ';
        suffix = '';
        break;
    }

    const newValue = textarea.value.substring(0, start) + prefix + selected + suffix + textarea.value.substring(end);
    textarea.value = newValue;
    this._editContent = newValue;

    newSelectionStart = start + prefix.length;
    newSelectionEnd = start + prefix.length + selected.length;

    textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
    textarea.focus();

    document.getElementById('kb-edit-preview').innerHTML = this.renderMarkdown(newValue);
  },

  renderMarkdown(text) {
    if (!text) return '<p style="color: var(--text-tertiary);">暂无内容</p>';

    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });

    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    html = html.replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(Boolean);
      const isHeader = cells.every(c => /^[-:]+$/.test(c.trim()));
      if (isHeader) return '';
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
    });
    html = html.replace(/(<tr>.*<\/tr>\n?)+/g, match => {
      if (match.includes('<td>')) {
        return `<table>${match.replace(/^\n/, '')}</table>\n`;
      }
      return match;
    });

    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');

    html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');

    html = html.replace(/(<li>.*<\/li>\n?)+/g, match => {
      if (match.includes('<li>')) {
        return `<ul>${match.replace(/^\n/, '')}</ul>\n`;
      }
      return match;
    });

    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    html = html.replace(/\n{3,}/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');

    return html;
  },

  selectDocument(id) {
    this._currentDocId = id;
    this._isEditing = false;
    const doc = Store.getKnowledgeById(id);
    if (doc) this._editContent = doc.content || '';
    this.render();
  },

  newDocument() {
    const categories = Store.getCategories();
    if (categories.length === 0) {
      Toast.show('请先创建一个分类');
      return;
    }

    Dialog.prompt({
      title: '新建文档',
      message: '请输入文档标题：',
      placeholder: '输入文档标题...',
      confirmText: '创建',
      onConfirm: (title) => {
        if (!title || !title.trim()) {
          Toast.show('请输入标题');
          return;
        }
        const newDoc = Store.addKnowledge({
          title: title.trim(),
          categoryId: categories[0].id,
          content: '## 概述\n\n在这里编写文档内容...',
          tags: [],
          deviceIds: []
        });
        this._expandedCategories.add(categories[0].id);
        this._currentDocId = newDoc.id;
        this._editContent = newDoc.content;
        this._isEditing = true;
        this.render();
        Toast.show('文档已创建', 'success');
      }
    });
  },

  toggleEdit() {
    if (!this._currentDocId) return;

    if (this._isEditing) {
      this.saveEdit();
    } else {
      const doc = Store.getKnowledgeById(this._currentDocId);
      this._editContent = doc.content || '';
      this._isEditing = true;
      this.renderContent();
    }
  },

  saveEdit() {
    if (!this._currentDocId) return;

    const doc = Store.getKnowledgeById(this._currentDocId);
    if (!doc) return;

    Store.updateKnowledge(this._currentDocId, { content: this._editContent });
    this._isEditing = false;
    this.render();
    Toast.show('保存成功', 'success');
  },

  cancelEdit() {
    this._isEditing = false;
    const doc = Store.getKnowledgeById(this._currentDocId);
    if (doc) this._editContent = doc.content || '';
    this.renderContent();
  },

  addCategory() {
    Dialog.prompt({
      title: '新增大类',
      message: '请输入分类名称：',
      placeholder: '例如：健康监测',
      confirmText: '添加',
      onConfirm: (name) => {
        if (!name || !name.trim()) {
          Toast.show('请输入名称');
          return;
        }
        const cat = Store.addCategory({ name: name.trim(), icon: 'folder' });
        this._expandedCategories.add(cat.id);
        this.renderSidebar();
        Toast.show('分类已添加', 'success');
      }
    });
  },

  renameCategory(id) {
    const cat = Store.getCategories().find(c => c.id === id);
    if (!cat) return;

    Dialog.prompt({
      title: '重命名分类',
      message: '请输入新的分类名称：',
      defaultValue: cat.name,
      placeholder: '输入名称...',
      confirmText: '保存',
      onConfirm: (name) => {
        if (!name || !name.trim()) {
          Toast.show('名称不能为空');
          return;
        }
        Store.updateCategory(id, { name: name.trim() });
        Toast.show('已重命名', 'success');
      }
    });
  },

  deleteCategory(id) {
    const cat = Store.getCategories().find(c => c.id === id);
    if (!cat) return;

    const docs = Store.getKnowledgeByCategory(id);
    let message = `确定要删除分类「${cat.name}」吗？`;
    if (docs.length > 0) {
      message += `\n\n该分类下有 ${docs.length} 篇文档，删除后这些文档将变为未分类。`;
    }

    Dialog.confirm({
      title: '删除分类',
      message: message,
      type: 'danger',
      confirmText: '确认删除',
      onConfirm: () => {
        Store.deleteCategory(id);
        this._expandedCategories.delete(id);
        Toast.show('分类已删除', 'success');
      }
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};