const Knowledge = (function() {
    let searchQuery = '';
    let activeTags = [];
    let currentDocId = null;
    let editMode = false;
    let editDraft = '';

    function init() {
        bindEvents();
    }

    function render() {
        renderTags();
        renderSidebar();
        renderContent();
    }

    function bindEvents() {
        const searchInput = document.getElementById('knowledge-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim().toLowerCase();
                renderSidebar();
            });
        }

        const addCategoryBtn = document.getElementById('btn-add-category');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', handleAddCategory);
        }

        const addDocBtn = document.getElementById('btn-add-doc');
        if (addDocBtn) {
            addDocBtn.addEventListener('click', () => handleAddDocument());
        }

        const toggleEditBtn = document.getElementById('kb-toggle-edit');
        if (toggleEditBtn) {
            toggleEditBtn.addEventListener('click', toggleEditMode);
        }

        // Ctrl+S / Cmd+S 快捷键保存文档
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                if (editMode && currentDocId) {
                    e.preventDefault();
                    saveDocument();
                }
            }
        });
    }

    function renderTags() {
        const tagList = document.getElementById('tag-list');
        if (!tagList) return;

        const allTags = Store.getTags();
        
        if (allTags.length === 0) {
            tagList.innerHTML = '<span style="color: var(--text-tertiary); font-size: 12px;">暂无标签</span>';
            return;
        }

        tagList.innerHTML = allTags.map(tag => `
            <button class="kb-filter-tag ${activeTags.includes(tag) ? 'active' : ''}" data-tag="${escapeHtml(tag)}">
                ${escapeHtml(tag)}
            </button>
        `).join('');

        tagList.querySelectorAll('.kb-filter-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                toggleTag(tag);
            });
        });
    }

    function renderSidebar() {
        const container = document.getElementById('kb-categories');
        if (!container) return;

        const categories = Store.getKnowledgeCategories();
        const allDocs = Store.getKnowledge();
        const docMap = new Map(allDocs.map(d => [d.id, d]));

        let filteredDocIds = new Set();
        if (searchQuery || activeTags.length > 0) {
            allDocs.forEach(doc => {
                let match = true;
                if (searchQuery) {
                    const titleMatch = doc.title && doc.title.toLowerCase().includes(searchQuery);
                    const tagMatch = doc.tags && doc.tags.some(t => t.toLowerCase().includes(searchQuery));
                    const contentMatch = doc.content && doc.content.toLowerCase().includes(searchQuery);
                    const deviceMatch = doc.relatedDevices && doc.relatedDevices.some(d => d.toLowerCase().includes(searchQuery));
                    match = titleMatch || tagMatch || contentMatch || deviceMatch;
                }
                if (match && activeTags.length > 0) {
                    match = doc.tags && activeTags.every(tag => doc.tags.includes(tag));
                }
                if (match) {
                    filteredDocIds.add(doc.id);
                }
            });
        }

        let html = '';
        categories.forEach(cat => {
            const visibleDocs = (cat.documents || []).filter(docId => {
                if (searchQuery || activeTags.length > 0) {
                    return filteredDocIds.has(docId);
                }
                return true;
            });

            if ((searchQuery || activeTags.length > 0) && visibleDocs.length === 0) {
                return;
            }

            const expanded = cat.expanded !== false;
            
            html += `
                <div class="kb-category" data-cat-id="${cat.id}">
                    <div class="kb-category-header" tabindex="0" role="button" aria-expanded="${expanded ? 'true' : 'false'}" aria-label="分类 ${escapeHtml(cat.name)}，${expanded ? '已展开，点击折叠' : '已折叠，点击展开'}">
                        <span class="kb-category-toggle" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${expanded ? 'rotated' : ''}">
                                <path d="M6 8L10 12L14 8"/>
                            </svg>
                        </span>
                        <span class="kb-category-name">${escapeHtml(cat.name)}</span>
                        <span class="kb-category-count">${visibleDocs.length}</span>
                        <div class="kb-category-actions">
                            <button class="kb-cat-action" data-action="add-doc" title="添加文档" aria-label="为分类 ${escapeHtml(cat.name)} 添加文档">
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                                    <path d="M10 4V16M4 10H16" stroke-linecap="round"/>
                                </svg>
                            </button>
                            <button class="kb-cat-action" data-action="rename" title="重命名" aria-label="重命名分类 ${escapeHtml(cat.name)}">
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                                    <path d="M4 16V18H6L14.5 9.5L12.5 7.5L4 16Z"/>
                                    <path d="M14 5.5L16 3.5L18 5.5L16 7.5L14 5.5Z"/>
                                </svg>
                            </button>
                            <button class="kb-cat-action danger" data-action="delete" title="删除分类" aria-label="删除分类 ${escapeHtml(cat.name)}">
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                                    <path d="M3 6h14M8 6V4h4v2M6 6l1 10h6l1-10" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="kb-doc-list ${expanded ? '' : 'collapsed'}" data-cat-docs="${cat.id}">
                        ${visibleDocs.map(docId => {
                            const doc = docMap.get(docId);
                            if (!doc) return '';
                            const active = doc.id === currentDocId;
                            return `
                                <div class="kb-doc-item ${active ? 'active' : ''}" data-doc-id="${doc.id}" data-cat-id="${cat.id}" role="button" tabindex="0" aria-label="文档 ${escapeHtml(doc.title)}${active ? '（当前选中）' : ''}">
                                    <svg class="kb-doc-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                                        <path d="M6 2h7l4 4v12H6z" stroke-linejoin="round"/>
                                        <path d="M13 2v4h4" stroke-linejoin="round"/>
                                        <path d="M9 10h6M9 14h4" stroke-linecap="round"/>
                                    </svg>
                                    <span class="kb-doc-name">${escapeHtml(doc.title)}</span>
                                    <div class="kb-doc-item-actions">
                                        <button class="kb-doc-del" data-doc-action="delete" title="删除文档" aria-label="删除文档 ${escapeHtml(doc.title)}">&times;</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        if (!html) {
            html = `<div class="kb-sidebar-empty">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.4;">
                    <path d="M8 8h32v32H8z" rx="3"/>
                    <path d="M14 16h20M14 24h20M14 32h12" stroke-linecap="round"/>
                </svg>
                <div style="font-size: 13px; color: var(--text-tertiary);">${searchQuery || activeTags.length > 0 ? '未找到匹配文档' : '暂无分类'}</div>
            </div>`;
        }

        container.innerHTML = html;
        bindSidebarEvents(container);
    }

    function bindSidebarEvents(container) {
        container.querySelectorAll('.kb-category-header').forEach(header => {
            const catId = header.parentElement.dataset.catId;

            // 整个分类栏点击展开/折叠
            // 操作按钮（添加文档/重命名/删除）已 stopPropagation，不会触发此处
            header.addEventListener('click', () => {
                toggleCategory(catId);
            });

            // 键盘支持：在分类栏上按 Enter/空格切换展开
            header.addEventListener('keydown', (e) => {
                if (e.target.closest('.kb-cat-action')) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCategory(catId);
                }
            });

            header.querySelector('[data-action="add-doc"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                handleAddDocument(catId);
            });

            header.querySelector('[data-action="rename"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                handleRenameCategory(catId);
            });

            header.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteCategory(catId);
            });
        });

        container.querySelectorAll('.kb-doc-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('[data-doc-action]')) return;
                const docId = item.dataset.docId;
                selectDocument(docId);
            });
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (e.target.closest('[data-doc-action]')) return;
                    const docId = item.dataset.docId;
                    selectDocument(docId);
                }
            });

            item.querySelector('[data-doc-action="delete"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                const docId = item.dataset.docId;
                handleDeleteDocument(docId);
            });
        });
    }

    function renderContent() {
        const titleEl = document.getElementById('kb-doc-title');
        const metaEl = document.getElementById('kb-doc-meta');
        const bodyEl = document.getElementById('kb-doc-body');
        const toggleBtn = document.getElementById('kb-toggle-edit');

        if (!currentDocId) {
            if (titleEl) titleEl.textContent = '选择一篇文档开始阅读';
            if (metaEl) metaEl.innerHTML = '';
            if (toggleBtn) toggleBtn.style.display = 'none';
            if (bodyEl) {
                bodyEl.innerHTML = `
                    <div class="kb-doc-empty">
                        <svg class="kb-doc-empty-icon" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
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

        const doc = Store.getKnowledgeById(currentDocId);
        if (!doc) {
            currentDocId = null;
            renderContent();
            return;
        }

        if (toggleBtn) {
            toggleBtn.style.display = '';
            toggleBtn.innerHTML = editMode ? `
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M4 12l4 4 8-8"/>
                </svg>
                保存
            ` : `
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M4 16V18H6L14.5 9.5L12.5 7.5L4 16Z"/>
                    <path d="M14 5.5L16 3.5L18 5.5L16 7.5L14 5.5Z"/>
                </svg>
                编辑
            `;
        }

        // 编辑模式下显示"取消"按钮，非编辑模式隐藏
        const actionsEl = document.querySelector('.kb-content-actions');
        let cancelBtn = document.getElementById('kb-cancel-edit');
        if (editMode && !cancelBtn && actionsEl) {
            cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-ghost kb-cancel-edit';
            cancelBtn.id = 'kb-cancel-edit';
            cancelBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M4 4L16 16M16 4L4 16" stroke-linecap="round"/>
                </svg>
                取消
            `;
            cancelBtn.addEventListener('click', cancelEdit);
            actionsEl.insertBefore(cancelBtn, toggleBtn);
        } else if (!editMode && cancelBtn) {
            cancelBtn.remove();
        }

        if (titleEl) {
            titleEl.textContent = doc.title || '无标题文档';
        }

        if (metaEl) {
            const tagsHtml = doc.tags && doc.tags.length > 0
                ? doc.tags.map(t => `<span class="kb-meta-tag">${escapeHtml(t)}</span>`).join('')
                : '';
            const author = doc.author || '未知作者';
            const date = doc.createdAt || doc.updatedAt || '';
            metaEl.innerHTML = `
                <span class="kb-meta-item">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                        <circle cx="8" cy="5.5" r="3"/>
                        <path d="M2.5 14c.8-2.6 3-4 5.5-4s4.7 1.4 5.5 4" stroke-linecap="round"/>
                    </svg>
                    ${escapeHtml(author)}
                </span>
                ${date ? `<span class="kb-meta-item">${formatDate(date)}</span>` : ''}
                <span class="kb-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="overflow: visible;" aria-hidden="true">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                    </svg>
                    ${doc.solveCount || 0} 次解决
                </span>
                <span class="kb-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="overflow: visible;" aria-hidden="true">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                    ${doc.likes || 0}
                </span>
                <div class="kb-meta-tags">${tagsHtml}</div>
            `;
        }

        if (bodyEl) {
            if (editMode) {
                bodyEl.innerHTML = `
                    <div class="kb-editor-wrap">
                        <div class="kb-editor-pane">
                            <div class="kb-editor-pane-label">编辑</div>
                            <textarea class="kb-editor" id="kb-editor-textarea"
                                      placeholder="支持 Markdown 语法…&#10;&#10;# 标题&#10;**加粗** *斜体* &#96;代码&#96;&#10;- 列表项&#10;> 引用"
                                      aria-label="Markdown 编辑器">${escapeHtml(editDraft)}</textarea>
                        </div>
                        <div class="kb-editor-divider"></div>
                        <div class="kb-preview-pane">
                            <div class="kb-editor-pane-label">预览</div>
                            <div class="kb-doc-content kb-preview-content" id="kb-preview">${renderMarkdown(editDraft)}</div>
                        </div>
                    </div>
                `;
                const textarea = document.getElementById('kb-editor-textarea');
                const preview = document.getElementById('kb-preview');
                if (textarea) {
                    textarea.addEventListener('input', (e) => {
                        editDraft = e.target.value;
                        if (preview) {
                            preview.innerHTML = renderMarkdown(editDraft);
                        }
                    });
                    textarea.focus();
                    textarea.setSelectionRange(0, 0);
                }
            } else {
                bodyEl.innerHTML = `
                    <div class="kb-doc-content">
                        ${renderMarkdown(doc.content || '')}
                    </div>
                `;
            }
        }
    }

    function renderMarkdown(text) {
        if (!text) return '';
        
        let html = escapeHtml(text);
        
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/`(.+?)`/g, '<code>$1</code>');
        
        html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
        
        html = html.replace(/^(\d+)\. (.*$)/gm, (m, num, content) => {
            return `<li class="ol-li">${content}</li>`;
        });
        html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
        
        html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, (match) => {
            const isOl = match.includes('class="ol-li"');
            const tag = isOl ? 'ol' : 'ul';
            const items = match.replace(/class="ol-li"/g, '').trim();
            return `<${tag}>${items}</${tag}>`;
        });
        
        const lines = html.split('\n');
        let inPara = false;
        let result = [];
        
        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                if (inPara) {
                    result.push('</p>');
                    inPara = false;
                }
                continue;
            }
            if (/^<(h[1-6]|ul|ol|li|blockquote|pre|code)/.test(trimmed) || /^<\/(ul|ol|li|blockquote|pre|code)/.test(trimmed)) {
                if (inPara) {
                    result.push('</p>');
                    inPara = false;
                }
                result.push(line);
            } else {
                if (!inPara) {
                    result.push('<p>');
                    inPara = true;
                } else {
                    // 段落内的单换行渲染为 <br>，符合 Word 式输入习惯
                    // 用户按一次回车即显示一次换行，无需 Shift+Enter
                    result.push('<br>');
                }
                result.push(line);
            }
        }
        if (inPara) {
            result.push('</p>');
        }
        
        return result.join('\n');
    }

    function toggleTag(tag) {
        const index = activeTags.indexOf(tag);
        if (index === -1) {
            activeTags.push(tag);
        } else {
            activeTags.splice(index, 1);
        }
        renderTags();
        renderSidebar();
    }

    function toggleCategory(catId) {
        const cat = Store.getCategoryById(catId);
        if (!cat) return;
        Store.updateCategory(catId, { expanded: cat.expanded === false ? true : false });
        renderSidebar();
    }

    async function selectDocument(docId) {
        if (editMode && currentDocId && editDraft !== Store.getKnowledgeById(currentDocId)?.content) {
            const ok = await Dialog.confirm({
                title: '放弃修改？',
                message: '当前文档有未保存的修改，切换后将无法恢复。',
                confirmText: '放弃修改',
                cancelText: '继续编辑',
                danger: true
            });
            if (!ok) {
                return;
            }
        }
        currentDocId = docId;
        editMode = false;
        const doc = Store.getKnowledgeById(docId);
        editDraft = doc?.content || '';
        renderSidebar();
        renderContent();
    }

    function toggleEditMode() {
        if (!currentDocId) return;
        
        if (editMode) {
            saveDocument();
        } else {
            const doc = Store.getKnowledgeById(currentDocId);
            editDraft = doc?.content || '';
            editMode = true;
            renderContent();
        }
    }

    async function cancelEdit() {
        if (!currentDocId) return;

        // 检查是否有未保存的修改
        const doc = Store.getKnowledgeById(currentDocId);
        if (editDraft !== (doc?.content || '')) {
            const ok = await Dialog.confirm({
                title: '放弃修改？',
                message: '当前文档有未保存的修改，放弃后将无法恢复。',
                confirmText: '放弃修改',
                cancelText: '继续编辑',
                danger: true
            });
            if (!ok) {
                return;
            }
        }

        // 如果是新建的空文档（无标题且无内容），取消时直接删除
        if (doc && doc.title === '无标题文档' && !doc.content) {
            // 找到文档所在分类并移除
            const categories = Store.getKnowledgeCategories();
            categories.forEach(cat => {
                if (cat.documents && cat.documents.includes(currentDocId)) {
                    Store.removeDocumentFromCategory(cat.id, currentDocId);
                }
            });
            Store.deleteKnowledge(currentDocId);
            currentDocId = null;
            if (window.App && typeof window.App.showToast === 'function') {
                window.App.showToast('已放弃新建文档', 'info');
            }
        } else {
            // 恢复草稿为已保存内容
            editDraft = doc?.content || '';
            if (window.App && typeof window.App.showToast === 'function') {
                window.App.showToast('已取消编辑', 'info');
            }
        }

        editMode = false;
        renderSidebar();
        renderContent();
    }

    function saveDocument() {
        if (!currentDocId) return;

        const trimmedDraft = editDraft.trim();
        const firstLine = trimmedDraft ? trimmedDraft.split('\n').find(l => l.trim()) : '';
        let title = firstLine ? firstLine.replace(/^#+\s*/, '').trim() : '';
        if (!title) title = '无标题文档';

        Store.updateKnowledge(currentDocId, {
            content: editDraft,
            title: title,
            updatedAt: new Date().toISOString()
        });
        
        editMode = false;
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('文档已保存', 'success');
        }
        renderSidebar();
        renderContent();
    }

    async function handleAddCategory() {
        const name = await Dialog.prompt({
            title: '新建分类',
            message: '请输入分类名称：',
            placeholder: '分类名称',
            confirmText: '创建'
        });
        if (!name || !name.trim()) return;
        Store.addCategory(name.trim());
        renderSidebar();
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('分类已创建', 'success');
        }
    }

    async function handleRenameCategory(catId) {
        const cat = Store.getCategoryById(catId);
        if (!cat) return;
        const name = await Dialog.prompt({
            title: '重命名分类',
            message: '请输入新的分类名称：',
            defaultValue: cat.name,
            confirmText: '保存'
        });
        if (!name || !name.trim()) return;
        Store.updateCategory(catId, { name: name.trim() });
        renderSidebar();
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('分类已重命名', 'success');
        }
    }

    async function handleDeleteCategory(catId) {
        const cat = Store.getCategoryById(catId);
        if (!cat) return;
        const ok = await Dialog.confirm({
            title: '删除分类',
            message: `确定要删除分类「${cat.name}」吗？\n（仅删除分类，文档会保留）`,
            confirmText: '删除',
            cancelText: '取消',
            danger: true
        });
        if (!ok) return;
        Store.deleteCategory(catId);
        renderSidebar();
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('分类已删除', 'success');
        }
    }

    function handleAddDocument(categoryId) {
        // 防御：过滤掉 Event 对象等非字符串参数
        if (categoryId && typeof categoryId !== 'string') {
            categoryId = null;
        }

        const categories = Store.getKnowledgeCategories();
        let catId = categoryId;
        
        if (!catId) {
            if (categories.length === 0) {
                const newCat = Store.addCategory('默认分类');
                catId = newCat.id;
            } else {
                catId = categories[0].id;
            }
        }
        
        // 自动展开目标分类，确保新建文档在列表中可见
        const targetCat = Store.getCategoryById(catId);
        if (targetCat && targetCat.expanded === false) {
            Store.updateCategory(catId, { expanded: true });
        }
        
        const newDoc = Store.addKnowledge({
            title: '无标题文档',
            content: '',
            tags: [],
            status: 'pending',
            author: '我'
        });
        
        Store.addDocumentToCategory(catId, newDoc.id);
        
        currentDocId = newDoc.id;
        editDraft = newDoc.content;
        editMode = true;
        
        renderSidebar();
        renderContent();
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('已创建新文档，开始编辑吧', 'success');
        }
    }

    async function handleDeleteDocument(docId) {
        const doc = Store.getKnowledgeById(docId);
        if (!doc) return;
        const ok = await Dialog.confirm({
            title: '删除文档',
            message: `确定要删除文档「${doc.title}」吗？\n此操作不可恢复。`,
            confirmText: '删除',
            cancelText: '取消',
            danger: true
        });
        if (!ok) return;

        Store.deleteKnowledge(docId);
        
        if (currentDocId === docId) {
            currentDocId = null;
            editMode = false;
        }
        
        renderSidebar();
        renderContent();
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast('文档已删除', 'success');
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function clearFilters() {
        searchQuery = '';
        activeTags = [];
        const searchInput = document.getElementById('knowledge-search');
        if (searchInput) searchInput.value = '';
        renderSidebar();
    }

    return {
        init,
        render,
        clearFilters
    };
})();
