// dashboard.js — 看板视图 IIFE 模块
const Dashboard = (function () {
  'use strict';
  var STAGES = [
    { key: 'verifying', label: '数据校对', icon: '📋' },
    { key: 'detecting', label: '检测中', icon: '🔍' },
    { key: 'normal', label: '判定正常', icon: '✅' },
    { key: 'danger', label: '判定危险', icon: '⚠️' },
    { key: 'wearing', label: '穿戴测试', icon: '🎽' }
  ];
  var activeFilter = null;

  function render() {
    var viewEl = document.getElementById('view-dashboard'); if (!viewEl) return;
    var counts = Store.getStageCounts(); var issues = Store.getIssues();
    var statsHtml = '<div class="stats-row">';
    STAGES.forEach(function (stage) {
      var isActive = activeFilter === stage.key ? ' active' : '';
      statsHtml += '<div class="stat-card' + isActive + '" data-stage="' + stage.key + '" onclick="Dashboard.filterByStage(\'' + stage.key + '\')">' +
        '  <div class="stat-icon">' + stage.icon + '</div>' +
        '  <div class="stat-count">' + (counts[stage.key] || 0) + '</div>' +
        '  <div class="stat-label">' + stage.label + '</div></div>';
    });
    statsHtml += '</div>';
    var kanbanHtml = '<div class="kanban-board">';
    STAGES.forEach(function (stage) { kanbanHtml += renderColumn(stage, issues); });
    kanbanHtml += '</div>';
    viewEl.innerHTML = statsHtml + kanbanHtml;
    bindDragEvents();
  }

  function renderColumn(stage, issues) {
    var columnIssues = issues.filter(function (issue) { return issue.stage === stage.key; });
    var cardsHtml = ''; columnIssues.forEach(function (issue) { cardsHtml += renderCard(issue); });
    return '<div class="kanban-column" data-stage="' + stage.key + '">' +
      '  <div class="column-header"><span class="column-icon">' + stage.icon + '</span><span class="column-title">' + stage.label + '</span><span class="column-count">' + columnIssues.length + '</span></div>' +
      '  <div class="column-body">' + cardsHtml + '</div></div>';
  }

  function renderCard(issue) {
    var tagsHtml = '';
    if (issue.tags && issue.tags.length > 0) {
      tagsHtml = '<div class="issue-card-tags">';
      issue.tags.forEach(function (tag) { tagsHtml += '<span class="card-tag">' + tag + '</span>'; });
      tagsHtml += '</div>';
    }
    return '<div class="issue-card stage-' + _escapeHtml(issue.stage) + '" draggable="true" data-id="' + _escapeHtml(issue.id) + '">' +
      '  <div class="issue-card-id">#' + _escapeHtml(issue.deviceId) + '</div>' +
      '  <div class="issue-card-title">' + _escapeHtml(issue.title) + '</div>' +
      '  <div class="issue-card-meta"><span class="card-assignee">' + _escapeHtml(issue.assignee || '未分配') + '</span><span class="card-time">' + _escapeHtml(_formatTime(issue.updatedAt || issue.createdAt)) + '</span></div>' +
      '  ' + tagsHtml + '</div>';
  }

  function bindDragEvents() {
    var cards = document.querySelectorAll('.issue-card[draggable="true"]');
    var columns = document.querySelectorAll('.kanban-column');
    var draggedId = null; var isDragging = false;
    cards.forEach(function (card) {
      card.addEventListener('dragstart', function (e) { draggedId = card.dataset.id; isDragging = true; e.dataTransfer.setData('text/plain', card.dataset.id); e.dataTransfer.effectAllowed = 'move'; setTimeout(function () { card.classList.add('dragging'); }, 0); });
      card.addEventListener('dragend', function () { isDragging = false; card.classList.remove('dragging'); columns.forEach(function (col) { col.classList.remove('drag-over'); }); draggedId = null; });
      card.addEventListener('click', function () { if (isDragging) return; var issueId = card.dataset.id; var issue = Store.getIssues().find(function (i) { return i.id === issueId; }); if (issue) Modal.open(issue, 'issue'); });
    });
    columns.forEach(function (column) {
      column.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; column.classList.add('drag-over'); });
      column.addEventListener('dragleave', function (e) { if (!column.contains(e.relatedTarget)) column.classList.remove('drag-over'); });
      column.addEventListener('drop', function (e) { e.preventDefault(); column.classList.remove('drag-over'); var targetStage = column.dataset.stage; if (draggedId && targetStage) { Store.moveIssue(draggedId, targetStage); render(); } });
    });
  }

  function filterByStage(stage) {
    if (activeFilter === stage) activeFilter = null; else activeFilter = stage;
    render();
    var statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(function (card) { if (activeFilter && card.dataset.stage === activeFilter) card.classList.add('active'); else card.classList.remove('active'); });
    if (activeFilter) {
      var columns = document.querySelectorAll('.kanban-column');
      columns.forEach(function (col) { col.style.display = col.dataset.stage === activeFilter ? '' : 'none'; });
    }
  }

  function _escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _formatTime(isoStr) {
    if (!isoStr) return '';
    var date = new Date(isoStr); var now = new Date();
    var diffMs = now.getTime() - date.getTime();
    var diffMin = Math.floor(diffMs / 60000); var diffHour = Math.floor(diffMs / 3600000);
    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return diffMin + '分钟前';
    if (diffHour < 24) return diffHour + '小时前';
    var year = date.getFullYear(); var month = String(date.getMonth() + 1).padStart(2, '0'); var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  return { render: render, filterByStage: filterByStage };
})();