// store.js — 数据层 IIFE 模块
const Store = (function () {
  'use strict';
  const STORAGE_KEY = 'device-doctor-data';

  function init() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) saveData(DEMO_DATA);
    } catch (e) { saveData(DEMO_DATA); }
  }

  function getData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEMO_DATA));
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('data-changed', { detail: data }));
    } catch (e) { console.error('Store.saveData 失败:', e); }
  }

  function getIssues() { return getData().issues || []; }
  function getIssuesByStage(stage) { return getIssues().filter(function (i) { return i.stage === stage; }); }

  function addIssue(issue) {
    var data = getData();
    var maxNum = 0;
    data.issues.forEach(function (item) { var num = parseInt(item.id.replace('ISS-', ''), 10); if (num > maxNum) maxNum = num; });
    var newIssue = Object.assign({}, issue, { id: 'ISS-' + String(maxNum + 1).padStart(3, '0'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    data.issues.push(newIssue);
    if (newIssue.tags && newIssue.tags.length > 0) _syncTags(newIssue.tags, data);
    saveData(data);
    return newIssue;
  }

  function updateIssue(id, updates) {
    var data = getData();
    var found = false;
    data.issues = data.issues.map(function (issue) {
      if (issue.id === id) { found = true; var updated = Object.assign({}, issue, updates, { updatedAt: new Date().toISOString() }); if (updated.tags) _syncTags(updated.tags, data); return updated; }
      return issue;
    });
    if (found) saveData(data);
    return found;
  }

  function moveIssue(id, newStage) { return updateIssue(id, { stage: newStage }); }
  function getKnowledge() { return getData().knowledge || []; }

  function addKnowledge(item) {
    var data = getData();
    var maxNum = 0;
    data.knowledge.forEach(function (k) { var num = parseInt(k.id.replace('KNW-', ''), 10); if (num > maxNum) maxNum = num; });
    var newItem = Object.assign({}, item, { id: 'KNW-' + String(maxNum + 1).padStart(3, '0'), createdAt: new Date().toISOString() });
    data.knowledge.push(newItem);
    if (newItem.tags) _syncTags(newItem.tags, data);
    saveData(data);
    return newItem;
  }

  function getTags() { return getData().tags || []; }
  function _syncTags(tags, data) { if (!data) data = getData(); if (!data.tags) data.tags = []; tags.forEach(function (tag) { if (data.tags.indexOf(tag) === -1) data.tags.push(tag); }); }

  function searchKnowledge(keyword) {
    if (!keyword) return getKnowledge();
    var kw = keyword.toLowerCase();
    return getKnowledge().filter(function (item) {
      return (item.title && item.title.toLowerCase().indexOf(kw) !== -1) || (item.tags && item.tags.some(function (t) { return t.toLowerCase().indexOf(kw) !== -1; })) || (item.relatedDevices && item.relatedDevices.some(function (d) { return d.toLowerCase().indexOf(kw) !== -1; }));
    });
  }

  function searchIssues(keyword) {
    if (!keyword) return getIssues();
    var kw = keyword.toLowerCase();
    return getIssues().filter(function (issue) { return (issue.deviceId && issue.deviceId.toLowerCase().indexOf(kw) !== -1) || (issue.title && issue.title.toLowerCase().indexOf(kw) !== -1); });
  }

  function getStageCounts() {
    var issues = getIssues();
    return { verifying: issues.filter(function (i) { return i.stage === 'verifying'; }).length, detecting: issues.filter(function (i) { return i.stage === 'detecting'; }).length, normal: issues.filter(function (i) { return i.stage === 'normal'; }).length, danger: issues.filter(function (i) { return i.stage === 'danger'; }).length, wearing: issues.filter(function (i) { return i.stage === 'wearing'; }).length };
  }

  function exportData() {
    var data = getData();
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = 'device-doctor-data.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function importData(jsonString) {
    try {
      var data = JSON.parse(jsonString);
      if (!data.issues || !Array.isArray(data.issues)) throw new Error('数据格式错误：缺少 issues 数组');
      if (!data.knowledge || !Array.isArray(data.knowledge)) throw new Error('数据格式错误：缺少 knowledge 数组');
      if (!data.tags || !Array.isArray(data.tags)) data.tags = [];
      saveData(data);
      return { success: true, message: '数据导入成功' };
    } catch (e) { return { success: false, message: '数据导入失败：' + e.message }; }
  }

  function resetData() { saveData(JSON.parse(JSON.stringify(DEMO_DATA))); }
  function getAllDeviceIds() { var ids = {}; getIssues().forEach(function (issue) { if (issue.deviceId) ids[issue.deviceId] = true; }); return Object.keys(ids); }

  function suggestKnowledge(tags) {
    if (!tags || tags.length === 0) return [];
    var allKnowledge = getKnowledge();
    var scored = allKnowledge.map(function (item) {
      var matchCount = 0;
      if (item.tags) tags.forEach(function (tag) { if (item.tags.indexOf(tag) !== -1) matchCount++; });
      return { item: item, matchCount: matchCount, solveCount: item.solveCount || 0 };
    }).filter(function (entry) { return entry.matchCount > 0; });
    scored.sort(function (a, b) { if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount; return b.solveCount - a.solveCount; });
    return scored.map(function (entry) { return entry.item; });
  }

  return { init: init, getData: getData, saveData: saveData, getIssues: getIssues, getIssuesByStage: getIssuesByStage, addIssue: addIssue, updateIssue: updateIssue, moveIssue: moveIssue, getKnowledge: getKnowledge, addKnowledge: addKnowledge, getTags: getTags, _syncTags: _syncTags, searchKnowledge: searchKnowledge, searchIssues: searchIssues, getStageCounts: getStageCounts, exportData: exportData, importData: importData, resetData: resetData, getAllDeviceIds: getAllDeviceIds, suggestKnowledge: suggestKnowledge };
})();