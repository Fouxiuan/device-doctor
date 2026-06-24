// app.js — 路由管理、全局事件、初始化
const App = (() => {
  const views = {
    dashboard: document.getElementById('view-dashboard'),
    knowledge: document.getElementById('view-knowledge'),
    devices: document.getElementById('view-devices')
  };
  const navLinks = document.querySelectorAll('.nav-link');

  // 路由切换
  function navigate(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    if (views[viewName]) views[viewName].classList.add('active');
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.view === viewName);
    });
    if (viewName === 'dashboard') Dashboard.render();
    if (viewName === 'knowledge') Knowledge.render();
    if (viewName === 'devices') Devices.render();
  }

  // 监听 hash 变化
  function handleRoute() {
    const hash = location.hash.slice(1) || 'dashboard';
    navigate(hash);
  }

  // 全局按钮事件
  function bindGlobalEvents() {
    // 新增异常
    document.getElementById('btn-add-issue').addEventListener('click', () => {
      Modal.open();
    });

    // 新增设备
    var btnAddDevice = document.getElementById('btn-add-device');
    if (btnAddDevice) {
      btnAddDevice.addEventListener('click', () => {
        Modal.open(null, 'device');
      });
    }

    // 导出数据
    document.getElementById('btn-export').addEventListener('click', () => {
      Store.exportData();
    });

    // 导入数据
    const btnImport = document.getElementById('btn-import');
    const fileInput = document.getElementById('file-import');
    btnImport.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = Store.importData(evt.target.result);
        if (result.success) {
          alert('数据导入成功！');
          handleRoute();
        } else {
          alert('导入失败：' + result.error);
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });

    // 导航链接点击
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        location.hash = link.dataset.view;
      });
    });

    // hash 变化监听
    window.addEventListener('hashchange', handleRoute);

    // 数据变更监听 — 刷新当前视图
    window.addEventListener('data-changed', () => {
      const currentView = location.hash.slice(1) || 'dashboard';
      if (currentView === 'dashboard') Dashboard.render();
      if (currentView === 'knowledge') Knowledge.render();
      if (currentView === 'devices') Devices.render();
    });
  }

  // 应用初始化
  function init() {
    Store.init();
    bindGlobalEvents();
    handleRoute();
  }

  return { init, navigate };
})();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', App.init);
