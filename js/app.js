const App = {
  _currentPage: 'dashboard',

  init() {
    Store.init();
    Dashboard.init();
    Devices.init();
    Knowledge.init();
    Modal.init();
    this.bindEvents();

    const settings = Store.getSettings();
    if (settings.firstVisit) {
      Store.updateSettings({ firstVisit: false });
      this.showTour();
    }
  },

  bindEvents() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchPage(tab.dataset.page);
      });
    });

    document.getElementById('btn-add-issue').addEventListener('click', () => {
      Modal.openIssueModal();
    });

    document.getElementById('btn-ai-settings').addEventListener('click', () => {
      Modal.openAISettingsModal();
    });

    document.getElementById('btn-export').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });

    document.getElementById('file-input').addEventListener('change', (e) => {
      this.importData(e.target.files[0]);
      e.target.value = '';
    });
  },

  switchPage(page) {
    if (this._currentPage === page) return;

    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.page === page);
      if (tab.dataset.page === page) {
        tab.setAttribute('aria-current', 'page');
      } else {
        tab.removeAttribute('aria-current');
      }
    });

    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === 'page-' + page);
    });

    this._currentPage = page;
  },

  exportData() {
    const data = Store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'device-doctor-data-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.show('数据已导出', 'success');
  },

  importData(file) {
    if (!file) return;

    Dialog.confirm({
      title: '导入数据',
      message: '选择导入方式：\n\n• 合并导入：保留现有数据，新增导入的内容\n• 覆盖导入：清空现有数据，替换为导入的内容',
      type: 'info',
      confirmText: '合并导入',
      cancelText: '取消',
      onConfirm: () => {
        this._doImport(file, true);
      },
      onCancel: () => {
        Dialog.confirm({
          title: '确认覆盖？',
          message: '覆盖导入将清空所有现有数据，此操作不可撤销。确定要继续吗？',
          type: 'danger',
          confirmText: '确认覆盖',
          onConfirm: () => {
            this._doImport(file, false);
          }
        });
      }
    });
  },

  _doImport(file, merge) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        Store.importData(e.target.result, merge);
        Toast.show(merge ? '合并导入成功' : '覆盖导入成功', 'success');
      } catch (err) {
        Toast.show('导入失败：' + err.message);
      }
    };
    reader.onerror = () => {
      Toast.show('文件读取失败');
    };
    reader.readAsText(file);
  },

  showTour() {
    const tour = document.getElementById('tour-overlay');
    if (!tour) return;

    const steps = [
      {
        target: '.navbar .nav-left',
        title: '欢迎使用设备诊疗师',
        desc: '这是一款专为可穿戴设备异常处理设计的工作台，让我们快速了解一下核心功能吧！',
        position: 'bottom'
      },
      {
        target: '.kanban-container',
        title: '状态看板',
        desc: '五列看板清晰展示每个阶段的异常处理进度，拖拽卡片即可变更状态。',
        position: 'top'
      },
      {
        target: '.nav-tab[data-page="devices"]',
        title: '设备管理',
        desc: '管理所有设备型号和资产信息，与异常记录双向关联。',
        position: 'bottom'
      },
      {
        target: '.nav-tab[data-page="knowledge"]',
        title: '智能知识库',
        desc: '沉淀问题处理经验，支持 Markdown 编辑，异常与方案双向跳转。',
        position: 'bottom'
      },
      {
        target: '#btn-ai-settings',
        title: 'AI 智能诊疗',
        desc: '接入豆包大模型，自动分析异常原因，推荐解决方案。点击这里配置 API Key 即可启用。',
        position: 'bottom'
      }
    ];

    let currentStep = 0;
    const tooltip = document.getElementById('tour-tooltip');
    const titleEl = document.getElementById('tour-title');
    const descEl = document.getElementById('tour-desc');
    const prevBtn = document.getElementById('tour-prev');
    const nextBtn = document.getElementById('tour-next');
    const skipBtn = document.getElementById('tour-skip');
    const arrow = document.querySelector('.tour-arrow');

    function showStep(index) {
      const step = steps[index];
      const target = document.querySelector(step.target);
      if (!target) return;

      titleEl.textContent = step.title;
      descEl.textContent = step.desc;

      const rect = target.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      let top, left;
      arrow.className = 'tour-arrow ' + step.position;

      if (step.position === 'bottom') {
        top = rect.bottom + 16;
        left = rect.left + rect.width / 2 - 160;
      } else if (step.position === 'top') {
        top = rect.top - tooltipRect.height - 16;
        left = rect.left + rect.width / 2 - 160;
      }

      left = Math.max(16, Math.min(left, window.innerWidth - 336));
      top = Math.max(16, Math.min(top, window.innerHeight - 200));

      tooltip.style.top = top + 'px';
      tooltip.style.left = left + 'px';

      prevBtn.style.display = index === 0 ? 'none' : 'inline-flex';
      nextBtn.textContent = index === steps.length - 1 ? '完成' : '下一步';

      document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
      target.classList.add('tour-highlight');
    }

    function closeTour() {
      tour.style.display = 'none';
      document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    }

    tour.style.display = 'block';
    setTimeout(() => showStep(0), 100);

    nextBtn.addEventListener('click', () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        showStep(currentStep);
      } else {
        closeTour();
      }
    });

    prevBtn.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });

    skipBtn.addEventListener('click', closeTour);
    tour.addEventListener('click', (e) => {
      if (e.target === tour) closeTour();
    });

    document.addEventListener('keydown', function tourKey(e) {
      if (e.key === 'Escape') {
        closeTour();
        document.removeEventListener('keydown', tourKey);
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});