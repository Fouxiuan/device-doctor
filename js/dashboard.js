const Dashboard = {
  _filterStage: null,
  _dragData: null,

  init() {
    this.bindEvents();
    this.render();
    Store.subscribe(() => this.render());
  },

  bindEvents() {
    document.querySelectorAll('.stat-card[data-stage]').forEach(card => {
      card.addEventListener('click', () => this.toggleFilter(card.dataset.stage));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleFilter(card.dataset.stage);
        }
      });
    });

    document.querySelectorAll('.kanban-cards').forEach(column => {
      column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.closest('.kanban-column').classList.add('drag-over');
      });
      column.addEventListener('dragleave', (e) => {
        if (!column.contains(e.relatedTarget)) {
          column.closest('.kanban-column').classList.remove('drag-over');
        }
      });
      column.addEventListener('drop', (e) => {
        e.preventDefault();
        column.closest('.kanban-column').classList.remove('drag-over');
        const issueId = e.dataTransfer.getData('text/plain');
        const newStage = column.dataset.stage;
        if (issueId && newStage) {
          this.moveIssue(issueId, newStage);
        }
      });
    });
  },

  toggleFilter(stage) {
    if (this._filterStage === stage) {
      this._filterStage = null;
    } else {
      this._filterStage = stage;
    }
    this.updateFilterUI();
    this.render();
  },

  updateFilterUI() {
    document.querySelectorAll('.stat-card[data-stage]').forEach(card => {
      card.classList.toggle('active', card.dataset.stage === this._filterStage);
    });
  },

  render() {
    this.renderStats();
    this.renderKanban();
  },

  renderStats() {
    const issues = Store.getIssues();
    const devices = Store.getDevices();

    const counts = {
      verifying: 0,
      detecting: 0,
      normal: 0,
      danger: 0,
      wearing: 0
    };
    issues.forEach(i => { counts[i.stage] = (counts[i.stage] || 0) + 1; });

    document.getElementById('count-verifying').textContent = counts.verifying;
    document.getElementById('count-detecting').textContent = counts.detecting;
    document.getElementById('count-normal').textContent = counts.normal;
    document.getElementById('count-danger').textContent = counts.danger;
    document.getElementById('count-wearing').textContent = counts.wearing;

    document.querySelector('.summary-issues').textContent = issues.length;
    document.querySelector('.summary-devices').textContent = devices.length;

    const resolved = counts.normal + counts.wearing;
    const rate = issues.length ? Math.round(resolved / issues.length * 100) : 0;
    document.querySelector('.summary-rate').textContent = rate;

    let totalHours = 0;
    let timedCount = 0;
    issues.forEach(i => {
      if (i.createdAt && i.updatedAt) {
        const start = new Date(i.createdAt.replace(/-/g, '/'));
        const end = new Date(i.updatedAt.replace(/-/g, '/'));
        const hours = (end - start) / (1000 * 60 * 60);
        if (hours > 0) {
          totalHours += hours;
          timedCount++;
        }
      }
    });
    const avgHours = timedCount ? Math.round(totalHours / timedCount) : 0;
    document.querySelector('.summary-time').textContent = avgHours + 'h';

    document.getElementById('kanban-count-verifying').textContent = counts.verifying;
    document.getElementById('kanban-count-detecting').textContent = counts.detecting;
    document.getElementById('kanban-count-normal').textContent = counts.normal;
    document.getElementById('kanban-count-danger').textContent = counts.danger;
    document.getElementById('kanban-count-wearing').textContent = counts.wearing;
  },

  renderKanban() {
    const stages = ['verifying', 'detecting', 'normal', 'danger', 'wearing'];
    let issues = Store.getIssues();

    if (this._filterStage) {
      issues = issues.filter(i => i.stage === this._filterStage);
    }

    stages.forEach(stage => {
      const column = document.getElementById('kanban-' + stage);
      if (!column) return;

      const stageIssues = issues.filter(i => i.stage === stage);

      if (stageIssues.length === 0) {
        column.innerHTML = `
          <div class="kanban-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 12h6M12 9v6" stroke-linecap="round"/>
            </svg>
            <span>暂无数据</span>
          </div>
        `;
        return;
      }

      column.innerHTML = stageIssues.map(issue => this.renderCard(issue)).join('');

      column.querySelectorAll('.issue-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
          card.classList.add('dragging');
          this._dragData = card.dataset.id;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', card.dataset.id);
        });
        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
          this._dragData = null;
          document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
        });
        card.addEventListener('click', () => {
          Modal.openIssueModal(card.dataset.id);
        });
        card.addEventListener('keydown', (e) => {
          const idx = STAGE_ORDER.indexOf(card.closest('.kanban-cards').dataset.stage);
          if (e.key === 'ArrowRight' && idx < STAGE_ORDER.length - 1) {
            e.preventDefault();
            this.moveIssue(card.dataset.id, STAGE_ORDER[idx + 1]);
          } else if (e.key === 'ArrowLeft' && idx > 0) {
            e.preventDefault();
            this.moveIssue(card.dataset.id, STAGE_ORDER[idx - 1]);
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            Modal.openIssueModal(card.dataset.id);
          }
        });
      });
    });
  },

  renderCard(issue) {
    const config = STAGE_CONFIG[issue.stage] || {};
    const hasKnowledge = issue.knowledgeId && Store.getKnowledgeById(issue.knowledgeId);

    const tagsHtml = (issue.tags || []).slice(0, 3).map(tag =>
      `<span class="issue-tag">${this.escapeHtml(tag)}</span>`
    ).join('');

    return `
      <div class="issue-card ${config.cardClass || ''}" 
           draggable="true" 
           data-id="${issue.id}"
           tabindex="0"
           role="article"
           aria-label="${this.escapeHtml(issue.title)}">
        ${hasKnowledge ? `
          <div class="issue-knowledge-badge" title="已关联知识库">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 2C3.44772 2 3 2.44772 3 3V18C3 18.5523 3.44772 19 4 19H15L17 17V3C17 2.44772 16.5523 2 16 2H4Z" stroke-linejoin="round"/>
              <path d="M7 7H13M7 11H13M7 15H10" stroke-linecap="round"/>
            </svg>
          </div>
        ` : ''}
        <div class="issue-card-header">
          <span class="issue-id">${issue.id}</span>
          <span class="issue-device">${this.escapeHtml(issue.device)}</span>
        </div>
        <div class="issue-title">${this.escapeHtml(issue.title)}</div>
        ${tagsHtml ? `<div class="issue-tags">${tagsHtml}</div>` : ''}
        <div class="issue-footer">
          <div class="issue-assignee">
            <div class="assignee-avatar">${issue.assigneeInitial || '?'}</div>
            <span class="assignee-name">${this.escapeHtml(issue.assignee || '未分配')}</span>
          </div>
          <span class="issue-date">${this.formatDate(issue.updatedAt || issue.createdAt)}</span>
        </div>
      </div>
    `;
  },

  moveIssue(issueId, newStage) {
    const issue = Store.getIssueById(issueId);
    if (!issue) return;

    const oldStage = issue.stage;
    if (oldStage === newStage) return;

    Store.updateIssue(issueId, { stage: newStage });
    Toast.show(`已移动到「${STAGE_CONFIG[newStage]?.label || newStage}」`);
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr.replace(/-/g, '/'));
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return diffMins + '分钟前';
    if (diffHours < 24) return diffHours + '小时前';
    if (diffDays < 7) return diffDays + '天前';
    return dateStr.split(' ')[0];
  }
};