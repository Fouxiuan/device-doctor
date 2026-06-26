const App = (function() {
    let currentPage = 'dashboard';
    let toastTimer = null;

    function init() {
        bindGlobalEvents();
        initModules();
        switchPage('dashboard');
    }

    function bindGlobalEvents() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const page = tab.dataset.page;
                switchPage(page);
            });
        });

        const addIssueBtn = document.getElementById('btn-add-issue');
        if (addIssueBtn) {
            addIssueBtn.addEventListener('click', () => {
                if (typeof Modal !== 'undefined') {
                    Modal.openIssueModal();
                }
            });
        }

        const exportBtn = document.getElementById('btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', handleExport);
        }

        const importBtn = document.getElementById('btn-import');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const fileInput = document.getElementById('file-input');
                if (fileInput) fileInput.click();
            });
        }

        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', handleImport);
        }

        const aiSettingsBtn = document.getElementById('btn-ai-settings');
        if (aiSettingsBtn) {
            aiSettingsBtn.addEventListener('click', openAISettings);
        }
    }

    function openAISettings() {
        const existing = document.getElementById('ai-settings-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'ai-settings-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'ai-settings-title');

        const configured = typeof AIDoctor !== 'undefined' && AIDoctor.isConfigured();
        const currentKey = configured ? '' : '';
        const currentModel = (typeof AIDoctor !== 'undefined' && AIDoctor.getConfig().model) || '';
        const models = (typeof AIDoctor !== 'undefined' && AIDoctor.getModels()) || [];

        modal.innerHTML = `
            <div class="modal" style="max-width: 480px;">
                <div class="modal-header">
                    <h3 class="modal-title" id="ai-settings-title">AI 诊疗设置</h3>
                    <button class="modal-close" id="ai-settings-close" aria-label="关闭对话框">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label" for="ai-api-key">豆包 API Key</label>
                        <input type="password" class="form-input" id="ai-api-key"
                               placeholder="sk-..."
                               autocomplete="off"
                               name="ai-api-key">
                        <div class="form-hint">
                            用于启用 AI 智能诊疗功能（异常自动归类、方案推荐、智能问答）。
                            <br>获取地址：火山引擎方舟平台。Key 仅存储在本地浏览器，不会上传。
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="ai-model-select">模型选择</label>
                        <select class="form-select" id="ai-model-select" name="ai-model-select">
                            ${models.map(m => `<option value="${m.id}" ${m.id === currentModel ? 'selected' : ''}>${m.label}</option>`).join('')}
                        </select>
                        <div class="form-hint">
                            选择已开通的模型。如需开通新模型，请前往火山方舟控制台。
                        </div>
                    </div>
                    <div class="ai-status" style="padding: 12px; border-radius: 8px; background: var(--bg-tertiary); font-size: 13px; margin-top: 8px;">
                        当前状态：<strong>${configured ? '✓ 已启用 AI 诊疗' : '✗ 未配置（使用规则引擎推荐）'}</strong>
                    </div>
                </div>
                <div class="modal-footer">
                    ${configured ? '<button class="btn btn-secondary" id="ai-clear-key">清除配置</button>' : ''}
                    <button class="btn btn-secondary" id="ai-cancel">取消</button>
                    <button class="btn btn-primary" id="ai-save">保存配置</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const closeBtn = modal.querySelector('#ai-settings-close');
        const cancelBtn = modal.querySelector('#ai-cancel');
        const saveBtn = modal.querySelector('#ai-save');
        const clearBtn = modal.querySelector('#ai-clear-key');
        const input = modal.querySelector('#ai-api-key');
        const modelSelect = modal.querySelector('#ai-model-select');

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = '';
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const key = input.value.trim();
                const model = modelSelect ? modelSelect.value : '';

                // 保存模型选择（无论是否输入了 Key）
                if (model && typeof AIDoctor !== 'undefined') {
                    AIDoctor.setModel(model);
                }

                if (!key && !configured) {
                    showToast('请输入 API Key', 'error');
                    return;
                }
                if (key) {
                    AIDoctor.setApiKey(key);
                    showToast('AI 诊疗设置已保存', 'success');
                } else {
                    showToast('模型设置已保存', 'success');
                }
                closeModal();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                AIDoctor.setApiKey('');
                showToast('已清除 AI 配置，将使用规则引擎', 'info');
                closeModal();
            });
        }

        setTimeout(() => input && input.focus(), 100);
    }

    function initModules() {
        if (typeof Dashboard !== 'undefined') {
            Dashboard.init();
        }
        if (typeof DeviceManager !== 'undefined') {
            DeviceManager.init();
        }
        if (typeof Knowledge !== 'undefined') {
            Knowledge.init();
        }
        if (typeof Modal !== 'undefined') {
            Modal.init();
        }
    }

    function switchPage(page) {
        currentPage = page;

        document.querySelectorAll('.nav-tab').forEach(tab => {
            if (tab.dataset.page === page) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        document.querySelectorAll('.page').forEach(p => {
            if (p.id === `page-${page}`) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });

        const addBtn = document.getElementById('btn-add-issue');
        const addDeviceBtn = document.getElementById('btn-add-device');

        if (page === 'dashboard') {
            if (addBtn) addBtn.style.display = '';
            if (addDeviceBtn) addDeviceBtn.style.display = 'none';
            if (typeof Dashboard !== 'undefined') {
                Dashboard.render();
            }
        } else if (page === 'devices') {
            if (addBtn) addBtn.style.display = 'none';
            if (addDeviceBtn) addDeviceBtn.style.display = '';
            if (typeof DeviceManager !== 'undefined') {
                DeviceManager.render();
            }
        } else if (page === 'knowledge') {
            if (addBtn) addBtn.style.display = 'none';
            if (addDeviceBtn) addDeviceBtn.style.display = 'none';
            if (typeof Knowledge !== 'undefined') {
                Knowledge.render();
            }
        }
    }

    function handleExport() {
        try {
            const filename = Store.exportToJSON();
            showToast(`数据已导出：${filename}`, 'success');
        } catch (e) {
            console.error('Export failed:', e);
            showToast('导出失败：' + e.message, 'error');
        }
    }

    function handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        Store.importFromJSON(file)
            .then((data) => {
                showToast(`导入成功：${data.issues.length} 条记录，${data.knowledge.length} 个方案`, 'success');
                refreshAll();
            })
            .catch((err) => {
                showToast('导入失败：' + err.message, 'error');
            })
            .finally(() => {
                e.target.value = '';
            });
    }

    function refreshAll() {
        if (typeof Dashboard !== 'undefined') Dashboard.render();
        if (typeof DeviceManager !== 'undefined') DeviceManager.render();
        if (typeof Knowledge !== 'undefined') Knowledge.render();
    }

    function showToast(message, type = 'default') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = 'toast';
        
        if (type === 'success') {
            toast.classList.add('success');
        } else if (type === 'error') {
            toast.classList.add('error');
        }

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        if (toastTimer) {
            clearTimeout(toastTimer);
        }

        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        init,
        switchPage,
        showToast
    };
})();

(function() {
    // Tour functionality
    let tourStepIndex = 0;

    function initTour() {
        const hasSeenTour = localStorage.getItem('hasSeenTour');
        if (!hasSeenTour) {
            setTimeout(() => {
                startTour();
            }, 1000);
        }
    }

    function startTour() {
        tourStepIndex = 0;
        showTourStep();
    }

    function showTourStep() {
        const steps = [
            {
                element: '.nav-tab[data-page="dashboard"]',
                title: '状态看板',
                desc: '实时追踪设备异常处理进度，拖拽卡片可更改状态',
                position: 'bottom'
            },
            {
                element: '#btn-add-issue',
                title: '新增异常',
                desc: '点击此处快速创建设备异常记录',
                position: 'left'
            },
            {
                element: '.nav-tab[data-page="devices"]',
                title: '设备管理',
                desc: '管理所有设备信息，支持搜索和筛选',
                position: 'bottom'
            },
            {
                element: '.nav-tab[data-page="knowledge"]',
                title: '知识库',
                desc: '查看和管理设备维修方案文档',
                position: 'bottom'
            },
            {
                element: '#btn-import',
                title: '导入数据',
                desc: '支持导入JSON格式的设备和异常数据',
                position: 'left'
            }
        ];

        if (tourStepIndex >= steps.length) {
            endTour();
            return;
        }

        const step = steps[tourStepIndex];
        const element = document.querySelector(step.element);

        if (!element) {
            tourStepIndex++;
            showTourStep();
            return;
        }

        const overlay = document.getElementById('tour-overlay');
        const tooltip = document.getElementById('tour-tooltip');
        const arrow = tooltip.querySelector('.tour-arrow');
        const title = document.getElementById('tour-title');
        const desc = document.getElementById('tour-desc');
        const prevBtn = document.getElementById('tour-prev');
        const nextBtn = document.getElementById('tour-next');
        const skipBtn = document.getElementById('tour-skip');

        title.textContent = step.title;
        desc.textContent = step.desc;

        prevBtn.style.display = tourStepIndex === 0 ? 'none' : '';
        nextBtn.textContent = tourStepIndex === steps.length - 1 ? '完成' : '下一步';

        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const isMobile = window.innerWidth <= 480;

        arrow.className = 'tour-arrow';

        if (isMobile) {
            // 移动端：固定在屏幕中央
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.right = 'auto';
            tooltip.style.bottom = 'auto';
            tooltip.style.transform = 'translate(-50%, -50%)';
        } else {
            // 桌面端：根据位置显示
            tooltip.style.transform = '';
            tooltip.style.right = 'auto';
            tooltip.style.bottom = 'auto';
            
            switch (step.position) {
                case 'bottom':
                    tooltip.style.top = `${rect.bottom + 12}px`;
                    tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                    arrow.classList.add('top');
                    break;
                case 'top':
                    tooltip.style.bottom = `${window.innerHeight - rect.top + 12}px`;
                    tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                    arrow.classList.add('bottom');
                    break;
                case 'left':
                    tooltip.style.left = `${rect.right + 12}px`;
                    tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                    arrow.classList.add('left');
                    break;
                case 'right':
                    tooltip.style.right = `${window.innerWidth - rect.left + 12}px`;
                    tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                    arrow.classList.add('right');
                    break;
            }
        }

        overlay.style.display = 'block';

        prevBtn.onclick = () => {
            tourStepIndex--;
            showTourStep();
        };

        nextBtn.onclick = () => {
            tourStepIndex++;
            showTourStep();
        };

        skipBtn.onclick = endTour;
    }

    function endTour() {
        const overlay = document.getElementById('tour-overlay');
        overlay.style.display = 'none';
        localStorage.setItem('hasSeenTour', 'true');
    }

    // Initialize tour on load
    initTour();
})();