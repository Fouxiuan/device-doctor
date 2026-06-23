// modal.js — 弹窗组件 IIFE 模块
const Modal = (function () {
  'use strict';
  var overlay = document.getElementById('modal-overlay');
  var container = document.getElementById('modal-container');
  var currentIssue = null; var selectedTags = [];

  function open(issue, mode) {
    if (mode === undefined) mode = 'issue';
    currentIssue = issue || null; selectedTags = [];
    if (issue && issue.tags) selectedTags = issue.tags.slice();
    if (mode === 'knowledge') renderKnowledgeForm(); else renderIssueForm(!!issue);
    overlay.style.display = 'flex';
    requestAnimationFrame(function () { overlay.classList.add('show'); });
    if (mode === 'issue') _bindAutocomplete();
  }

  function renderIssueForm(isEdit) {
    var allTags = Store.getTags(); var tagsHtml = '';
    allTags.forEach(function (tag) { var isActive = selectedTags.indexOf(tag) !== -1 ? ' active' : ''; tagsHtml += '<span class="tag-item' + isActive + '" onclick="Modal.toggleTag(\'' + tag.replace(/'/g, "\\'") + '\', this)">' + tag + '</span>'; });
    var stageOptions = [{ value: 'verifying', label: '数据校对' }, { value: 'detecting', label: '检测中' }, { value: 'normal', label: '判定正常' }, { value: 'danger', label: '判定危险' }, { value: 'wearing', label: '穿戴测试' }];
    var stageSelectHtml = '';
    stageOptions.forEach(function (opt) { var selected = (currentIssue && currentIssue.stage === opt.value) ? ' selected' : ''; if (!currentIssue && opt.value === 'verifying') selected = ' selected'; stageSelectHtml += '<option value="' + opt.value + '"' + selected + '>' + opt.label + '</option>'; });
    var deviceIdValue = currentIssue ? currentIssue.deviceId : '';
    var titleValue = currentIssue ? currentIssue.title : '';
    var assigneeValue = currentIssue ? currentIssue.assignee : '';
    var descValue = currentIssue ? (currentIssue.description || '') : '';
    container.innerHTML = '<div class="modal-header"><h3>' + (isEdit ? '编辑异常' : '新增异常') + '</h3><button class="modal-close" onclick="Modal.close()">&times;</button></div>' +
      '<div class="modal-body"><div class="form-group"><label for="form-device-id">设备编号</label><div class="autocomplete-wrapper"><input type="text" id="form-device-id" class="form-control" placeholder="输入设备编号" value="' + deviceIdValue + '"><div class="autocomplete-list" id="autocomplete-list"></div></div></div>' +
      '<div class="form-group"><label for="form-title">异常现象</label><input type="text" id="form-title" class="form-control" placeholder="描述异常现象" value="' + titleValue + '"></div>' +
      '<div class="form-group"><label for="form-stage">当前阶段</label><select id="form-stage" class="form-control">' + stageSelectHtml + '</select></div>' +
      '<div class="form-group"><label for="form-assignee">负责人</label><input type="text" id="form-assignee" class="form-control" placeholder="负责人姓名" value="' + assigneeValue + '"></div>' +
      '<div class="form-group"><label>异常标签</label><div class="tag-selector" id="tag-selector">' + tagsHtml + '<button class="tag-add-btn" onclick="Modal.addCustomTag()">+ 自定义</button></div></div>' +
      '<div class="form-group"><label for="form-description">详细描述</label><textarea id="form-description" class="form-control" placeholder="详细描述异常情况" rows="4">' + descValue + '</textarea></div></div>' +
      '<div class="modal-footer"><button class="btn btn-primary" onclick="Modal.saveIssue()">保存</button><button class="btn btn-secondary" onclick="Modal.saveAndLink()">保存并推荐方案</button><button class="btn btn-outline" onclick="Modal.close()">取消</button></div>';
  }

  function renderKnowledgeForm() {
    container.innerHTML = '<div class="modal-header"><h3>新增处理方案</h3><button class="modal-close" onclick="Modal.close()">&times;</button></div>' +
      '<div class="modal-body"><div class="form-group"><label for="form-knowledge-title">方案标题</label><input type="text" id="form-knowledge-title" class="form-control" placeholder="输入方案标题"></div>' +
      '<div class="form-group"><label for="form-knowledge-content">处理步骤</label><textarea id="form-knowledge-content" class="form-control" placeholder="详细描述处理步骤" style="min-height:120px" rows="6"></textarea></div>' +
      '<div class="form-group"><label for="form-knowledge-devices">关联设备</label><input type="text" id="form-knowledge-devices" class="form-control" placeholder="关联设备编号，多个用逗号分隔"></div>' +
      '<div class="form-group"><label for="form-knowledge-status">状态</label><select id="form-knowledge-status" class="form-control"><option value="pending">待验证</option><option value="verified">已验证</option><option value="high-risk">高风险</option></select></div></div>' +
      '<div class="modal-footer"><button class="btn btn-primary" onclick="Modal.saveKnowledge()">保存方案</button><button class="btn btn-outline" onclick="Modal.close()">取消</button></div>';
  }

  function close() {
    overlay.classList.remove('show');
    setTimeout(function () { overlay.style.display = 'none'; container.innerHTML = ''; currentIssue = null; selectedTags = []; }, 300);
  }

  function toggleTag(tag, el) {
    var idx = selectedTags.indexOf(tag);
    if (idx === -1) { selectedTags.push(tag); el.classList.add('active'); } else { selectedTags.splice(idx, 1); el.classList.remove('active'); }
  }

  function addCustomTag() {
    var selector = document.getElementById('tag-selector'); var addBtn = selector.querySelector('.tag-add-btn');
    if (selector.querySelector('.tag-input-inline')) { selector.querySelector('.tag-input-inline').focus(); return; }
    var input = document.createElement('input');
    input.type = 'text'; input.className = 'form-control tag-input-inline';
    input.placeholder = '输入标签名，回车确认';
    input.style.cssText = 'width:120px;padding:4px 8px;font-size:12px;border-radius:14px;border:1px solid var(--color-verifying);display:inline-block;vertical-align:middle;';
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var tagName = input.value.trim(); if (!tagName) { input.remove(); return; } _createTag(tagName, selector, addBtn); input.remove(); }
      else if (e.key === 'Escape') { input.remove(); }
    });
    input.addEventListener('blur', function () { var tagName = input.value.trim(); if (tagName) _createTag(tagName, selector, addBtn); input.remove(); });
    selector.insertBefore(input, addBtn); input.focus();
  }

  function _createTag(tagName, selector, addBtn) {
    var existingTags = selector.querySelectorAll('.tag-item');
    for (var i = 0; i < existingTags.length; i++) { if (existingTags[i].textContent === tagName) { if (selectedTags.indexOf(tagName) === -1) { selectedTags.push(tagName); existingTags[i].classList.add('active'); } return; } }
    var span = document.createElement('span'); span.className = 'tag-item active'; span.textContent = tagName;
    span.setAttribute('onclick', "Modal.toggleTag('" + tagName.replace(/'/g, "\\'") + "', this)");
    selectedTags.push(tagName); selector.insertBefore(span, addBtn); Store._syncTags([tagName]);
  }

  function saveIssue() {
    var deviceId = document.getElementById('form-device-id').value.trim();
    var title = document.getElementById('form-title').value.trim();
    var stage = document.getElementById('form-stage').value;
    var assignee = document.getElementById('form-assignee').value.trim();
    var description = document.getElementById('form-description').value.trim();
    if (!deviceId) { alert('请输入设备编号'); return; }
    if (!title) { alert('请输入异常现象'); return; }
    if (!assignee) { alert('请输入负责人'); return; }
    var issueData = { deviceId: deviceId, title: title, stage: stage, assignee: assignee, tags: selectedTags.slice(), description: description };
    if (currentIssue) Store.updateIssue(currentIssue.id, issueData); else Store.addIssue(issueData);
    close();
  }

  function saveAndLink() {
    saveIssue();
    if (selectedTags.length > 0) {
      var suggestions = Store.suggestKnowledge(selectedTags);
      if (suggestions.length > 0) { var msg = '推荐相关处理方案：\n\n'; suggestions.forEach(function (item, index) { msg += (index + 1) + '. ' + item.title + ' (解决次数: ' + (item.solveCount || 0) + ')\n'; }); alert(msg); }
      else alert('未找到与当前标签相关的处理方案');
    } else alert('未选择标签，无法推荐相关方案');
  }

  function saveKnowledge() {
    var title = document.getElementById('form-knowledge-title').value.trim();
    var content = document.getElementById('form-knowledge-content').value.trim();
    var devicesStr = document.getElementById('form-knowledge-devices').value.trim();
    var status = document.getElementById('form-knowledge-status').value;
    if (!title) { alert('请输入方案标题'); return; }
    if (!content) { alert('请输入处理步骤'); return; }
    var relatedDevices = [];
    if (devicesStr) relatedDevices = devicesStr.split(/[,，]/).map(function (d) { return d.trim(); }).filter(function (d) { return d; });
    Store.addKnowledge({ title: title, content: content, relatedDevices: relatedDevices, status: status, tags: selectedTags.slice(), author: '当前用户', solveCount: 0, likes: 0, comments: 0 });
    close();
  }

  function _bindAutocomplete() {
    var input = document.getElementById('form-device-id'); var list = document.getElementById('autocomplete-list'); if (!input || !list) return;
    input.addEventListener('input', function () {
      var value = this.value.trim().toLowerCase(); var allIds = Store.getAllDeviceIds();
      if (!value) { list.style.display = 'none'; list.innerHTML = ''; return; }
      var filtered = allIds.filter(function (id) { return id.toLowerCase().indexOf(value) !== -1; });
      if (filtered.length === 0) { list.style.display = 'none'; list.innerHTML = ''; return; }
      var html = ''; filtered.forEach(function (id) { html += '<div class="autocomplete-item" onclick="Modal.selectDevice(\'' + id + '\')">' + id + '</div>'; });
      list.innerHTML = html; list.style.display = 'block';
    });
    input.addEventListener('blur', function () { setTimeout(function () { if (list) list.style.display = 'none'; }, 200); });
  }

  function selectDevice(id) {
    var input = document.getElementById('form-device-id'); var list = document.getElementById('autocomplete-list');
    if (input) input.value = id; if (list) { list.style.display = 'none'; list.innerHTML = ''; }
  }

  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.keyCode === 27) { if (overlay.style.display !== 'none') close(); } });
  return { open: open, close: close, toggleTag: toggleTag, addCustomTag: addCustomTag, saveIssue: saveIssue, saveAndLink: saveAndLink, saveKnowledge: saveKnowledge, selectDevice: selectDevice };
})();