const Modal = (function() {
    let currentMode = 'add-issue';
    let currentIssue = null;
    let selectedTags = [];
    let selectedKnowledgeId = null;

    function showToast(message, type = 'info') {
        if (window.App && typeof window.App.showToast === 'function') {
            window.App.showToast(message, type);
        }
    }

    function init() {
        bindEvents();
    }

    function bindEvents() {
        const overlay = document.getElementById('modal-overlay');
        const closeBtn = document.getElementById('modal-close');
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    close();
                }
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', close);
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                close();
            }
        });
    }

    function openIssueModal(issue = null) {
        currentMode = issue ? 'edit-issue' : 'add-issue';
        currentIssue = issue;
        selectedTags = issue ? [...(issue.tags || [])] : [];
        selectedKnowledgeId = issue ? (issue.knowledgeId || null) : null;

        const title = issue ? '编辑异常' : '新增异常';
        renderIssueForm(issue);
        setTitle(title);
        show();

        setTimeout(() => {
            const firstInput = document.querySelector('#modal-body input, #modal-body textarea, #modal-body select');
            if (firstInput) firstInput.focus();
        }, 200);
    }

    function openKnowledgeModal(item = null) {
        currentMode = item ? 'edit-knowledge' : 'add-knowledge';
        selectedTags = item ? [...(item.tags || [])] : [];
        
        const title = item ? '编辑方案' : '新增方案';
        renderKnowledgeForm(item);
        setTitle(title);
        show();
        
        setTimeout(() => {
            const firstInput = document.querySelector('#modal-body input, #modal-body textarea');
            if (firstInput) firstInput.focus();
        }, 200);
    }

    function renderIssueForm(issue) {
        const body = document.getElementById('modal-body');
        const footer = document.getElementById('modal-footer');

        const allTags = Store.getTags();
        const stages = Object.entries(STAGES).map(([key, val]) => ({ value: key, label: val.label }));
        const devices = Store.getDevices();
        const currentDeviceId = issue ? issue.deviceId : '';

        body.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="form-device">设备编号</label>
                    <select class="form-select" id="form-device" name="form-device">
                        <option value="">请选择设备…</option>
                        ${devices.map(d => `
                            <option value="${escapeHtml(d.deviceId)}" ${currentDeviceId === d.deviceId ? 'selected' : ''}>
                                ${escapeHtml(d.deviceId)}
                            </option>
                        `).join('')}
                    </select>
                    <div class="form-hint" id="form-device-name">${currentDeviceId ? _getDeviceName(devices, currentDeviceId) : '选择设备编号后显示设备名称'}</div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="form-stage">当前阶段</label>
                    <select class="form-select" id="form-stage" name="form-stage">
                        ${stages.map(s => `
                            <option value="${s.value}" ${issue && issue.stage === s.value ? 'selected' : ''}>
                                ${s.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="form-title">异常现象简述</label>
                <input type="text" class="form-input" id="form-title" 
                       name="form-title"
                       placeholder="简要描述异常现象…"
                       value="${escapeHtml(issue ? issue.title : '')}">
            </div>
            
            <div class="form-group">
                <label class="form-label" for="form-assignee">负责人</label>
                <div class="assignee-input-wrap">
                    <input type="text" class="form-input" id="form-assignee" 
                           name="form-assignee"
                           placeholder="输入姓名，支持 @ 提及…"
                           value="${escapeHtml(issue ? issue.assignee : '')}"
                           autocomplete="off">
                    <div class="assignee-suggestions" id="assignee-suggestions"></div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="tag-add-input">异常标签</label>
                <div class="tag-selector" id="tag-selector" role="group" aria-label="异常标签选择">
                    ${allTags.map(tag => `
                        <span class="tag-item ${selectedTags.includes(tag) ? 'selected' : ''}" data-tag="${escapeHtml(tag)}" role="button" tabindex="0" aria-pressed="${selectedTags.includes(tag) ? 'true' : 'false'}">
                            ${escapeHtml(tag)}
                        </span>
                    `).join('')}
                    <div class="tag-input-wrap">
                        <input type="text" class="tag-add-input" id="tag-add-input" placeholder="添加标签…" autocomplete="off" name="tag-add">
                    </div>
                </div>
                <div class="form-hint">点击标签选中或取消，可添加自定义标签</div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="form-description">详细描述 / 现场记录</label>
                <textarea class="form-textarea" id="form-description" 
                          placeholder="详细描述异常现象、复现步骤、现场情况等…">${escapeHtml(issue ? issue.description : '')}</textarea>
            </div>
            
            <div id="ai-diagnosis-area"></div>
            <div class="form-group">
                <button type="button" class="btn btn-secondary ai-diagnose-btn" id="btn-ai-diagnose">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M10 2L11.5 6.5L16 8L11.5 9.5L10 14L8.5 9.5L4 8L8.5 6.5L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                    </svg>
                    <span>AI 智能诊疗</span>
                </button>
                <div class="form-hint">基于异常信息自动推荐标签、阶段、原因分析和处理建议</div>
            </div>
            
            <div id="knowledge-suggestion-area"></div>
        `;
        
        footer.innerHTML = `
            <button class="btn btn-secondary" id="btn-modal-cancel">取消</button>
            <button class="btn btn-primary" id="btn-modal-save">
                ${issue ? '保存修改' : '保存并创建'}
            </button>
            ${!issue ? `
                <button class="btn btn-primary" id="btn-modal-save-link">
                    保存并关联知识库
                </button>
            ` : ''}
        `;
        
        bindFormEvents();
    }

    function _getDeviceName(devices, deviceId) {
        const device = devices.find(d => d.deviceId === deviceId);
        return device ? `设备名称：${device.name}` : '未找到对应设备';
    }

    function renderKnowledgeForm(item) {
        const body = document.getElementById('modal-body');
        const footer = document.getElementById('modal-footer');
        
        const allTags = Store.getTags();
        const statuses = [
            { value: 'verified', label: '已验证' },
            { value: 'pending', label: '待完善' },
            { value: 'high-risk', label: '高风险' }
        ];
        
        body.innerHTML = `
            <div class="form-group">
                <label class="form-label" for="form-k-title">方案标题</label>
                <input type="text" class="form-input" id="form-k-title" 
                       name="form-k-title"
                       placeholder="方案名称，如：温度传感器校准流程…"
                       value="${escapeHtml(item ? item.title : '')}">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="form-k-status">状态</label>
                    <select class="form-select" id="form-k-status" name="form-k-status">
                        ${statuses.map(s => `
                            <option value="${s.value}" ${item && item.status === s.value ? 'selected' : ''}>
                                ${s.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="form-k-author">作者</label>
                    <input type="text" class="form-input" id="form-k-author" 
                           name="form-k-author"
                           placeholder="作者姓名…"
                           value="${escapeHtml(item ? item.author : '')}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="tag-add-input">标签</label>
                <div class="tag-selector" id="tag-selector" role="group" aria-label="方案标签选择">
                    ${allTags.map(tag => `
                        <span class="tag-item ${selectedTags.includes(tag) ? 'selected' : ''}" data-tag="${escapeHtml(tag)}" role="button" tabindex="0" aria-pressed="${selectedTags.includes(tag) ? 'true' : 'false'}">
                            ${escapeHtml(tag)}
                        </span>
                    `).join('')}
                    <div class="tag-input-wrap">
                        <input type="text" class="tag-add-input" id="tag-add-input" placeholder="添加标签…" autocomplete="off" name="tag-add-k">
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="form-k-devices">关联设备（用逗号分隔）</label>
                <input type="text" class="form-input" id="form-k-devices" 
                       name="form-k-devices"
                       placeholder="如：A-1023, A-1056…"
                       value="${item && item.relatedDevices ? item.relatedDevices.join(', ') : ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label" for="form-k-content">处理步骤 / 方案内容</label>
                <textarea class="form-textarea" id="form-k-content" 
                          name="form-k-content"
                          style="min-height: 160px;"
                          placeholder="详细的处理步骤、注意事项、参考资料等…">${escapeHtml(item ? item.content : '')}</textarea>
            </div>
        `;
        
        footer.innerHTML = `
            <button class="btn btn-secondary" id="btn-modal-cancel">取消</button>
            <button class="btn btn-primary" id="btn-modal-save-k">保存方案</button>
        `;
        
        bindKnowledgeFormEvents();
    }

    function bindFormEvents() {
        const cancelBtn = document.getElementById('btn-modal-cancel');
        const saveBtn = document.getElementById('btn-modal-save');
        const saveLinkBtn = document.getElementById('btn-modal-save-link');
        const aiDiagnoseBtn = document.getElementById('btn-ai-diagnose');

        if (cancelBtn) cancelBtn.addEventListener('click', close);
        if (saveBtn) saveBtn.addEventListener('click', () => saveIssue(false));
        if (saveLinkBtn) saveLinkBtn.addEventListener('click', () => saveIssue(true));
        if (aiDiagnoseBtn) aiDiagnoseBtn.addEventListener('click', handleAIDiagnose);

        // 设备编号选择后实时显示设备名称
        const deviceSelect = document.getElementById('form-device');
        const deviceNameHint = document.getElementById('form-device-name');
        if (deviceSelect && deviceNameHint) {
            deviceSelect.addEventListener('change', () => {
                const devices = Store.getDevices();
                const deviceId = deviceSelect.value;
                if (deviceId) {
                    deviceNameHint.textContent = _getDeviceName(devices, deviceId);
                    deviceNameHint.classList.add('has-device');
                } else {
                    deviceNameHint.textContent = '选择设备编号后显示设备名称';
                    deviceNameHint.classList.remove('has-device');
                }
            });
        }

        bindTagSelector();
        bindAssigneeSuggestions();

        const titleInput = document.getElementById('form-title');
        const tagsInput = document.getElementById('tag-add-input');
        if (titleInput) {
            titleInput.addEventListener('input', debounce(updateKnowledgeSuggestion, 300));
        }
    }

    async function handleAIDiagnose() {
        const btn = document.getElementById('btn-ai-diagnose');
        const area = document.getElementById('ai-diagnosis-area');
        if (!btn || !area) return;

        const title = document.getElementById('form-title')?.value.trim() || '';
        const description = document.getElementById('form-description')?.value.trim() || '';
        const deviceId = document.getElementById('form-device')?.value.trim() || '';

        if (!title && !description) {
            showToast('请先填写异常标题或描述', 'error');
            return;
        }

        if (typeof AIDoctor === 'undefined' || !AIDoctor.isConfigured()) {
            showToast('请先在右上角设置中配置 AI API Key', 'error');
            return;
        }

        // 获取设备信息
        const device = deviceId ? Store.getDeviceByDeviceId(deviceId) : null;

        btn.disabled = true;
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="20 10" class="ai-spin"/>
            </svg>
            <span>AI 诊断中…</span>
        `;
        area.innerHTML = '';

        try {
            const result = await AIDoctor.diagnose({
                title,
                description,
                deviceId,
                deviceName: device?.name,
                deviceType: device?.type
            });

            if (result.error) {
                showToast(result.error, 'error');
                return;
            }

            renderAIDiagnosis(result);
            showToast('AI 诊断完成', 'success');
        } catch (e) {
            showToast('AI 诊断失败：' + e.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 2L11.5 6.5L16 8L11.5 9.5L10 14L8.5 9.5L4 8L8.5 6.5L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                </svg>
                <span>AI 智能诊疗</span>
            `;
        }
    }

    function renderAIDiagnosis(result) {
        const area = document.getElementById('ai-diagnosis-area');
        if (!area) return;

        const severityMap = { low: '低', medium: '中', high: '高' };
        const severityColor = { low: 'var(--status-verified)', medium: 'var(--status-pending)', high: 'var(--status-high-risk)' };

        let tagsHtml = '';
        if (result.recommendedTags && result.recommendedTags.length > 0) {
            tagsHtml = `
                <div class="ai-diag-section">
                    <div class="ai-diag-label">推荐标签</div>
                    <div class="ai-diag-tags">
                        ${result.recommendedTags.map(tag => `
                            <button type="button" class="ai-tag-suggest" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        let stageHtml = '';
        if (result.recommendedStage) {
            const stageLabel = STAGES[result.recommendedStage]?.label || result.recommendedStage;
            stageHtml = `
                <div class="ai-diag-section">
                    <div class="ai-diag-label">推荐阶段</div>
                    <button type="button" class="ai-stage-suggest" data-stage="${escapeHtml(result.recommendedStage)}">${escapeHtml(stageLabel)}</button>
                </div>
            `;
        }

        let causeHtml = result.possibleCause ? `
            <div class="ai-diag-section">
                <div class="ai-diag-label">可能原因</div>
                <div class="ai-diag-text">${escapeHtml(result.possibleCause)}</div>
            </div>
        ` : '';

        let suggestionHtml = result.suggestion ? `
            <div class="ai-diag-section">
                <div class="ai-diag-label">处理建议</div>
                <div class="ai-diag-text">${escapeHtml(result.suggestion)}</div>
            </div>
        ` : '';

        let severityHtml = result.severity ? `
            <div class="ai-diag-severity" style="color: ${severityColor[result.severity] || 'inherit'}">
                严重程度：${escapeHtml(severityMap[result.severity] || result.severity)}
            </div>
        ` : '';

        area.innerHTML = `
            <div class="ai-diagnosis-result">
                <div class="ai-diag-header">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M10 2L11.5 6.5L16 8L11.5 9.5L10 14L8.5 9.5L4 8L8.5 6.5L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                    </svg>
                    <span>AI 诊断结果</span>
                    ${severityHtml}
                </div>
                ${tagsHtml}
                ${stageHtml}
                ${causeHtml}
                ${suggestionHtml}
                <div class="ai-diag-hint">点击推荐标签/阶段可快速应用</div>
            </div>
        `;

        // 绑定应用推荐标签
        area.querySelectorAll('.ai-tag-suggest').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                if (!selectedTags.includes(tag)) {
                    selectedTags.push(tag);
                    Store.addTag(tag);
                    refreshTagSelector();
                    btn.classList.add('applied');
                    showToast(`已添加标签：${tag}`, 'success');
                }
            });
        });

        // 绑定应用推荐阶段
        const stageBtn = area.querySelector('.ai-stage-suggest');
        if (stageBtn) {
            stageBtn.addEventListener('click', () => {
                const stage = stageBtn.dataset.stage;
                const select = document.getElementById('form-stage');
                if (select) {
                    select.value = stage;
                    stageBtn.classList.add('applied');
                    showToast(`已切换至：${STAGES[stage]?.label || stage}`, 'success');
                }
            });
        }
    }

    function bindKnowledgeFormEvents() {
        const cancelBtn = document.getElementById('btn-modal-cancel');
        const saveBtn = document.getElementById('btn-modal-save-k');
        
        if (cancelBtn) cancelBtn.addEventListener('click', close);
        if (saveBtn) saveBtn.addEventListener('click', saveKnowledge);
        
        bindTagSelector();
    }

    function bindTagSelector() {
        const tagSelector = document.getElementById('tag-selector');
        const tagAddInput = document.getElementById('tag-add-input');
        
        if (!tagSelector) return;
        
        tagSelector.querySelectorAll('.tag-item').forEach(item => {
            item.addEventListener('click', () => {
                const tag = item.dataset.tag;
                if (selectedTags.includes(tag)) {
                    selectedTags = selectedTags.filter(t => t !== tag);
                    item.classList.remove('selected');
                    item.setAttribute('aria-pressed', 'false');
                } else {
                    selectedTags.push(tag);
                    item.classList.add('selected');
                    item.setAttribute('aria-pressed', 'true');
                }
                updateKnowledgeSuggestion();
            });
            // 键盘支持
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
        
        if (tagAddInput) {
            tagAddInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const value = tagAddInput.value.trim().replace(/,/g, '');
                    if (value && !selectedTags.includes(value)) {
                        selectedTags.push(value);
                        Store.addTag(value);
                        refreshTagSelector();
                    }
                    tagAddInput.value = '';
                }
            });
        }
    }

    function refreshTagSelector() {
        const tagSelector = document.getElementById('tag-selector');
        const allTags = Store.getTags();
        
        const inputWrap = tagSelector.querySelector('.tag-input-wrap');
        
        const existingTags = allTags.map(tag => `
            <span class="tag-item ${selectedTags.includes(tag) ? 'selected' : ''}" data-tag="${escapeHtml(tag)}" role="button" tabindex="0" aria-pressed="${selectedTags.includes(tag) ? 'true' : 'false'}">
                ${escapeHtml(tag)}
            </span>
        `).join('');
        
        tagSelector.innerHTML = existingTags;
        if (inputWrap) tagSelector.appendChild(inputWrap);
        
        bindTagSelector();
    }

    function bindAssigneeSuggestions() {
        const input = document.getElementById('form-assignee');
        const suggestions = document.getElementById('assignee-suggestions');
        
        if (!input || !suggestions) return;
        
        input.addEventListener('input', () => {
            const query = input.value.trim().toLowerCase();
            if (!query || query === '@') {
                suggestions.classList.remove('show');
                return;
            }
            
            const searchQuery = query.startsWith('@') ? query.slice(1) : query;
            const matches = ASSIGNEES.filter(name => 
                name.toLowerCase().includes(searchQuery)
            );
            
            if (matches.length > 0) {
                suggestions.innerHTML = matches.map(name => `
                    <div class="assignee-suggestion-item" data-name="${escapeHtml(name)}" role="option" tabindex="0" aria-label="选择 ${escapeHtml(name)}">
                        <div class="assignee-suggestion-avatar">${name.charAt(0)}</div>
                        <span class="assignee-suggestion-name">${escapeHtml(name)}</span>
                    </div>
                `).join('');
                suggestions.classList.add('show');
                
                suggestions.querySelectorAll('.assignee-suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        input.value = item.dataset.name;
                        suggestions.classList.remove('show');
                        input.focus();
                    });
                    item.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            item.click();
                        }
                    });
                });
            } else {
                suggestions.classList.remove('show');
            }
        });
        
        input.addEventListener('focus', () => {
            if (input.value.trim()) {
                input.dispatchEvent(new Event('input'));
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.classList.remove('show');
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                suggestions.classList.remove('show');
            }
        });
    }

    function updateKnowledgeSuggestion() {
        const area = document.getElementById('knowledge-suggestion-area');
        if (!area) return;
        
        const title = document.getElementById('form-title')?.value || '';
        
        const tempIssue = {
            title: title,
            tags: selectedTags,
            deviceId: document.getElementById('form-device')?.value || ''
        };
        
        const similar = Store.findSimilarKnowledge(tempIssue);
        
        if (similar.length === 0) {
            area.innerHTML = '';
            return;
        }
        
        area.innerHTML = `
            <div class="knowledge-suggestion">
                <div class="knowledge-suggestion-title">
                    🔍 为您推荐 ${similar.length} 个相似方案
                </div>
                <div class="knowledge-suggestion-list" role="listbox" aria-label="相似方案推荐">
                    ${similar.map(k => `
                        <div class="knowledge-suggestion-item ${selectedKnowledgeId === k.id ? 'selected' : ''}" 
                             data-id="${k.id}"
                             role="option"
                             tabindex="0"
                             aria-selected="${selectedKnowledgeId === k.id ? 'true' : 'false'}"
                             aria-label="${escapeHtml(k.title)}">
                            ${escapeHtml(k.title)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        area.querySelectorAll('.knowledge-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                if (selectedKnowledgeId === id) {
                    selectedKnowledgeId = null;
                } else {
                    selectedKnowledgeId = id;
                }
                updateKnowledgeSuggestion();
            });
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    function saveIssue(linkKnowledge) {
        const deviceId = document.getElementById('form-device')?.value.trim();
        const title = document.getElementById('form-title')?.value.trim();
        const stage = document.getElementById('form-stage')?.value;
        const assignee = document.getElementById('form-assignee')?.value.trim();
        const description = document.getElementById('form-description')?.value.trim();
        
        if (!deviceId) {
            showToast('请填写设备编号', 'error');
            document.getElementById('form-device')?.focus();
            return;
        }
        
        if (!title) {
            showToast('请填写异常简述', 'error');
            document.getElementById('form-title')?.focus();
            return;
        }
        
        const issueData = {
            deviceId,
            title,
            stage: stage || 'verifying',
            assignee: assignee || '未指派',
            tags: selectedTags,
            description
        };
        
        if (linkKnowledge && selectedKnowledgeId) {
            issueData.knowledgeId = selectedKnowledgeId;
        }
        
        let savedIssue;
        if (currentIssue) {
            savedIssue = Store.updateIssue(currentIssue.id, issueData);
            showToast('已保存修改', 'success');
        } else {
            savedIssue = Store.addIssue(issueData);
            showToast(linkKnowledge ? '已创建并关联知识库方案' : '已创建异常记录', 'success');
        }
        
        if (linkKnowledge && selectedKnowledgeId) {
            Store.incrementKnowledgeSolve(selectedKnowledgeId);
        }
        
        close();
        refreshAll();
    }

    function saveKnowledge() {
        const title = document.getElementById('form-k-title')?.value.trim();
        const status = document.getElementById('form-k-status')?.value;
        const author = document.getElementById('form-k-author')?.value.trim();
        const devicesStr = document.getElementById('form-k-devices')?.value.trim();
        const content = document.getElementById('form-k-content')?.value.trim();
        
        if (!title) {
            showToast('请填写方案标题', 'error');
            document.getElementById('form-k-title')?.focus();
            return;
        }
        
        const relatedDevices = devicesStr 
            ? devicesStr.split(/[,，]/).map(s => s.trim()).filter(s => s) 
            : [];
        
        const data = {
            title,
            status: status || 'pending',
            author: author || '匿名',
            tags: selectedTags,
            relatedDevices,
            content
        };
        
        if (currentMode === 'edit-knowledge' && currentIssue) {
            Store.updateKnowledge(currentIssue.id, data);
            showToast('已保存修改', 'success');
        } else {
            Store.addKnowledge(data);
            showToast('已创建知识库方案', 'success');
        }
        
        close();
        refreshAll();
    }

    function refreshAll() {
        if (typeof Dashboard !== 'undefined') Dashboard.render();
        if (typeof Knowledge !== 'undefined') Knowledge.render();
        if (typeof DeviceManager !== 'undefined') DeviceManager.render();
    }

    function openDeviceModal(device = null) {
        currentMode = device ? 'edit-device' : 'add-device';
        currentIssue = device;
        selectedTags = [];
        
        const title = device ? '编辑设备' : '新增设备';
        renderDeviceForm(device);
        setTitle(title);
        show();
        
        setTimeout(() => {
            const firstInput = document.querySelector('#modal-body input, #modal-body textarea, #modal-body select');
            if (firstInput) firstInput.focus();
        }, 200);
    }

    function renderDeviceForm(device) {
        const body = document.getElementById('modal-body');
        const footer = document.getElementById('modal-footer');
        
        const deviceTypes = Store.getDeviceTypes();
        const statuses = [
            { value: 'active', label: '使用中' },
            { value: 'maintenance', label: '维修中' },
            { value: 'retired', label: '已退役' }
        ];
        
        body.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="form-d-deviceId">设备编号 *</label>
                    <input type="text" class="form-input" id="form-d-deviceId" 
                           name="form-d-deviceId"
                           placeholder="如：A-1023…"
                           value="${escapeHtml(device ? device.deviceId : '')}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="form-d-status">设备状态</label>
                    <select class="form-select" id="form-d-status" name="form-d-status">
                        ${statuses.map(s => `
                            <option value="${s.value}" ${device && device.status === s.value ? 'selected' : ''}>
                                ${s.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="form-d-name">设备名称 *</label>
                <input type="text" class="form-input" id="form-d-name" 
                       name="form-d-name"
                       placeholder="如：智能手环 Pro…"
                       value="${escapeHtml(device ? device.name : '')}">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="form-d-model">设备型号</label>
                    <input type="text" class="form-input" id="form-d-model" 
                           name="form-d-model"
                           placeholder="如：SH-Pro-2026…"
                           value="${escapeHtml(device ? device.model : '')}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="form-d-type">设备类型</label>
                    <select class="form-select" id="form-d-type" name="form-d-type">
                        ${deviceTypes.map(t => `
                            <option value="${escapeHtml(t)}" ${device && device.type === t ? 'selected' : ''}>
                                ${escapeHtml(t)}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="form-d-productionDatetime">出厂日期时间</label>
                <input type="datetime-local" class="form-input" id="form-d-productionDatetime" 
                       name="form-d-productionDatetime"
                       value="${escapeHtml(device ? device.productionDatetime : '')}">
            </div>
            
            <div class="form-group">
                <label class="form-label" for="form-d-remark">备注信息</label>
                <textarea class="form-textarea" id="form-d-remark" 
                          name="form-d-remark"
                          placeholder="设备配置、使用情况、特殊说明等…">${escapeHtml(device ? device.remark : '')}</textarea>
            </div>
        `;
        
        footer.innerHTML = `
            <button class="btn btn-secondary" id="btn-modal-cancel">取消</button>
            <button class="btn btn-primary" id="btn-modal-save-device">
                ${device ? '保存修改' : '创建设备'}
            </button>
        `;
        
        bindDeviceFormEvents();
    }

    function bindDeviceFormEvents() {
        const cancelBtn = document.getElementById('btn-modal-cancel');
        const saveBtn = document.getElementById('btn-modal-save-device');
        
        if (cancelBtn) cancelBtn.addEventListener('click', close);
        if (saveBtn) saveBtn.addEventListener('click', saveDevice);
    }

    function saveDevice() {
        const deviceId = document.getElementById('form-d-deviceId')?.value.trim();
        const name = document.getElementById('form-d-name')?.value.trim();
        const status = document.getElementById('form-d-status')?.value;
        const model = document.getElementById('form-d-model')?.value.trim();
        const type = document.getElementById('form-d-type')?.value;
        const productionDatetime = document.getElementById('form-d-productionDatetime')?.value;
        const remark = document.getElementById('form-d-remark')?.value.trim();
        
        if (!deviceId) {
            showToast('请填写设备编号', 'error');
            document.getElementById('form-d-deviceId')?.focus();
            return;
        }
        
        if (!name) {
            showToast('请填写设备名称', 'error');
            document.getElementById('form-d-name')?.focus();
            return;
        }
        
        const data = {
            deviceId,
            name,
            status: status || 'active',
            model: model || '',
            type: type || '',
            productionDatetime: productionDatetime || '',
            remark: remark || ''
        };
        
        if (currentMode === 'edit-device' && currentIssue) {
            Store.updateDevice(currentIssue.id, data);
            showToast('已保存修改', 'success');
        } else {
            const existing = Store.getDeviceByDeviceId(deviceId);
            if (existing) {
                showToast('该设备编号已存在', 'error');
                document.getElementById('form-d-deviceId')?.focus();
                return;
            }
            Store.addDevice(data);
            showToast('设备已创建', 'success');
        }
        
        close();
        refreshAll();
    }

    function setTitle(title) {
        const titleEl = document.getElementById('modal-title');
        if (titleEl) titleEl.textContent = title;
    }

    let lastFocusedElement = null;

    function show() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            lastFocusedElement = document.activeElement;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            document.addEventListener('focusin', trapFocus);
        }
    }

    function close() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            document.removeEventListener('focusin', trapFocus);
        }
        currentIssue = null;
        selectedTags = [];
        selectedKnowledgeId = null;
        // 焦点恢复到触发元素
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            setTimeout(() => {
                try { lastFocusedElement.focus(); } catch (e) {}
            }, 100);
        }
    }

    function trapFocus(e) {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay || !overlay.classList.contains('active')) return;
        if (!overlay.contains(e.target)) {
            // 焦点跳出模态框，拉回第一个可聚焦元素
            const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length > 0) {
                e.preventDefault();
                focusable[0].focus();
            }
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    return {
        init,
        openIssueModal,
        openKnowledgeModal,
        openDeviceModal,
        close
    };
})();
