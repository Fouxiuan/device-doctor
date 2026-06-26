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
                        <label class="form-label" for="ai-model-select">豆包模型</label>
                        <select class="form-input" id="ai-model-select" name="ai-model-select">
                        </select>
                        <div id="ai-model-custom-wrap" style="display:none; margin-top:8px;">
                            <input type="text" class="form-input" id="ai-model-custom"
                                   placeholder="输入模型 id 或接入点 ep-xxx"
                                   aria-label="自定义模型 id 或接入点"
                                   name="ai-model-custom" autocomplete="off">
                        </div>
                        <div class="form-hint">选择最新豆包 Seed 系列模型；选「自定义」可输入接入点 id</div>
                    </div>
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
                    <div class="ai-status" style="padding: 12px; border-radius: 8px; background: var(--bg-tertiary); font-size: 13px; margin-top: 8px;">
                        当前状态：<strong>${configured ? '✓ 已启用 AI 诊疗' : '✗ 未配置（使用规则引擎推荐）'}</strong>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" id="ai-replay-tour">重新观看引导</button>
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
        const replayBtn = modal.querySelector('#ai-replay-tour');
        const input = modal.querySelector('#ai-api-key');
        const modelSelect = modal.querySelector('#ai-model-select');
        const modelCustomWrap = modal.querySelector('#ai-model-custom-wrap');
        const modelCustomInput = modal.querySelector('#ai-model-custom');

        // 填充模型下拉：预设 + 自定义选项
        if (modelSelect && typeof AIDoctor !== 'undefined' && Array.isArray(AIDoctor.PRESET_MODELS)) {
            modelSelect.innerHTML = AIDoctor.PRESET_MODELS.map(m =>
                `<option value="${m.id}">${m.label} — ${m.desc}</option>`
            ).join('') + '<option value="__custom__">自定义…</option>';

            // 初始化选中：命中预设则选之，否则选「自定义」并回填
            const cur = AIDoctor.getSelectedModel();
            const isPreset = AIDoctor.PRESET_MODELS.some(m => m.id === cur);
            if (isPreset) {
                modelSelect.value = cur;
            } else {
                modelSelect.value = '__custom__';
                modelCustomWrap.style.display = '';
                modelCustomInput.value = cur;
            }
        }

        if (modelSelect) {
            modelSelect.addEventListener('change', () => {
                if (modelSelect.value === '__custom__') {
                    modelCustomWrap.style.display = '';
                    setTimeout(() => modelCustomInput && modelCustomInput.focus(), 50);
                } else {
                    modelCustomWrap.style.display = 'none';
                }
            });
        }

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
                // 模型始终保存（独立于 API Key）
                let model = '';
                if (modelSelect) {
                    model = modelSelect.value === '__custom__'
                        ? (modelCustomInput ? modelCustomInput.value.trim() : '')
                        : modelSelect.value;
                }
                AIDoctor.setModel(model);

                const key = input.value.trim();
                if (!key) {
                    showToast('模型已保存，请继续填写 API Key 以启用 AI', 'info');
                    return;
                }
                AIDoctor.setApiKey(key);
                showToast('AI 诊疗已启用', 'success');
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

        if (replayBtn) {
            replayBtn.addEventListener('click', () => {
                closeModal();
                localStorage.removeItem('hasSeenTour');
                setTimeout(() => {
                    if (window.Tour && typeof window.Tour.start === 'function') {
                        window.Tour.start();
                    }
                }, 200);
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
        showToast,
        openAISettings
    };
})();

(function() {
    // Tour 新手指引功能
    // 定位由 tour-utils.js 的 computeTooltipPosition 纯函数计算（已单测覆盖）
    let tourStepIndex = 0;

    const steps = [
        { element: '.nav-tab[data-page="dashboard"]', page: 'dashboard',
          title: '状态看板', desc: '实时追踪设备异常处理进度，拖拽卡片可更改状态', position: 'bottom' },
        { element: '#btn-add-issue', page: 'dashboard',
          title: '新增异常', desc: '点击此处快速创建设备异常记录，可启用 AI 自动归类', position: 'bottom' },
        { element: '#btn-ai-settings', page: 'dashboard',
          title: 'AI 诊疗设置', desc: '配置豆包 API Key 与模型，启用智能诊断、方案生成、问答', position: 'bottom' },
        { element: '.nav-tab[data-page="devices"]', page: 'devices',
          title: '设备管理', desc: '管理所有设备资产信息，支持搜索与标签筛选', position: 'bottom' },
        { element: '#btn-add-device', page: 'devices',
          title: '新增设备', desc: '添加新设备型号，填写类型与标签便于归类', position: 'bottom' },
        { element: '.nav-tab[data-page="knowledge"]', page: 'knowledge',
          title: '知识库', desc: '查看与管理设备维修方案，按分类与标签组织文档', position: 'bottom' },
        { element: '#btn-import', page: 'knowledge',
          title: '导入数据', desc: '支持导入 JSON 格式的设备与异常数据，也可导出备份', position: 'bottom' }
    ];

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
        if (tourStepIndex >= steps.length) {
            endTour();
            return;
        }
        const step = steps[tourStepIndex];

        // 1. 切页（若步骤指定页面，确保目标元素可见）
        if (step.page && typeof App !== 'undefined' && typeof App.switchPage === 'function') {
            App.switchPage(step.page);
        }

        // 2. 清除上一步残留高亮
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));

        // 3. 查元素；找不到则跳下一步
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

        // 4. 更新文案与按钮
        title.textContent = step.title;
        desc.textContent = step.desc;
        prevBtn.style.display = tourStepIndex === 0 ? 'none' : '';
        nextBtn.textContent = tourStepIndex === steps.length - 1 ? '完成' : '下一步';

        // 5. 高亮目标
        element.classList.add('tour-highlight');

        // 6. 滚动到可见区域
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });

        // 7. 双 rAF 等布局稳定后定位 tooltip
        const isMobile = window.innerWidth <= 480;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (isMobile) {
                    // 移动端：固定在屏幕中央
                    tooltip.style.top = '50%';
                    tooltip.style.left = '50%';
                    tooltip.style.right = 'auto';
                    tooltip.style.bottom = 'auto';
                    tooltip.style.transform = 'translate(-50%, -50%)';
                } else if (typeof computeTooltipPosition === 'function') {
                    const rect = element.getBoundingClientRect();
                    const tRect = tooltip.getBoundingClientRect();
                    const pos = computeTooltipPosition(
                        { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height },
                        { width: tRect.width, height: tRect.height },
                        { w: window.innerWidth, h: window.innerHeight },
                        step.position || 'bottom'
                    );
                    tooltip.style.transform = '';
                    tooltip.style.right = 'auto';
                    tooltip.style.bottom = 'auto';
                    tooltip.style.top = pos.top + 'px';
                    tooltip.style.left = pos.left + 'px';
                    arrow.className = 'tour-arrow';
                    if (pos.arrow !== 'none') arrow.classList.add(pos.arrow);
                }
                overlay.style.display = 'block';
            });
        });

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
        document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
        localStorage.setItem('hasSeenTour', 'true');
    }

    // 暴露给外部（AI 设置弹窗「重新观看引导」按钮调用）
    window.Tour = { start: startTour };

    // 页面加载后自动初始化
    initTour();
})();