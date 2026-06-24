// dashboard.js — 看板视图 IIFE 模块
const Dashboard = (function () {
  'use strict';

  // ========== 渲染看板 ==========
  function render() {
    var viewEl = document.getElementById('view-dashboard');
    if (!viewEl) return;

    var counts = Store.getStageCounts();
    var issues = Store.getIssues();

    // 统计卡片
    var statCardsHtml = '' +
      '<div class="stat-card" data-stage="verifying" onclick="Dashboard.filterByStage(\'verifying\')">' +
      '  <div class="stat-icon">📋</div>' +
      '  <div class="stat-count">' + counts.verifying + '</div>' +
      '  <div class="stat-label">数据校对</div>' +
      '</div>' +
      '<div class="stat-card" data-stage="detecting" onclick="Dashboard.filterByStage(\'detecting\')">' +
      '  <div class="stat-icon">🔍</div>' +
      '  <div class="stat-count">' + counts.detecting + '</div>' +
      '  <div class="stat-label">检测中</div>' +
      '</div>' +
      '<div class="stat-card" data-stage="normal" onclick="Dashboard.filterByStage(\'normal\')">' +
      '  <div class="stat-icon">✅</div>' +
      '  <div class="stat-count">' + counts.normal + '</div>' +
      '  <div class="stat-label">判定正常</div>' +
      '</div>' +
      '<div class="stat-card" data-stage="danger" onclick="Dashboard.filterByStage(\'danger\')">' +
      '  <div class="stat-icon">⚠️</div>' +
      '  <div class="stat-count">' + counts.danger + '</div>' +
      '  <div class="stat-label">判定危险</div>' +
      '</div>' +
      '<div class="stat-card" data-stage="wearing" onclick="Dashboard.filterByStage(\'wearing\')">' +
      '  <div class="stat-icon">🎽</div>' +
      '  <div class="stat-count">' + counts.wearing + '</div>' +
      '  <div class="stat-label">穿戴测试</div>' +
      '</div>';

    // Kanban 列
    var stages = [
      { key: 'verifying', label: '数据校对', icon: '📋' },
      { key: 'detecting', label: '检测中', icon: '🔍' },
      { key: 'normal', label: '判定正常', icon: '✅' },
      { key: 'danger', label: '判定危险', icon: '⚠️' },
      { key: 'wearing', label: '穿戴测试', icon: '🎽' }
    ];

    var kanbanHtml = '<div class="kanban-board">';
    stages.forEach(function (stage) {
      var stageIssues = issues.filter(function (i) { return i.stage === stage.key; });
      var cardsHtml = '';
      stageIssues.forEach(function (issue) {
        cardsHtml += renderCard(issue);
      });

      kanbanHtml += '' +
        '<div class="kanban-column stage-' + stage.key + '" data-stage="' + stage.key + '" ondragover="Dashboard.allowDrop(event)" ondrop="Dashboard.handleDrop(event)">' +
        '  <div class="kanban-header">' +
        '    <span class="stage-icon">' + stage.icon + '</span>' +
        '    <span class="stage-name">' + stage.label + '</span>' +
        '    <span class="stage-count">' + stageIssues.length + '</span>' +
        '  </div>' +
        '  <div class="kanban-body">' + cardsHtml + '</div>' +
        '</div>';
    });
    kanbanHtml += '</div>';

    viewEl.innerHTML = '' +
      '<div class="stats-row">' + statCardsHtml + '</div>' +
      kanbanHtml;

    // 绑定拖拽事件
    bindDragEvents();
  }

  // ========== 渲染卡片 ==========
  function renderCard(issue) {
    var tagsHtml = '';
    if (issue.tags && issue.tags.length > 0) {
      tagsHtml = '<div class="issue-card-tags">';
      issue.tags.forEach(function (tag) {
        tagsHtml += '<span class="card-tag">' + _escapeHtml(tag) + '</span>';
      });
      tagsHtml += '</div>';
    }

    // 获取设备信息
    var device = Store.getDeviceById(issue.deviceId);
    var deviceName = device ? device.name : '';
    var deviceTooltip = '';
    if (device) {
      var statusLabel = device.status === 'normal' ? '正常' : (device.status === 'abnormal' ? '异常' : '维修中');
      deviceTooltip = '型号: ' + (device.model || '-') + '\n位置: ' + (device.location || '-') + '\n状态: ' + statusLabel;
    }

    return '' +
      '<div class="issue-card stage-' + _escapeHtml(issue.stage) + '" draggable="true" data-id="' + _escapeHtml(issue.id) + '">' +
      '  <div class="issue-card-id" title="' + _escapeHtml(deviceTooltip) + '">#' + _escapeHtml(issue.deviceId) + '</div>' +
      '  <div class="issue-card-device-name">' + _escapeHtml(deviceName) + '</div>' +
      '  <div class="issue-card-title">' + _escapeHtml(issue.title) + '</div>' +
      '  <div class="issue-card-meta">' +
      '    <span class="card-assignee">' + _escapeHtml(issue.assignee || '未分配') + '</span>' +
      '    <span class="card-time">' + _escapeHtml(_formatTime(issue.updatedAt || issue.createdAt)) + '</span>' +
      '  </div>' +
      '  ' + tagsHtml +
      '</div>';
  }

  // ========== 拖拽相关 ==========
  function bindDragEvents() {
    var cards = document.querySelectorAll('.issue-card');
    cards.forEach(function (card) {
      card.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', card.dataset.id);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', function () {
        card.classList.remove('dragging');
      });
    });
  }

  function allowDrop(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    var issueId = e.dataTransfer.getData('text/plain');
    var column = e.target.closest('.kanban-column');
    if (!column || !issueId) return;

    var newStage = column.dataset.stage;
    Store.moveIssue(issueId, newStage);
    render();
  }

  // ========== 筛选 ==========
  function filterByStage(stage) {
    var issues = Store.getIssuesByStage(stage);
    // 简单实现：重新渲染看板，只显示该阶段的列
    // 更优的做法是滚动到对应列或高亮
    // 这里先滚动到对应列
    var column = document.querySelector('.kanban-column[data-stage="' + stage + '"]');
    if (column) {
      column.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      column.classList.add('highlight-column');
      setTimeout(function () {
        column.classList.remove('highlight-column');
      }, 1500);
    }
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
    return year + '-' + month + '-' + day;
  }

  // ========== 公开 API ==========
  return {
    render: render,
    allowDrop: allowDrop,
    handleDrop: handleDrop,
    filterByStage: filterByStage
  };
})();
