// app.js — 路由管理、全局事件、初始化
const App = (() => {
  const views = { dashboard: document.getElementById('view-dashboard'), knowledge: document.getElementById('view-knowledge') };
  const navLinks = document.querySelectorAll('.nav-link');

  function navigate(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    if (views[viewName]) views[viewName].classList.add('active');
    navLinks.forEach(link => link.classList.toggle('active', link.dataset.view === viewName));
    if (viewName === 'dashboard') Dashboard.render();
    if (viewName === 'knowledge') Knowledge.render();
  }

  function handleRoute() { navigate(location.hash.slice(1) || 'dashboard'); }

  function bindGlobalEvents() {
    document.getElementById('btn-add-issue').addEventListener('click', () => Modal.open());
    document.getElementById('btn-export').addEventListener('click', () => Store.exportData());
    const btnImport = document.getElementById('btn-import');
    const fileInput = document.getElementById('file-import');
    btnImport.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => { const result = Store.importData(evt.target.result); if (result.success) { alert('数据导入成功！'); handleRoute(); } else { alert('导入失败：' + result.error); } };
      reader.readAsText(file); fileInput.value = '';
    });
    navLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); location.hash = link.dataset.view; }));
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('data-changed', () => { const v = location.hash.slice(1) || 'dashboard'; if (v === 'dashboard') Dashboard.render(); if (v === 'knowledge') Knowledge.render(); });
  }

  function init() { Store.init(); bindGlobalEvents(); handleRoute(); }
  return { init, navigate };
})();

document.addEventListener('DOMContentLoaded', App.init);