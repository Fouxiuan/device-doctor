// store.js — 数据层 IIFE 模块
const Store = (function () {
  'use strict';

  const STORAGE_KEY = 'device-doctor-data';

  // ========== 初始化 ==========
  function init() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        saveData(DEMO_DATA);
        return;
      }
      var data = JSON.parse(raw);
      // 数据迁移：旧数据没有 devices 数组时自动生成
      if (!data.devices || data.devices.length === 0) {
        data.devices = _migrateDevices(data.issues || []);
        saveData(data);
      }
    } catch (e) {
      saveData(DEMO_DATA);
    }
  }

  // ========== 从旧 Issue 数据迁移生成 Device ==========
  function _migrateDevices(issues) {
    var deviceMap = {};
    issues.forEach(function (issue) {
      if (!issue.deviceId) return;
      if (!deviceMap[issue.deviceId]) {
        deviceMap[issue.deviceId] = {
          id: 'DEV-' + String(Object.keys(deviceMap).length + 1).padStart(3, '0'),
          deviceId: issue.deviceId,
          name: '未命名设备',
          model: '未知',
          location: '未分配',
          status: 'normal',
          createdAt: issue.createdAt || new Date().toISOString()
        };
      }
      // 如果有 danger 阶段的异常，设备状态设为 abnormal
      if (issue.stage === 'danger') {
        deviceMap[issue.deviceId].status = 'abnormal';
      }
    });
    return Object.values(deviceMap);
  }

  // ========== 读取数据 ==========
  function getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      // 解析异常时返回示例数据
    }
    return JSON.parse(JSON.stringify(DEMO_DATA));
  }

  // ========== 保存数据 ==========
  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('data-changed', { detail: data }));
    } catch (e) {
      console.error('Store.saveData 失败:', e);
    }
  }

  // ========== Issue 相关 ==========

  function getIssues() {
    return getData().issues || [];
  }

  function getIssuesByStage(stage) {
    return getIssues().filter(function (issue) {
      return issue.stage === stage;
    });
  }

  function addIssue(issue) {
    var data = getData();
    var maxNum = 0;
    data.issues.forEach(function (item) {
      var num = parseInt(item.id.replace('ISS-', ''), 10);
      if (num > maxNum) maxNum = num;
    });
    var newIssue = Object.assign({}, issue, {
      id: 'ISS-' + String(maxNum + 1).padStart(3, '0'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    data.issues.push(newIssue);
    // 同步标签
    if (newIssue.tags && newIssue.tags.length > 0) {
      _syncTags(newIssue.tags, data);
    }
    saveData(data);
    // 更新设备状态
    updateDeviceStatusByIssue(newIssue.deviceId, newIssue.stage);
    return newIssue;
  }

  function updateIssue(id, updates) {
    var data = getData();
    var stageChanged = false;
    var changedDeviceId = null;
    var newStage = null;
    data.issues = data.issues.map(function (issue) {
      if (issue.id === id) {
        var updated = Object.assign({}, issue, updates, {
          updatedAt: new Date().toISOString()
        });
        // 同步标签
        if (updated.tags && updated.tags.length > 0) {
          _syncTags(updated.tags, data);
        }
        // 检测 stage 是否变更
        if (updates.stage && updated.stage !== issue.stage) {
          stageChanged = true;
          changedDeviceId = updated.deviceId;
          newStage = updated.stage;
        }
        return updated;
      }
      return issue;
    });
    saveData(data);
    if (stageChanged) {
      updateDeviceStatusByIssue(changedDeviceId, newStage);
    }
    return true;
  }

  function moveIssue(id, newStage) {
    return updateIssue(id, { stage: newStage });
  }

  // ========== Knowledge 相关 ==========

  function getKnowledge() {
    return getData().knowledge || [];
  }

  function addKnowledge(item) {
    var data = getData();
    var maxNum = 0;
    data.knowledge.forEach(function (k) {
      var num = parseInt(k.id.replace('KNW-', ''), 10);
      if (num > maxNum) maxNum = num;
    });
    var newItem = Object.assign({}, item, {
      id: 'KNW-' + String(maxNum + 1).padStart(3, '0'),
      createdAt: new Date().toISOString()
    });
    data.knowledge.push(newItem);
    // 同步标签
    if (newItem.tags && newItem.tags.length > 0) {
      _syncTags(newItem.tags, data);
    }
    saveData(data);
    return newItem;
  }

  // ========== Tags 相关 ==========

  function getTags() {
    return getData().tags || [];
  }

  function _syncTags(tags, data) {
    if (!data) data = getData();
    if (!data.tags) data.tags = [];
    tags.forEach(function (tag) {
      if (data.tags.indexOf(tag) === -1) {
        data.tags.push(tag);
      }
    });
  }

  // ========== Device 相关 ==========

  function getDevices() {
    return getData().devices || [];
  }

  function getDeviceById(deviceId) {
    return getDevices().find(function (d) { return d.deviceId === deviceId; });
  }

  function addDevice(deviceData) {
    var data = getData();
    if (!data.devices) data.devices = [];
    // 校验 deviceId 唯一性
    var exists = data.devices.some(function (d) { return d.deviceId === deviceData.deviceId; });
    if (exists) {
      return { success: false, message: '设备编号已存在' };
    }
    var maxNum = 0;
    data.devices.forEach(function (d) {
      var num = parseInt(d.id.replace('DEV-', ''), 10);
      if (num > maxNum) maxNum = num;
    });
    var newDevice = Object.assign({}, deviceData, {
      id: 'DEV-' + String(maxNum + 1).padStart(3, '0'),
      createdAt: new Date().toISOString()
    });
    data.devices.push(newDevice);
    saveData(data);
    return { success: true, data: newDevice };
  }

  function updateDevice(deviceId, updates) {
    var data = getData();
    var found = false;
    data.devices = data.devices.map(function (device) {
      if (device.deviceId === deviceId) {
        found = true;
        return Object.assign({}, device, updates);
      }
      return device;
    });
    if (found) {
      saveData(data);
    }
    return found;
  }

  function deleteDevice(deviceId) {
    var data = getData();
    var hasIssues = (data.issues || []).some(function (i) { return i.deviceId === deviceId; });
    if (hasIssues) {
      return { success: false, message: '该设备有关联异常，无法删除' };
    }
    var originalLen = data.devices.length;
    data.devices = data.devices.filter(function (d) { return d.deviceId !== deviceId; });
    if (data.devices.length < originalLen) {
      saveData(data);
      return { success: true };
    }
    return { success: false, message: '设备不存在' };
  }

  function getIssuesByDevice(deviceId) {
    return getIssues().filter(function (i) { return i.deviceId === deviceId; });
  }

  function updateDeviceStatusByIssue(deviceId, stage) {
    var newStatus = 'normal';
    if (stage === 'danger') {
      newStatus = 'abnormal';
    } else if (stage === 'detecting' || stage === 'verifying') {
      // 检查是否还有其他 danger 异常
      var deviceIssues = getIssuesByDevice(deviceId);
      var hasDanger = deviceIssues.some(function (i) { return i.stage === 'danger'; });
      newStatus = hasDanger ? 'abnormal' : 'normal';
    }
    updateDevice(deviceId, { status: newStatus });
  }

  // ========== 搜索 ==========

  function searchKnowledge(keyword) {
    if (!keyword) return getKnowledge();
    var kw = keyword.toLowerCase();
    return getKnowledge().filter(function (item) {
      var titleMatch = item.title && item.title.toLowerCase().indexOf(kw) !== -1;
      var tagsMatch = item.tags && item.tags.some(function (t) {
        return t.toLowerCase().indexOf(kw) !== -1;
      });
      var devicesMatch = item.relatedDevices && item.relatedDevices.some(function (d) {
        return d.toLowerCase().indexOf(kw) !== -1;
      });
      return titleMatch || tagsMatch || devicesMatch;
    });
  }

  function searchIssues(keyword) {
    if (!keyword) return getIssues();
    var kw = keyword.toLowerCase();
    return getIssues().filter(function (issue) {
      var deviceIdMatch = issue.deviceId && issue.deviceId.toLowerCase().indexOf(kw) !== -1;
      var titleMatch = issue.title && issue.title.toLowerCase().indexOf(kw) !== -1;
      return deviceIdMatch || titleMatch;
    });
  }

  // ========== 统计 ==========

  function getStageCounts() {
    var issues = getIssues();
    return {
      verifying: issues.filter(function (i) { return i.stage === 'verifying'; }).length,
      detecting: issues.filter(function (i) { return i.stage === 'detecting'; }).length,
      normal: issues.filter(function (i) { return i.stage === 'normal'; }).length,
      danger: issues.filter(function (i) { return i.stage === 'danger'; }).length,
      wearing: issues.filter(function (i) { return i.stage === 'wearing'; }).length
    };
  }

  // ========== 导入导出 ==========

  function exportData() {
    var data = getData();
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'device-doctor-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(jsonString) {
    try {
      var data = JSON.parse(jsonString);
      if (!data.issues || !Array.isArray(data.issues)) {
        throw new Error('数据格式错误：缺少 issues 数组');
      }
      if (!data.knowledge || !Array.isArray(data.knowledge)) {
        throw new Error('数据格式错误：缺少 knowledge 数组');
      }
      if (!data.tags || !Array.isArray(data.tags)) {
        data.tags = [];
      }
      // 兼容旧数据：如果没有 devices，自动迁移
      if (!data.devices || data.devices.length === 0) {
        data.devices = _migrateDevices(data.issues || []);
      }
      saveData(data);
      return { success: true, message: '数据导入成功' };
    } catch (e) {
      return { success: false, message: '数据导入失败：' + e.message };
    }
  }

  // ========== 工具方法 ==========

  function resetData() {
    saveData(JSON.parse(JSON.stringify(DEMO_DATA)));
  }

  function getAllDeviceIds() {
    return getDevices().map(function (d) { return d.deviceId; });
  }

  function suggestKnowledge(tags) {
    if (!tags || tags.length === 0) return [];
    var allKnowledge = getKnowledge();
    // 按标签匹配数量和 solveCount 排序
    var scored = allKnowledge.map(function (item) {
      var matchCount = 0;
      if (item.tags) {
        tags.forEach(function (tag) {
          if (item.tags.indexOf(tag) !== -1) {
            matchCount++;
          }
        });
      }
      return {
        item: item,
        matchCount: matchCount,
        solveCount: item.solveCount || 0
      };
    }).filter(function (entry) {
      return entry.matchCount > 0;
    });
    scored.sort(function (a, b) {
      // 优先按匹配数降序，其次按 solveCount 降序
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return b.solveCount - a.solveCount;
    });
    return scored.map(function (entry) {
      return entry.item;
    });
  }

  // ========== 公开 API ==========
  return {
    init: init,
    getData: getData,
    saveData: saveData,
    getIssues: getIssues,
    getIssuesByStage: getIssuesByStage,
    addIssue: addIssue,
    updateIssue: updateIssue,
    moveIssue: moveIssue,
    getKnowledge: getKnowledge,
    addKnowledge: addKnowledge,
    getTags: getTags,
    _syncTags: _syncTags,
    getDevices: getDevices,
    getDeviceById: getDeviceById,
    addDevice: addDevice,
    updateDevice: updateDevice,
    deleteDevice: deleteDevice,
    getIssuesByDevice: getIssuesByDevice,
    updateDeviceStatusByIssue: updateDeviceStatusByIssue,
    searchKnowledge: searchKnowledge,
    searchIssues: searchIssues,
    getStageCounts: getStageCounts,
    exportData: exportData,
    importData: importData,
    resetData: resetData,
    getAllDeviceIds: getAllDeviceIds,
    suggestKnowledge: suggestKnowledge
  };
})();
