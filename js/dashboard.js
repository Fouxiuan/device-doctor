const Dashboard = (function() {
    let filterStage = null;
    let draggedIssueId = null;

    function init() {
        bindEvents();
        render();
    }

    function bindEvents() {
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', () => {
                const stage = card.dataset.stage;
                toggleFilter(stage);
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const stage = card.dataset.stage;
                    toggleFilter(stage);
                }
            });
        });

        document.querySelectorAll('.kanban-cards').forEach(column => {
            column.addEventListener('dragover', handleDragOver);
            column.addEventListener('dragenter', handleDragEnter);
            column.addEventListener('dragleave', handleDragLeave);
            column.addEventListener('drop', handleDrop);
        });
    }

    function render() {
        const issues = Store.getIssues();
        const devices = Store.getDevices();
        
        const counts = {
            verifying: 0,
            detecting: 0,
            normal: 0,
            danger: 0,
            wearing: 0
        };

        issues.forEach(issue => {
            if (counts[issue.stage] !== undefined) {
                counts[issue.stage]++;
            }
        });

        const totalIssues = issues.length;
        const resolvedIssues = counts.normal + counts.danger + counts.wearing;
        const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;
        const avgTime = calculateAvgTime(issues);

        updateSummaryStats(totalIssues, devices.length, resolutionRate, avgTime);

        Object.keys(counts).forEach(stage => {
            const countEl = document.getElementById(`count-${stage}`);
            const kanbanCountEl = document.getElementById(`kanban-count-${stage}`);
            if (countEl) countEl.textContent = counts[stage];
            if (kanbanCountEl) kanbanCountEl.textContent = counts[stage];
        });

        Object.keys(STAGES).forEach(stage => {
            const column = document.getElementById(`kanban-${stage}`);
            if (!column) return;
            
            const stageIssues = issues.filter(i => i.stage === stage);
            const filteredIssues = filterStage && filterStage !== stage ? [] : stageIssues;
            
            if (filteredIssues.length === 0) {
                column.innerHTML = `
                    <div class="kanban-empty">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <path d="M9 9h6M9 13h6M9 17h4"/>
                        </svg>
                        <span>暂无设备</span>
                    </div>
                `;
            } else {
                column.innerHTML = filteredIssues.map(issue => renderIssueCard(issue)).join('');
            }
            
            column.querySelectorAll('.issue-card').forEach(card => {
                card.addEventListener('dragstart', handleDragStart);
                card.addEventListener('dragend', handleDragEnd);
                card.addEventListener('click', handleCardClick);
                card.addEventListener('keydown', handleCardKeydown);
            });
        });

        document.querySelectorAll('.stat-card').forEach(card => {
            const stage = card.dataset.stage;
            if (filterStage === stage) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    function renderIssueCard(issue) {
        const date = new Date(issue.updatedAt);
        const dateStr = formatDate(date);
        const assigneeInitial = issue.assignee ? issue.assignee.charAt(0) : '?';
        const tagsHtml = issue.tags && issue.tags.length > 0 
            ? issue.tags.slice(0, 3).map(tag => `<span class="issue-tag">${escapeHtml(tag)}</span>`).join('')
            : '';
        
        const knowledgeBadge = issue.knowledgeId ? `
            <div class="issue-knowledge-badge" title="已关联知识库方案">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
            </div>
        ` : '';

        return `
            <div class="issue-card stage-${issue.stage}" 
                 draggable="true" 
                 data-id="${issue.id}"
                 data-stage="${issue.stage}"
                 role="button"
                 tabindex="0"
                 aria-label="异常 ${escapeHtml(issue.id)}：${escapeHtml(issue.title)}，按 Enter 编辑，按方向键移动阶段">
                ${knowledgeBadge}
                <div class="issue-card-header">
                    <span class="issue-id">${escapeHtml(issue.id)}</span>
                    <span class="issue-device">${escapeHtml(issue.deviceId)}</span>
                </div>
                <div class="issue-title">${escapeHtml(issue.title)}</div>
                <div class="issue-tags">
                    ${tagsHtml}
                </div>
                <div class="issue-footer">
                    <div class="issue-assignee">
                        <div class="assignee-avatar">${assigneeInitial}</div>
                        <span class="assignee-name">${escapeHtml(issue.assignee || '未指派')}</span>
                    </div>
                    <span class="issue-date">${dateStr}</span>
                </div>
            </div>
        `;
    }

    function handleDragStart(e) {
        draggedIssueId = e.currentTarget.dataset.id;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedIssueId);
    }

    function handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        draggedIssueId = null;
        
        document.querySelectorAll('.kanban-column').forEach(col => {
            col.classList.remove('drag-over');
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(e) {
        e.preventDefault();
        const column = e.currentTarget.closest('.kanban-column');
        if (column) {
            column.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        const column = e.currentTarget.closest('.kanban-column');
        if (column && !column.contains(e.relatedTarget)) {
            column.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        const targetStage = e.currentTarget.dataset.stage;
        const issueId = e.dataTransfer.getData('text/plain') || draggedIssueId;
        
        if (!issueId || !targetStage) return;
        
        const issue = Store.getIssueById(issueId);
        if (!issue || issue.stage === targetStage) return;
        
        Store.updateIssueStage(issueId, targetStage);
        
        const column = e.currentTarget.closest('.kanban-column');
        if (column) {
            column.classList.remove('drag-over');
        }
        
        render();
        
        if (window.App && typeof window.App.showToast === 'function') {

        
            window.App.showToast(`已将设备移至「${STAGES[targetStage].label}」`, 'success');

        
        }
    }

    function handleCardClick(e) {
        if (e.target.closest('.issue-card') && e.type === 'click') {
            const card = e.currentTarget;
            const issueId = card.dataset.id;
            const issue = Store.getIssueById(issueId);
            if (issue && typeof Modal !== 'undefined') {
                Modal.openIssueModal(issue);
            }
        }
    }

    // 键盘支持：Enter 编辑，左右方向键移动阶段（拖拽的键盘替代方案）
    function handleCardKeydown(e) {
        const card = e.currentTarget;
        const issueId = card.dataset.id;
        const currentStage = card.dataset.stage;

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const issue = Store.getIssueById(issueId);
            if (issue && typeof Modal !== 'undefined') {
                Modal.openIssueModal(issue);
            }
            return;
        }

        const stageOrder = ['verifying', 'detecting', 'normal', 'danger', 'wearing'];
        const idx = stageOrder.indexOf(currentStage);
        let targetStage = null;

        if (e.key === 'ArrowRight' && idx < stageOrder.length - 1) {
            targetStage = stageOrder[idx + 1];
        } else if (e.key === 'ArrowLeft' && idx > 0) {
            targetStage = stageOrder[idx - 1];
        }

        if (targetStage) {
            e.preventDefault();
            Store.updateIssueStage(issueId, targetStage);
            render();
            if (window.App && typeof window.App.showToast === 'function') {
                window.App.showToast(`已将设备移至「${STAGES[targetStage].label}」`, 'success');
            }
            // 重新聚焦到移动后的卡片
            setTimeout(() => {
                const movedCard = document.querySelector(`.issue-card[data-id="${issueId}"]`);
                if (movedCard) movedCard.focus();
            }, 50);
        }
    }

    function toggleFilter(stage) {
        if (filterStage === stage) {
            filterStage = null;
        } else {
            filterStage = stage;
        }
        render();
    }

    function clearFilter() {
        filterStage = null;
        render();
    }

    function formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
            }
            return `${hours}小时前`;
        } else if (days === 1) {
            return '昨天';
        } else if (days < 7) {
            return `${days}天前`;
        } else {
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function calculateAvgTime(issues) {
        const resolvedIssues = issues.filter(i => i.stage === 'normal' || i.stage === 'danger' || i.stage === 'wearing');
        if (resolvedIssues.length === 0) return 'N/A';
        
        const totalHours = resolvedIssues.reduce((sum, issue) => {
            const createdAt = new Date(issue.createdAt);
            const updatedAt = new Date(issue.updatedAt);
            return sum + (updatedAt - createdAt) / (1000 * 60 * 60);
        }, 0);
        
        const avgHours = totalHours / resolvedIssues.length;
        if (avgHours < 1) {
            return `${Math.round(avgHours * 60)}分钟`;
        } else if (avgHours < 24) {
            return `${Math.round(avgHours)}小时`;
        } else {
            return `${Math.round(avgHours / 24)}天`;
        }
    }

    function updateSummaryStats(totalIssues, totalDevices, resolutionRate, avgTime) {
        let statsRow = document.querySelector('.stats-row');
        if (!statsRow) return;

        const summaryCard = statsRow.querySelector('.summary-card');
        if (summaryCard) {
            summaryCard.querySelector('.summary-issues').textContent = totalIssues;
            summaryCard.querySelector('.summary-devices').textContent = totalDevices;
            summaryCard.querySelector('.summary-rate').textContent = resolutionRate;
            summaryCard.querySelector('.summary-time').textContent = avgTime;
        }
    }

    return {
        init,
        render,
        clearFilter
    };
})();