// knowledge.js — 知识库视图 IIFE 模块
const Knowledge = (function () {
  'use strict';
  var activeTags = []; var searchKeyword = '';

  function render() {
    var viewEl = document.getElementById('view-knowledge'); if (!viewEl) return;
    var allTags = Store.getTags(); var allKnowledge = Store.getKnowledge();
    var filtered = allKnowledge;
    if (activeTags.length > 0) filtered = filtered.filter(function (item) { if (!item.tags) return false; return activeTags.some(function (tag) { return item.tags.indexOf(tag) !== -1; }); });
    if (searchKeyword) {
      var kw = searchKeyword.toLowerCase();
      filtered = filtered.filter(function (item) {
        return (item.title && item.title.toLowerCase().indexOf(kw) !== -1) || (item.content && item.content.toLowerCase().indexOf(kw) !== -1) || (item.tags && item.tags.some(function (t) { return t.toLowerCase().indexOf(kw) !== -1; })) || (item.relatedDevices && item.relatedDevices.some(function (d) { return d.toLowerCase().indexOf(kw) !== -1; }));
      });
    }
    var searchHtml = '<div class="search-area"><div class="search-input-wrapper"><input type="text" id="knowledge-search-input" class="search-input" placeholder="搜索方案标题、内容、标签或设备编号..." value="' + _escapeHtml(searchKeyword) + '"><button class="btn btn-primary search-btn" onclick="Knowledge.doSearch()">搜索</button></div><button class="btn btn-primary" onclick="Knowledge.openNewKnowledge()">+ 新增方案</button></div>';
    var tagFilterHtml = '<div class="tag-filter-bar">';
    allTags.forEach(function (tag) { var isActive = activeTags.indexOf(tag) !== -1 ? ' active' : ''; tagFilterHtml += '<span class="filter-tag' + isActive + '" onclick="Knowledge.toggleTag(\'' + tag.replace(/'/g, "\\'") + '\')">' + tag + '</span>'; });
    tagFilterHtml += '</div>';
    var listHtml = '<div class="knowledge-list">';
    if (filtered.length === 0) { listHtml += '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-state-text">暂无匹配的处理方案</div></div>'; }
    else { filtered.forEach(function (item) { listHtml += renderCard(item); }); }
    listHtml += '</div>';
    viewEl.innerHTML = searchHtml + tagFilterHtml + listHtml;
    var searchInput = document.getElementById('knowledge-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () { searchKeyword = this.value.trim(); render(); var newInput = document.getElementById('knowledge-search-input'); if (newInput) { newInput.focus(); newInput.setSelectionRange(newInput.value.length, newInput.value.length); } });
      searchInput.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); doSearch(); } });
    }
  }

  function renderCard(item) {
    var statusLabel = '', statusClass = '';
    switch (item.status) {
      case 'verified': statusLabel = '已验证'; statusClass = 'status-verified'; break;
      case 'high-risk': statusLabel = '高风险'; statusClass = 'status-high-risk'; break;
      default: statusLabel = '待验证'; statusClass = 'status-pending';
    }
    var devicesStr = (item.relatedDevices && item.relatedDevices.length > 0) ? item.relatedDevices.join(', ') : '无关联设备';
    var contentLines = (item.content || '').split('\n'); var previewText = contentLines.slice(0, 2).join('\n'); var hasMore = contentLines.length > 2;
    var dateStr = ''; if (item.createdAt) { var d = new Date(item.createdAt); dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    return '<div class="knowledge-card" data-id="' + item.id + '"><div class="knowledge-card-header"><h4 class="knowledge-card-title">' + _escapeHtml(item.title) + '</h4><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></div><div class="knowledge-card-meta"><span class="meta-device">关联设备: ' + _escapeHtml(devicesStr) + '</span><span class="meta-solve">解决次数: ' + (item.solveCount || 0) + '</span></div><div class="knowledge-card-content collapsed" id="content-' + item.id + '"><pre class="content-preview">' + _escapeHtml(previewText) + (hasMore ? '\n...' : '') + '</pre></div>' + (hasMore ? '<button class="expand-btn" id="expand-btn-' + item.id + '" onclick="Knowledge.toggleExpand(\'' + item.id + '\', this)">展开全文</button>' : '') + '<div class="knowledge-card-footer"><span class="footer-author">贡献者: ' + _escapeHtml(item.author || '未知') + '</span><span class="footer-date">' + dateStr + '</span><span class="footer-action" title="点赞">👍 ' + (item.likes || 0) + '</span><span class="footer-action" title="评论">💬 ' + (item.comments || 0) + '</span></div></div>';
  }

  function toggleExpand(id, btn) {
    var contentEl = document.getElementById('content-' + id); if (!contentEl) return;
    var item = Store.getKnowledge().find(function (k) { return k.id === id; }); if (!item) return;
    if (contentEl.classList.contains('collapsed')) {
      contentEl.classList.remove('collapsed');
      contentEl.innerHTML = '<pre class="content-full">' + _escapeHtml(item.content).replace(/\n/g, '<br>') + '</pre>';
      btn.textContent = '收起';
    } else {
      contentEl.classList.add('collapsed');
      var contentLines = (item.content || '').split('\n'); var previewText = contentLines.slice(0, 2).join('\n'); var hasMore = contentLines.length > 2;
      contentEl.innerHTML = '<pre class="content-preview">' + _escapeHtml(previewText) + (hasMore ? '\n...' : '') + '</pre>';
      btn.textContent = '展开全文';
    }
  }

  function toggleTag(tag) { var idx = activeTags.indexOf(tag); if (idx === -1) activeTags.push(tag); else activeTags.splice(idx, 1); render(); }
  function doSearch() { var input = document.getElementById('knowledge-search-input'); if (input) searchKeyword = input.value.trim(); render(); }
  function openNewKnowledge() { Modal.open(null, 'knowledge'); }
  function _escapeHtml(str) { if (!str) return ''; return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  return { render: render, toggleExpand: toggleExpand, toggleTag: toggleTag, doSearch: doSearch, openNewKnowledge: openNewKnowledge };
})();