// devices.js — 设备管理视图 IIFE 模块
const Devices = (function () {
  'use strict';

  var activeStatus = 'all';
  var searchKeyword = '';

  var STATUS_MAP = {
    normal: { label: '正常', color: '#388e3c', bg: '#e8f5e9' },
    abnormal: { label: '异常', color: '#d32f2f', bg: '#ffebee' },
    maintenance: { label: '维修中', color: '#f57c00', bg: '#fff3e0' }
  };

  // ========== 渲染设备管理页面 ==========
  function render() {
    var viewEl = document.getElementById('view-devices');
    if (!viewEl) return;

    var devices = Store.getDevices();

    // 按状态筛选
    var filtered = devices;
    if (activeStatus !== 'all') {
      filtered = filtered.filter(function (d) { return d.status === activeStatus; });
    }

    // 按搜索关键词过滤
    if (searchKeyword) {
      var kw = searchKeyword.toLowerCase();
      filtered = filtered.filter(function (d) {
        return (d.deviceId && d.deviceId.toLowerCase().indexOf(kw) !== -1) ||
               (d.name && d.name.toLowerCase().indexOf(kw) !== -1) ||
               (d.model && d.model.toLowerCase().indexOf(kw) !== -1);
      });
    }

    // 生成工具栏
    var toolbarHtml = '' +
      '<div class="devices-toolbar">' +
      '  <div class="devices-search">' +
      '    <input type="text" id="device-search-input" class="search-input" placeholder="搜索设备编号、名称、型号..." value="' + _escapeHtml(searchKeyword) + '">' +
      '    <button class="btn btn-primary" onclick="Devices.doSearch()">搜索</button>' +
      '  </div>' +
      '  <div class="devices-status-filter">' +
      '    <span class="filter-label">状态：</span>' +
      '    <span class="status-filter-item' + (activeStatus === 'all' ? ' active' : '') + '" data-status="all" onclick="Devices.filterByStatus(\'all\')">全部</span>' +
      '    <span class="status-filter-item' + (activeStatus === 'normal' ? ' active' : '') + '" data-status="normal" onclick="Devices.filterByStatus(\'normal\')">正常</span>' +
      '    <span class="status-filter-item' + (activeStatus === 'abnormal' ? ' active' : '') + '" data-status="abnormal" onclick="Devices.filterByStatus(\'abnormal\')">异常</span>' +
      '    <span class="status-filter-item' + (activeStatus === 'maintenance' ? ' active' : '') + '" data-status="maintenance" onclick="Devices.filterByStatus(\'maintenance\')">维修中</span>' +
      '  </div>' +
      '  <button class="btn btn-primary" onclick="Devices.openAddDevice()">+ 新增设备</button>' +
      '</div>';

    // 生成设备卡片网格
    var gridHtml = '<div class="devices-grid">';
    if (filtered.length === 0) {
      gridHtml += '' +
        '<div class="empty-state">' +
        '  <div class="empty-icon">🔧</div>' +
        '  <div class="empty-text">暂无匹配的设备</div>' +
        '</div>';
    } else {
      filtered.forEach(function (device) {
        gridHtml += renderDeviceCard(device);
      });
    }
    gridHtml += '</div>';

    viewEl.innerHTML = toolbarHtml + gridHtml;

    // 绑定搜索框实时搜索
    var searchInput = document.getElementById('device-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchKeyword = this.value.trim();
        render();
      });
    }
  }

  // ========== 渲染设备卡片 ==========
  function renderDeviceCard(device) {
    var statusInfo = STATUS_MAP[device.status] || STATUS_MAP.normal;
    var issueCount = Store.getIssuesByDevice(device.deviceId).length;

    return '' +
      '<div class="device-card" data-device-id="' + _escapeHtml(device.deviceId) + '">' +
      '  <div class="device-card-header">' +
      '    <span class="device-id">' + _escapeHtml(device.deviceId) + '</span>' +
      '    <span class="device-status-badge" style="background:' + statusInfo.bg + ';color:' + statusInfo.color + '">' + statusInfo.label + '</span>' +
      '  </div>' +
      '  <div class="device-card-name">' + _escapeHtml(device.name) + '</div>' +
      '  <div class="device-card-meta">' +
      '    <span class="meta-item">型号: ' + _escapeHtml(device.model || '-') + '</span>' +
      '    <span class="meta-item">位置: ' + _escapeHtml(device.location || '-') + '</span>' +
      '  </div>' +
      '  <div class="device-card-footer">' +
      '    <span class="issue-count">' + issueCount + ' 条异常</span>' +
      '    <div class="device-actions">' +
      '      <button class="btn btn-sm btn-outline" onclick="Devices.openEditDevice(\'' + device.deviceId.replace(/'/g, "\\'") + '\')">编辑</button>' +
      '      <button class="btn btn-sm btn-outline" onclick="Devices.openDeviceDetail(\'' + device.deviceId.replace(/'/g, "\\'") + '\')">详情</button>' +
      '      <button class="btn btn-sm btn-outline" onclick="Devices.deleteDevice(\'' + device.deviceId.replace(/'/g, "\\'") + '\')">删除</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  }

  // ========== 状态筛选 ==========
  function filterByStatus(status) {
    activeStatus = status;
    render();
  }

  // ========== 搜索 ==========
  function doSearch() {
    var input = document.getElementById('device-search-input');
    if (input) {
      searchKeyword = input.value.trim();
    }
    render();
  }

  // ========== 打开新增设备弹窗 ==========
  function openAddDevice() {
    Modal.open(null, 'device');
  }

  // ========== 打开编辑设备弹窗 ==========
  function openEditDevice(deviceId) {
    var device = Store.getDeviceById(deviceId);
    if (device) {
      Modal.open(device, 'device');
    }
  }

  // ========== 打开设备详情 ==========
  function openDeviceDetail(deviceId) {
    var device = Store.getDeviceById(deviceId);
    if (!device) return;

    var issues = Store.getIssuesByDevice(deviceId);
    var statusInfo = STATUS_MAP[device.status] || STATUS_MAP.normal;

    var issuesHtml = '';
    if (issues.length === 0) {
      issuesHtml = '<div class="detail-no-issues">暂无异常记录</div>';
    } else {
      issuesHtml = '<div class="detail-issues-list">';
      issues.sort(function (a, b) {
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      });
      issues.forEach(function (issue) {
        var stageLabel = '';
        switch (issue.stage) {
          case 'verifying': stageLabel = '数据校对'; break;
          case 'detecting': stageLabel = '检测中'; break;
          case 'normal': stageLabel = '判定正常'; break;
          case 'danger': stageLabel = '判定危险'; break;
          case 'wearing': stageLabel = '穿戴测试'; break;
          default: stageLabel = issue.stage;
        }
        issuesHtml += '' +
          '<div class="detail-issue-item" onclick="Devices.goToIssue(\'' + issue.id.replace(/'/g, "\\'") + '\')">' +
          '  <span class="issue-stage stage-' + issue.stage + '">' + stageLabel + '</span>' +
          '  <span class="issue-title">' + _escapeHtml(issue.title) + '</span>' +
          '  <span class="issue-assignee">' + _escapeHtml(issue.assignee || '未分配') + '</span>' +
          '  <span class="issue-time">' + _escapeHtml(_formatTime(issue.updatedAt || issue.createdAt)) + '</span>' +
          '</div>';
      });
      issuesHtml += '</div>';
    }

    var html = '' +
      '<div class="modal-header">' +
      '  <h3>设备详情</h3>' +
      '  <button class="modal-close" onclick="Modal.close()">&times;</button>' +
      '</div>' +
      '<div class="modal-body">' +
      '  <div class="device-detail-info">' +
      '    <div class="detail-row"><span class="detail-label">设备编号</span><span class="detail-value">' + _escapeHtml(device.deviceId) + '</span></div>' +
      '    <div class="detail-row"><span class="detail-label">设备名称</span><span class="detail-value">' + _escapeHtml(device.name) + '</span></div>' +
      '    <div class="detail-row"><span class="detail-label">型号</span><span class="detail-value">' + _escapeHtml(device.model || '-') + '</span></div>' +
      '    <div class="detail-row"><span class="detail-label">位置</span><span class="detail-value">' + _escapeHtml(device.location || '-') + '</span></div>' +
      '    <div class="detail-row"><span class="detail-label">状态</span><span class="detail-value"><span class="device-status-badge" style="background:' + statusInfo.bg + ';color:' + statusInfo.color + '">' + statusInfo.label + '</span></span></div>' +
      '    <div class="detail-row"><span class="detail-label">创建时间</span><span class="detail-value">' + _escapeHtml(_formatTime(device.createdAt)) + '</span></div>' +
      '  </div>' +
      '  <h4 class="detail-section-title">异常历史 (' + issues.length + ')</h4>' +
      '  ' + issuesHtml +
      '</div>' +
      '<div class="modal-footer">' +
      '  <button class="btn btn-primary" onclick="Devices.addIssueForDevice(\'' + device.deviceId.replace(/'/g, "\\'") + '\')">为此设备新增异常</button>' +
      '  <button class="btn btn-outline" onclick="Modal.close()">关闭</button>' +
      '</div>';

    var container = document.getElementById('modal-container');
    var overlay = document.getElementById('modal-overlay');
    container.innerHTML = html;
    overlay.style.display = 'flex';
    requestAnimationFrame(function () {
      overlay.classList.add('show');
    });
  }

  // ========== 删除设备 ==========
  function deleteDevice(deviceId) {
    var result = Store.deleteDevice(deviceId);
    if (result.success) {
      render();
    } else {
      alert(result.message);
    }
  }

  // ========== 跳转到异常 ==========
  function goToIssue(issueId) {
    Modal.close();
    location.hash = 'dashboard';
    // 高亮异常卡片
    setTimeout(function () {
      var card = document.querySelector('.issue-card[data-id="' + issueId + '"]');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.animation = 'highlight-pulse 1.5s ease';
        setTimeout(function () {
          card.style.animation = '';
        }, 1500);
      }
    }, 300);
  }

  // ========== 为此设备新增异常 ==========
  function addIssueForDevice(deviceId) {
    Modal.close();
    setTimeout(function () {
      Modal.openForDevice(deviceId);
    }, 300);
  }

  // ========== HTML 转义工具 ==========
  function _escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ========== 格式化时间 ==========
  function _formatTime(isoStr) {
    if (!isoStr) return '';
    var date = new Date(isoStr);
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    var hour = String(date.getHours()).padStart(2, '0');
    var min = String(date.getMinutes()).padStart(2, '0');
    return year + '-' + month + '-' + day + ' ' + hour + ':' + min;
  }

  // ========== 公开 API ==========
  return {
    render: render,
    filterByStatus: filterByStatus,
    doSearch: doSearch,
    openAddDevice: openAddDevice,
    openEditDevice: openEditDevice,
    openDeviceDetail: openDeviceDetail,
    deleteDevice: deleteDevice,
    goToIssue: goToIssue,
    addIssueForDevice: addIssueForDevice
  };
})();
