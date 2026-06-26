const Store = {
  _storageKey: 'device-doctor-data',
  _data: null,
  _listeners: [],

  init() {
    const saved = localStorage.getItem(this._storageKey);
    if (saved) {
      try {
        this._data = JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved data, using demo data', e);
        this._data = JSON.parse(JSON.stringify(DEMO_DATA));
        this.save();
      }
    } else {
      this._data = JSON.parse(JSON.stringify(DEMO_DATA));
      this.save();
    }
  },

  save() {
    localStorage.setItem(this._storageKey, JSON.stringify(this._data));
    this._notify();
  },

  _notify() {
    this._listeners.forEach(fn => {
      try { fn(this._data); } catch (e) { console.error(e); }
    });
  },

  subscribe(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(l => l !== fn);
    };
  },

  getAll() {
    return this._data;
  },

  getIssues() {
    return this._data.issues || [];
  },

  getIssueById(id) {
    return this._data.issues.find(i => i.id === id);
  },

  getIssuesByStage(stage) {
    return this._data.issues.filter(i => i.stage === stage);
  },

  getIssuesByDeviceId(deviceId) {
    return this._data.issues.filter(i => i.deviceId === deviceId);
  },

  addIssue(issue) {
    const newIssue = {
      ...issue,
      id: 'ISS-' + String(this._data.issues.length + 1).padStart(3, '0'),
      createdAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
      updatedAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')
    };
    this._data.issues.push(newIssue);
    this.save();
    return newIssue;
  },

  updateIssue(id, updates) {
    const index = this._data.issues.findIndex(i => i.id === id);
    if (index === -1) return null;
    this._data.issues[index] = {
      ...this._data.issues[index],
      ...updates,
      updatedAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')
    };
    this.save();
    return this._data.issues[index];
  },

  deleteIssue(id) {
    this._data.issues = this._data.issues.filter(i => i.id !== id);
    this.save();
  },

  getDevices() {
    return this._data.devices || [];
  },

  getDeviceById(id) {
    return this._data.devices.find(d => d.id === id);
  },

  addDevice(device) {
    const newDevice = {
      ...device,
      id: 'DEV-' + String(this._data.devices.length + 1).padStart(3, '0')
    };
    this._data.devices.push(newDevice);
    this.save();
    return newDevice;
  },

  updateDevice(id, updates) {
    const index = this._data.devices.findIndex(d => d.id === id);
    if (index === -1) return null;
    this._data.devices[index] = { ...this._data.devices[index], ...updates };
    this.save();
    return this._data.devices[index];
  },

  deleteDevice(id) {
    this._data.devices = this._data.devices.filter(d => d.id !== id);
    this.save();
  },

  getKnowledge() {
    return this._data.knowledge || [];
  },

  getKnowledgeById(id) {
    return this._data.knowledge.find(k => k.id === id);
  },

  getKnowledgeByCategory(categoryId) {
    return this._data.knowledge.filter(k => k.categoryId === categoryId);
  },

  getKnowledgeByTag(tag) {
    return this._data.knowledge.filter(k => (k.tags || []).includes(tag));
  },

  addKnowledge(knowledge) {
    const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-');
    const newKnowledge = {
      ...knowledge,
      id: 'KNOW-' + String(this._data.knowledge.length + 1).padStart(3, '0'),
      createdAt: now,
      updatedAt: now
    };
    this._data.knowledge.push(newKnowledge);
    this.save();
    return newKnowledge;
  },

  updateKnowledge(id, updates) {
    const index = this._data.knowledge.findIndex(k => k.id === id);
    if (index === -1) return null;
    this._data.knowledge[index] = {
      ...this._data.knowledge[index],
      ...updates,
      updatedAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')
    };
    this.save();
    return this._data.knowledge[index];
  },

  deleteKnowledge(id) {
    this._data.knowledge = this._data.knowledge.filter(k => k.id !== id);
    this.save();
  },

  getCategories() {
    return this._data.categories || [];
  },

  addCategory(category) {
    const newCategory = {
      ...category,
      id: 'CAT-' + String(this._data.categories.length + 1).padStart(3, '0'),
      order: this._data.categories.length + 1
    };
    this._data.categories.push(newCategory);
    this.save();
    return newCategory;
  },

  updateCategory(id, updates) {
    const index = this._data.categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    this._data.categories[index] = { ...this._data.categories[index], ...updates };
    this.save();
    return this._data.categories[index];
  },

  deleteCategory(id) {
    this._data.categories = this._data.categories.filter(c => c.id !== id);
    this._data.knowledge.forEach(k => {
      if (k.categoryId === id) k.categoryId = null;
    });
    this.save();
  },

  getSettings() {
    return this._data.settings || {};
  },

  updateSettings(updates) {
    this._data.settings = { ...this._data.settings, ...updates };
    this.save();
    return this._data.settings;
  },

  exportData() {
    return JSON.stringify(this._data, null, 2);
  },

  importData(jsonStr, merge = true) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.issues || !data.devices || !data.knowledge) {
        throw new Error('数据格式不正确');
      }
      if (merge) {
        const existingIds = new Set(this._data.issues.map(i => i.id));
        data.issues.forEach(issue => {
          if (!existingIds.has(issue.id)) {
            this._data.issues.push(issue);
          }
        });
        const existingDeviceIds = new Set(this._data.devices.map(d => d.id));
        data.devices.forEach(device => {
          if (!existingDeviceIds.has(device.id)) {
            this._data.devices.push(device);
          }
        });
        const existingKnowIds = new Set(this._data.knowledge.map(k => k.id));
        data.knowledge.forEach(k => {
          if (!existingKnowIds.has(k.id)) {
            this._data.knowledge.push(k);
          }
        });
        const existingCatIds = new Set(this._data.categories.map(c => c.id));
        (data.categories || []).forEach(c => {
          if (!existingCatIds.has(c.id)) {
            this._data.categories.push(c);
          }
        });
      } else {
        this._data = data;
      }
      this.save();
      return true;
    } catch (e) {
      console.error('Import failed', e);
      throw e;
    }
  },

  resetToDemo() {
    this._data = JSON.parse(JSON.stringify(DEMO_DATA));
    this.save();
  },

  getAllTags() {
    const tags = new Set();
    this._data.knowledge.forEach(k => {
      (k.tags || []).forEach(t => tags.add(t));
    });
    this._data.issues.forEach(i => {
      (i.tags || []).forEach(t => tags.add(t));
    });
    return Array.from(tags);
  },

  searchIssues(keyword) {
    if (!keyword) return this._data.issues;
    const kw = keyword.toLowerCase();
    return this._data.issues.filter(i =>
      i.title.toLowerCase().includes(kw) ||
      (i.description && i.description.toLowerCase().includes(kw)) ||
      i.device.toLowerCase().includes(kw) ||
      i.id.toLowerCase().includes(kw) ||
      (i.tags || []).some(t => t.toLowerCase().includes(kw))
    );
  },

  searchDevices(keyword) {
    if (!keyword) return this._data.devices;
    const kw = keyword.toLowerCase();
    return this._data.devices.filter(d =>
      d.name.toLowerCase().includes(kw) ||
      d.model.toLowerCase().includes(kw) ||
      d.type.toLowerCase().includes(kw) ||
      d.id.toLowerCase().includes(kw) ||
      (d.note && d.note.toLowerCase().includes(kw))
    );
  },

  searchKnowledge(keyword) {
    if (!keyword) return this._data.knowledge;
    const kw = keyword.toLowerCase();
    return this._data.knowledge.filter(k =>
      k.title.toLowerCase().includes(kw) ||
      (k.content && k.content.toLowerCase().includes(kw)) ||
      (k.tags || []).some(t => t.toLowerCase().includes(kw)) ||
      k.id.toLowerCase().includes(kw)
    );
  }
};