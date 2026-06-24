// modal.js — 弹窗组件 IIFE 模块
const Modal = (function () {
  'use strict';

  var overlay = document.getElementById('modal-overlay');
  var container = document.getElementById('modal-container');
  var currentIssue = null;
  var selectedTags = [];

  // ========== 打开弹窗 ==========
  function open(issue, mode) {
    if (mode === undefined) mode = 'issue';
    currentIssue = issue || null;
    selectedTags = [];

    // 如果是编辑模式，初始化 selectedTags
    if (issue && issue.tags) {
      selectedTags = issue.tags.slice();
    }

    // 根据 mode 渲染不同表单
    if (mode === 'device') {
      renderDeviceForm(issue);
      overlay.style.display = 'flex';
      requestAnimationFrame(function () {
        overlay.classList.add('show');
      });
      return;
    }

    if (mode === 'knowledge') {
      renderKnowledgeForm();
    } else {
      var isEdit = !!issue;
      renderIssueForm(isEdit);
    }

    overlay.style.display = 'flex';
    requestAnimationFrame(function () {
      overlay.classList.add('show');
    });
  }

  // ========== 渲染异常表单 ==========
  function renderIssueForm(isEdit) {
    var allTags = Store.getTags();
    var tagsHtml = '';
    allTags.forEach(function (tag) {
      var isActive = selectedTags.indexOf(tag) !== -1 ? ' active' : '';
      tagsHtml += '<span class="tag-item' + isActive + '" onclick="Modal.toggleTag(\'' + tag.replace(/'/g, "\\'") + '\', this)">' + tag + '</span>';
    });

    var stageOptions = [
      { value: 'verifying', label: '数据校对' },
      { value: 'detecting', label: '检测中' },
      { value: 'normal', label: '判定正常' },
      { value: 'danger', label: '判定危险' },
      { value: 'wearing', label: '穿戴测试' }
    ];
    var stageSelectHtml = '';
    stageOptions.forEach(function (opt) {
      var selected = (currentIssue && currentIssue.stage === opt.value) ? ' selected' : '';
      if (!currentIssue && opt.value === 'verifying') selected = ' selected';
      stageSelectHtml += '<option value="' + opt.value + '"' + selected + '>' + opt.label + '</option>';
    });

    var deviceIdValue = currentIssue ? currentIssue.deviceId : '';
    var titleValue = currentIssue ? currentIssue.title : '';
    var assigneeValue = currentIssue ? currentIssue.assignee : '';
    var descValue = currentIssue ? (currentIssue.description || '') : '';

    // 生成设备下拉选项
    var devices = Store.getDevices();
    var deviceSelectHtml = '<option value="">请选择设备</option>';
    devices.forEach(function (d) {
      var selected = (deviceIdValue === d.deviceId) ? ' selected' : '';
      deviceSelectHtml += '<option value="' + d.deviceId + '"' + selected + '>' + d.deviceId + ' - ' + d.name + '</option>';
    });

    var html = '' +
      '<div class="modal-header">' +
      '  <h3>' + (isEdit ? '编辑异常' : '新增异常') + '</h3>' +
      '  <button class="modal-close" onclick="Modal.close()">&times;</button>' +
      '</div>' +
      '<div class="modal-body">' +
      '  <div class="form-group">' +
      '    <label for="form-device-id">设备</label>' +
      '    <select id="form-device-id" class="form-control">' + deviceSelectHtml + '</select>' +
      '    <div class="form-hint device-add-hint">未找到设备？<a href="#devices" onclick="Modal.close()">去添加新设备</a></div>' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="form-title">异常现象</label>' +
      '    <input type="text" id="form-title" class="form-control" placeholder="描述异常现象" value="' + titleValue + '">' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="form-stage">当前阶段</label>' +
      '    <select id="form-stage" class="form-control">' + stageSelectHtml + '</select>' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="form-assignee">负责人</label>' +
      '    <input type="text" id="form-assignee" class="form-control" placeholder="负责人姓名" value="' + assigneeValue + '">' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label>异常标签</label>' +
      '    <div class="tag-selector" id="tag-selector">' +
      '      ' + tagsHtml +
      '      <button class="tag-add-btn" onclick="Modal.addCustomTag()">+ 自定义</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="form-description">详细描述</label>' +
      '    <textarea id="form-description" class="form-control" placeholder="详细描述异常情况" rows="4">' + descValue + '</textarea>' +
      '  </div>' +
      '</div>' +
      '<div class="modal-footer">' +
      '  <button class="btn btn-primary" onclick="Modal.saveIssue()">保存</button>' +
      '  <button class="btn btn-secondary" onclick="Modal.saveAndLink()">保存并推荐方案</button>' +
      '  <button class="btn btn-outline" onclick="Modal.close()">取消</button>' +
      '</div>';

    container.innerHTML = html;
  }

  // ========== 渲染知识库表单 ==========
  function renderKnowledgeForm() {
    var html = '' +
      '<div class="modal-header">' +
      '  <h3>新增处理方案</h3>' +
      '  <button class="modal-close" onclick="Modal.close()">&times;</button>' +
      '</div>' +
      '<div class="modal-body">' +
      '  <div class="form-group">' +
      '    <label for="form-knowledge-title">方案标题</label>' +
      '    <input type="text" id="form-knowledge-title" class="form-control" placeholder="输入方案标题">' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="form-knowledge-content">处理步骤</label>' +
      '    <textarea id="form-knowledge-content" class="form-control" placeholder="详细描述处理步骤" style="min-height:120px" rows="6"></textarea>' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="form-knowledge-devices">关联设备</label>' +
      '    <input type="text" id="form-knowledge-devices" class="form-control" placeholder="关联设备编号，多个用逗号分隔">' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="form-knowledge-status">状态</label>' +
      '    <select id="form-knowledge-status" class="form-control">' +
      '      <option value="pending">待验证</option>' +
      '      <option value="verified">已验证</option>' +
      '      <option value="high-risk">高风险</option>' +
      '    </select>' +
      '  </div>' +
      '</div>' +
      '<div class="modal-footer">' +
      '  <button class="btn btn-primary" onclick="Modal.saveKnowledge()">保存方案</button>' +
      '  <button class="btn btn-outline" onclick="Modal.close()">取消</button>' +
      '</div>';

    container.innerHTML = html;
  }

  // ========== 渲染设备表单 ==========
  function renderDeviceForm(device) {
    var isEdit = !!device;
    var deviceIdValue = device ? device.deviceId : '';
    var nameValue = device ? device.name : '';
    var modelValue = device ? (device.model || '') : '';
    var locationValue = device ? (device.location || '') : '';
    var currentStatus = device ? device.status : 'normal';

    var statusOptions = [
      { value: 'normal', label: '正常' },
      { value: 'abnormal', label: '异常' },
      { value: 'maintenance', label: '维修中' }
    ];
    var statusSelectHtml = '';
    statusOptions.forEach(function (opt) {
      var selected = (currentStatus === opt.value) ? ' selected' : '';
      statusSelectHtml += '<option value="' + opt.value + '"' + selected + '>' + opt.label + '</option>';
    });

    var html = '' +
      '<div class="modal-header">' +
      '  <h3>' + (isEdit ? '编辑设备' : '新增设备') + '</h3>' +
      '  <button class="modal-close" onclick="Modal.close()">&times;</button>' +
      '</div>' +
      '<div class="modal-body">' +
      '  <div class="form-group">' +
      '    <label for="form-device-code">设备编号</label>' +
      '    <input type="text" id="form-device-code" class="form-control" placeholder="输入设备编号" value="' + deviceIdValue + '"' + (isEdit ? ' disabled' : '') + '>' +
      (isEdit ? '' : '    <div class="form-hint" id="device-id-hint"></div>') +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="form-device-name">设备名称</label>' +
      '    <input type="text" id="form-device-name" class="form-control" placeholder="输入设备名称" value="' + nameValue + '">' +
      '  </div>' +
      '  <div class="form-row">' +
      '    <div class="form-group">' +
      '      <label for="form-device-model">型号</label>' +
      '      <input type="text" id="form-device-model" class="form-control" placeholder="输入型号" value="' + modelValue + '">' +
      '    </div>' +
      '    <div class="form-group">' +
      '      <label for="form-device-location">位置</label>' +
      '      <input type="text" id="form-device-location" class="form-control" placeholder="输入存放位置" value="' + locationValue + '">' +
      '    </div>' +
      '  </div>' +
      '  <div class="form-group">' +
      '    <label for="form-device-status">状态</label>' +
      '    <select id="form-device-status" class="form-control">' + statusSelectHtml + '</select>' +
      '  </div>' +
      '</div>' +
      '<div class="modal-footer">' +
      '  <button class="btn btn-primary" onclick="Modal.saveDevice()">保存</button>' +
      '  <button class="btn btn-outline" onclick="Modal.close()">取消</button>' +
      '</div>';

    container.innerHTML = html;

    // 新增模式下绑定 deviceId 实时唯一性校验
    if (!isEdit) {
      var codeInput = document.getElementById('form-device-code');
      var hintEl = document.getElementById('device-id-hint');
      if (codeInput && hintEl) {
        codeInput.addEventListener('input', function () {
          var val = this.value.trim();
          if (!val) {
            hintEl.textContent = '';
            return;
          }
          var exists = Store.getDeviceById(val);
          if (exists) {
            hintEl.textContent = '该设备编号已存在';
            hintEl.style.color = 'var(--color-danger)';
          } else {
            hintEl.textContent = '设备编号可用';
            hintEl.style.color = 'var(--color-normal)';
          }
        });
      }
    }
  }

  // ========== 关闭弹窗 ==========
  function close() {
    overlay.classList.remove('show');
    setTimeout(function () {
      overlay.style.display = 'none';
      container.innerHTML = '';
      currentIssue = null;
      selectedTags = [];
    }, 300);
  }

  // ========== 切换标签 ==========
  function toggleTag(tag, el) {
    var idx = selectedTags.indexOf(tag);
    if (idx === -1) {
      selectedTags.push(tag);
      el.classList.add('active');
    } else {
      selectedTags.splice(idx, 1);
      el.classList.remove('active');
    }
  }

  // ========== 添加自定义标签 ==========
  function addCustomTag() {
    var selector = document.getElementById('tag-selector');
    var addBtn = selector.querySelector('.tag-add-btn');

    // 如果已经有输入框，聚焦即可
    if (selector.querySelector('.tag-input-inline')) {
      selector.querySelector('.tag-input-inline').focus();
      return;
    }

    // 创建内联输入框
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control tag-input-inline';
    input.placeholder = '输入标签名，回车确认';
    input.style.cssText = 'width:120px;padding:4px 8px;font-size:12px;border-radius:14px;border:1px solid var(--color-verifying);display:inline-block;vertical-align:middle;';

    // 回车确认
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var tagName = input.value.trim();
        if (!tagName) { input.remove(); return; }
        _createTag(tagName, selector, addBtn);
        input.remove();
      } else if (e.key === 'Escape') {
        input.remove();
      }
    });

    // 失焦确认
    input.addEventListener('blur', function() {
      var tagName = input.value.trim();
      if (tagName) {
        _createTag(tagName, selector, addBtn);
      }
      input.remove();
    });

    selector.insertBefore(input, addBtn);
    input.focus();
  }

  function _createTag(tagName, selector, addBtn) {
    // 检查是否已存在
    var existingTags = selector.querySelectorAll('.tag-item');
    for (var i = 0; i < existingTags.length; i++) {
      if (existingTags[i].textContent === tagName) {
        if (selectedTags.indexOf(tagName) === -1) {
          selectedTags.push(tagName);
          existingTags[i].classList.add('active');
        }
        return;
      }
    }

    // 创建新标签元素
    var span = document.createElement('span');
    span.className = 'tag-item active';
    span.textContent = tagName;
    span.setAttribute('onclick', "Modal.toggleTag('" + tagName.replace(/'/g, "\\'") + "', this)");
    selectedTags.push(tagName);

    selector.insertBefore(span, addBtn);

    // 同步到 Store
    Store._syncTags([tagName]);
  }

  // ========== 保存异常 ==========
  function saveIssue() {
    var deviceId = document.getElementById('form-device-id').value.trim();
    var title = document.getElementById('form-title').value.trim();
    var stage = document.getElementById('form-stage').value;
    var assignee = document.getElementById('form-assignee').value.trim();
    var description = document.getElementById('form-description').value.trim();

    // 校验必填
    if (!deviceId) {
      alert('请选择设备');
      return;
    }
    if (!title) {
      alert('请输入异常现象');
      return;
    }
    if (!assignee) {
      alert('请输入负责人');
      return;
    }

    var issueData = {
      deviceId: deviceId,
      title: title,
      stage: stage,
      assignee: assignee,
      tags: selectedTags.slice(),
      description: description
    };

    if (currentIssue) {
      // 编辑模式
      Store.updateIssue(currentIssue.id, issueData);
    } else {
      // 新增模式
      Store.addIssue(issueData);
    }

    close();
  }

  // ========== 保存并推荐方案 ==========
  function saveAndLink() {
    saveIssue();

    if (selectedTags.length > 0) {
      var suggestions = Store.suggestKnowledge(selectedTags);
      if (suggestions.length > 0) {
        var msg = '推荐相关处理方案：\n\n';
        suggestions.forEach(function (item, index) {
          msg += (index + 1) + '. ' + item.title + ' (解决次数: ' + (item.solveCount || 0) + ')\n';
        });
        alert(msg);
      } else {
        alert('未找到与当前标签相关的处理方案');
      }
    } else {
      alert('未选择标签，无法推荐相关方案');
    }
  }

  // ========== 保存知识库方案 ==========
  function saveKnowledge() {
    var title = document.getElementById('form-knowledge-title').value.trim();
    var content = document.getElementById('form-knowledge-content').value.trim();
    var devicesStr = document.getElementById('form-knowledge-devices').value.trim();
    var status = document.getElementById('form-knowledge-status').value;

    // 校验必填
    if (!title) {
      alert('请输入方案标题');
      return;
    }
    if (!content) {
      alert('请输入处理步骤');
      return;
    }

    var relatedDevices = [];
    if (devicesStr) {
      relatedDevices = devicesStr.split(/[,，]/).map(function (d) { return d.trim(); }).filter(function (d) { return d; });
    }

    var knowledgeData = {
      title: title,
      content: content,
      relatedDevices: relatedDevices,
      status: status,
      tags: selectedTags.slice(),
      author: '当前用户',
      solveCount: 0,
      likes: 0,
      comments: 0
    };

    Store.addKnowledge(knowledgeData);
    close();
  }

  // ========== 保存设备 ==========
  function saveDevice() {
    var deviceId = document.getElementById('form-device-code').value.trim();
    var name = document.getElementById('form-device-name').value.trim();
    var model = document.getElementById('form-device-model').value.trim();
    var location = document.getElementById('form-device-location').value.trim();
    var status = document.getElementById('form-device-status').value;

    if (!deviceId) {
      alert('请输入设备编号');
      return;
    }
    if (!name) {
      alert('请输入设备名称');
      return;
    }

    // 检查是否是编辑模式（通过判断 input 是否 disabled）
    var codeInput = document.getElementById('form-device-code');
    var isEdit = codeInput && codeInput.disabled;

    var deviceData = {
      deviceId: deviceId,
      name: name,
      model: model,
      location: location,
      status: status
    };

    if (isEdit) {
      Store.updateDevice(deviceId, deviceData);
    } else {
      var result = Store.addDevice(deviceData);
      if (!result.success) {
        alert(result.message);
        return;
      }
    }

    close();
  }

  // ========== 为指定设备打开新增异常弹窗 ==========
  function openForDevice(deviceId) {
    currentIssue = null;
    selectedTags = [];
    renderIssueForm(false);

    // 预填充设备编号并禁用选择
    var select = document.getElementById('form-device-id');
    if (select) {
      select.value = deviceId;
      select.disabled = true;
    }

    overlay.style.display = 'flex';
    requestAnimationFrame(function () {
      overlay.classList.add('show');
    });
  }

  // ========== 遮罩点击关闭 ==========
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      close();
    }
  });

  // ========== ESC 键关闭 ==========
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      if (overlay.style.display !== 'none') {
        close();
      }
    }
  });

  // ========== 公开 API ==========
  return {
    open: open,
    close: close,
    toggleTag: toggleTag,
    addCustomTag: addCustomTag,
    saveIssue: saveIssue,
    saveAndLink: saveAndLink,
    saveKnowledge: saveKnowledge,
    saveDevice: saveDevice,
    openForDevice: openForDevice
  };
})();
