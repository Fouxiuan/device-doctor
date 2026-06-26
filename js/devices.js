const DeviceManager = (function() {
    let searchQuery = '';

    function init() {
        bindEvents();
    }

    function bindEvents() {
        const searchInput = document.getElementById('device-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.trim().toLowerCase();
                render();
            });
        }

        const addBtn = document.getElementById('btn-add-device');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (typeof Modal !== 'undefined') {
                    Modal.openDeviceModal();
                }
            });
        }
    }

    function render() {
        const grid = document.getElementById('devices-grid');
        const totalCountEl = document.getElementById('device-total-count');
        
        if (!grid) return;

        let devices = Store.getDevices();
        const allDevices = devices.length;

        if (searchQuery) {
            devices = devices.filter(d =>
                (d.deviceId && d.deviceId.toLowerCase().includes(searchQuery)) ||
                (d.name && d.name.toLowerCase().includes(searchQuery)) ||
                (d.model && d.model.toLowerCase().includes(searchQuery)) ||
                (d.type && d.type.toLowerCase().includes(searchQuery)) ||
                (d.remark && d.remark.toLowerCase().includes(searchQuery)) ||
                (d.tags && d.tags.some(t => t.toLowerCase().includes(searchQuery)))
            );
        }

        if (totalCountEl) {
            totalCountEl.textContent = allDevices;
        }

        if (devices.length === 0) {
            const isSearching = searchQuery.length > 0;
            grid.innerHTML = `
                <div class="devices-empty">
                    <svg class="devices-empty-icon" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="8" y="16" width="48" height="36" rx="4"/>
                        <path d="M16 26h32M16 34h24M16 42h20" stroke-linecap="round"/>
                        <circle cx="48" cy="48" r="10" stroke-dasharray="4 2"/>
                    </svg>
                    <div class="devices-empty-title">
                        ${isSearching ? '未找到匹配的设备' : '暂无设备'}
                    </div>
                    <div class="devices-empty-desc">
                        ${isSearching ? '试试其他关键词' : '点击右上角「新增设备」开始添加吧'}
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = devices.map(device => renderDeviceCard(device)).join('');

        grid.querySelectorAll('.device-card').forEach(card => {
            const id = card.dataset.id;
            
            const editBtn = card.querySelector('[data-action="edit"]');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const device = Store.getDeviceById(id);
                    if (device && typeof Modal !== 'undefined') {
                        Modal.openDeviceModal(device);
                    }
                });
            }

            const deleteBtn = card.querySelector('[data-action="delete"]');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleDelete(id);
                });
            }
        });
    }

    function renderDeviceCard(device) {
        const statusLabel = getStatusLabel(device.status);
        const initial = device.name ? device.name.charAt(0) : '?';

        return `
            <div class="device-card" data-id="${device.id}">
                <div class="device-card-header">
                    <div class="device-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                            <line x1="12" y1="18" x2="12.01" y2="18"/>
                        </svg>
                    </div>
                    <span class="device-status-badge ${device.status || 'active'}">${statusLabel}</span>
                </div>
                
                <div class="device-info">
                    <div class="device-name">${escapeHtml(device.name || '未命名设备')}</div>
                    <div class="device-id">${escapeHtml(device.deviceId || '无编号')}</div>
                </div>

                ${renderDeviceTags(device.tags)}

                <div class="device-meta">
                    <div class="device-meta-item">
                        <span class="device-meta-label">型号</span>
                        <span class="device-meta-value">${escapeHtml(device.model || '-')}</span>
                    </div>
                    <div class="device-meta-item">
                        <span class="device-meta-label">类型</span>
                        <span class="device-meta-value">${escapeHtml(device.type || '-')}</span>
                    </div>
                    <div class="device-meta-item">
                        <span class="device-meta-label">出厂时间</span>
                        <span class="device-meta-value">${formatDatetime(device.productionDatetime)}</span>
                    </div>
                    <div class="device-meta-item">
                        <span class="device-meta-label">异常记录</span>
                        <span class="device-meta-value">${countDeviceIssues(device.deviceId)} 条</span>
                    </div>
                </div>
                
                <div class="device-actions">
                    <button class="device-action-btn" data-action="edit">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M12.066 11.536L4 19.5V16.5L10.75 9.75L12.066 11.536Z"/>
                            <path d="M13.75 6.75L15.25 5.25L14.25 4.25L12.75 5.75L13.75 6.75Z"/>
                            <path d="M11.25 8.25L12.75 6.75L14.25 8.25L12.75 9.75L11.25 8.25Z"/>
                            <path d="M15.5 4L17 5.5L15 7.5L13.5 6L15.5 4Z"/>
                        </svg>
                        编辑
                    </button>
                    <button class="device-action-btn danger" data-action="delete">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M3 6H17H3Z"/>
                            <path d="M8 6V4C8 2.89543 8.89543 2 10 2H10C11.1046 2 12 2.89543 12 4V6"/>
                            <path d="M10 10V15M10 10L7 13M10 10L13 13" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M5 6L5 16C5 17.1046 5.89543 18 7 18H13C14.1046 18 15 17.1046 15 16V6"/>
                        </svg>
                        删除
                    </button>
                </div>
            </div>
        `;
    }

    function getStatusLabel(status) {
        const labels = {
            active: '使用中',
            maintenance: '维修中',
            retired: '已退役'
        };
        return labels[status] || '使用中';
    }

    function renderDeviceTags(tags) {
        if (!tags || !Array.isArray(tags) || tags.length === 0) return '';
        return `
            <div class="device-tags" role="group" aria-label="设备标签">
                ${tags.map(tag => `<span class="device-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
        `;
    }

    function formatDatetime(datetimeStr) {
        if (!datetimeStr) return '-';
        const d = new Date(datetimeStr);
        if (isNaN(d.getTime())) return datetimeStr;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    function countDeviceIssues(deviceId) {
        if (!deviceId) return 0;
        const issues = Store.getIssues();
        return issues.filter(i => i.deviceId === deviceId).length;
    }

    async function handleDelete(id) {
        const device = Store.getDeviceById(id);
        if (!device) return;

        const issueCount = countDeviceIssues(device.deviceId);
        let message = `确定要删除设备「${device.name}(${device.deviceId})」吗？`;
        if (issueCount > 0) {
            message += `\n\n该设备关联了 ${issueCount} 条异常记录，删除后异常记录仍保留。`;
        }

        const ok = await Dialog.confirm({
            title: '删除设备',
            message: message,
            confirmText: '删除',
            cancelText: '取消',
            danger: true
        });
        if (ok) {
            Store.deleteDevice(id);
            render();
            if (window.App && typeof window.App.showToast === 'function') {

                window.App.showToast('设备已删除', 'success');

            }
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return {
        init,
        render
    };
})();
