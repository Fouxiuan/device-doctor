const Store = (function() {
    const STORAGE_KEY = 'device-doctor-data';

    function getDefaultData() {
        return {
            issues: [],
            knowledge: [],
            knowledgeCategories: [],
            tags: [],
            devices: [],
            deviceTypes: [],
            settings: {
                theme: 'light',
                lastExport: null
            }
        };
    }

    function getAll() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return initWithDemoData();
            }
            const data = JSON.parse(raw);
            const defaultData = getDefaultData();
            const merged = { ...defaultData, ...data };
            
            if (!merged.deviceTypes || merged.deviceTypes.length === 0) {
                merged.deviceTypes = DEMO_DATA.deviceTypes || [];
            }
            
            if (merged.devices && Array.isArray(merged.devices)) {
                let migrated = false;
                merged.devices = merged.devices.map(d => {
                    if (d.purchaseDate !== undefined && d.productionDatetime === undefined) {
                        migrated = true;
                        return { ...d, productionDatetime: d.purchaseDate };
                    }
                    return d;
                });
                if (migrated) {
                    saveAll(merged);
                }
            }
            
            if ((!merged.knowledgeCategories || merged.knowledgeCategories.length === 0) 
                && merged.knowledge && merged.knowledge.length > 0) {
                merged.knowledgeCategories = [
                    {
                        id: 'cat-default',
                        name: '全部文档',
                        expanded: true,
                        documents: merged.knowledge.map(k => k.id)
                    }
                ];
                saveAll(merged);
            }
            
            return merged;
        } catch (e) {
            console.error('Failed to load data from localStorage:', e);
            return initWithDemoData();
        }
    }

    function saveAll(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save data to localStorage:', e);
            return false;
        }
    }

    function initWithDemoData() {
        const demoData = JSON.parse(JSON.stringify(DEMO_DATA));
        saveAll(demoData);
        return demoData;
    }

    function resetWithDemoData() {
        return initWithDemoData();
    }

    function getIssues() {
        return getAll().issues;
    }

    function getIssueById(id) {
        return getAll().issues.find(i => i.id === id) || null;
    }

    function addIssue(issue) {
        const data = getAll();
        if (!issue.id) {
            issue.id = generateIssueId();
        }
        if (!issue.createdAt) {
            issue.createdAt = new Date().toISOString();
        }
        issue.updatedAt = new Date().toISOString();
        data.issues.unshift(issue);
        updateTagsFromIssue(data, issue);
        saveAll(data);
        return issue;
    }

    function updateIssue(id, updates) {
        const data = getAll();
        const index = data.issues.findIndex(i => i.id === id);
        if (index === -1) return null;
        
        data.issues[index] = { ...data.issues[index], ...updates, updatedAt: new Date().toISOString() };
        
        if (updates.tags) {
            updateTagsFromIssue(data, data.issues[index]);
        }
        
        saveAll(data);
        return data.issues[index];
    }

    function updateIssueStage(id, stage) {
        return updateIssue(id, { stage });
    }

    function deleteIssue(id) {
        const data = getAll();
        data.issues = data.issues.filter(i => i.id !== id);
        saveAll(data);
        return true;
    }

    function getKnowledge() {
        return getAll().knowledge;
    }

    function getKnowledgeById(id) {
        return getAll().knowledge.find(k => k.id === id) || null;
    }

    function addKnowledge(item) {
        const data = getAll();
        if (!item.id) {
            item.id = generateKnowledgeId();
        }
        if (!item.createdAt) {
            item.createdAt = new Date().toISOString().split('T')[0];
        }
        if (item.solveCount === undefined) {
            item.solveCount = 0;
        }
        if (item.likes === undefined) {
            item.likes = 0;
        }
        if (item.comments === undefined) {
            item.comments = 0;
        }
        if (!item.relatedDevices) {
            item.relatedDevices = [];
        }
        data.knowledge.unshift(item);
        
        if (item.tags) {
            item.tags.forEach(tag => {
                if (!data.tags.includes(tag)) {
                    data.tags.push(tag);
                }
            });
        }
        
        saveAll(data);
        return item;
    }

    function updateKnowledge(id, updates) {
        const data = getAll();
        const index = data.knowledge.findIndex(k => k.id === id);
        if (index === -1) return null;
        
        data.knowledge[index] = { ...data.knowledge[index], ...updates };
        saveAll(data);
        return data.knowledge[index];
    }

    function incrementKnowledgeSolve(id) {
        const data = getAll();
        const item = data.knowledge.find(k => k.id === id);
        if (item) {
            item.solveCount += 1;
            saveAll(data);
        }
        return item;
    }

    function likeKnowledge(id) {
        const data = getAll();
        const item = data.knowledge.find(k => k.id === id);
        if (item) {
            item.likes += 1;
            saveAll(data);
        }
        return item;
    }

    function getKnowledgeCategories() {
        return getAll().knowledgeCategories || [];
    }

    function getCategoryById(id) {
        return getAll().knowledgeCategories?.find(c => c.id === id) || null;
    }

    function addCategory(name) {
        const data = getAll();
        if (!data.knowledgeCategories) data.knowledgeCategories = [];
        
        const cat = {
            id: 'cat-' + Date.now(),
            name: name || '新分类',
            expanded: true,
            documents: []
        };
        data.knowledgeCategories.push(cat);
        saveAll(data);
        return cat;
    }

    function updateCategory(id, updates) {
        const data = getAll();
        if (!data.knowledgeCategories) return null;
        
        const index = data.knowledgeCategories.findIndex(c => c.id === id);
        if (index === -1) return null;
        
        data.knowledgeCategories[index] = { ...data.knowledgeCategories[index], ...updates };
        saveAll(data);
        return data.knowledgeCategories[index];
    }

    function deleteCategory(id) {
        const data = getAll();
        if (!data.knowledgeCategories) return false;
        
        data.knowledgeCategories = data.knowledgeCategories.filter(c => c.id !== id);
        saveAll(data);
        return true;
    }

    function addDocumentToCategory(categoryId, docId) {
        const data = getAll();
        const cat = data.knowledgeCategories?.find(c => c.id === categoryId);
        if (!cat) return false;
        
        if (!cat.documents) cat.documents = [];
        if (!cat.documents.includes(docId)) {
            cat.documents.push(docId);
            saveAll(data);
        }
        return true;
    }

    function removeDocumentFromCategory(categoryId, docId) {
        const data = getAll();
        const cat = data.knowledgeCategories?.find(c => c.id === categoryId);
        if (!cat || !cat.documents) return false;
        
        cat.documents = cat.documents.filter(id => id !== docId);
        saveAll(data);
        return true;
    }

    function deleteKnowledge(id) {
        const data = getAll();
        data.knowledge = data.knowledge.filter(k => k.id !== id);
        
        if (data.knowledgeCategories) {
            data.knowledgeCategories.forEach(cat => {
                if (cat.documents) {
                    cat.documents = cat.documents.filter(did => did !== id);
                }
            });
        }
        saveAll(data);
        return true;
    }

    function getTags() {
        return getAll().tags;
    }

    function addTag(tag) {
        const data = getAll();
        if (!data.tags.includes(tag)) {
            data.tags.push(tag);
            saveAll(data);
        }
        return data.tags;
    }

    function updateTagsFromIssue(data, issue) {
        if (issue.tags && issue.tags.length > 0) {
            issue.tags.forEach(tag => {
                if (!data.tags.includes(tag)) {
                    data.tags.push(tag);
                }
            });
        }
    }

    function generateIssueId() {
        const now = new Date();
        const dateStr = now.getFullYear().toString() + 
            (now.getMonth() + 1).toString().padStart(2, '0') + 
            now.getDate().toString().padStart(2, '0');
        const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ISS-${dateStr}-${rand}`;
    }

    function generateKnowledgeId() {
        const data = getAll();
        const num = data.knowledge.length + 1;
        return `KNW-${num.toString().padStart(3, '0')}`;
    }

    function exportToJSON() {
        const data = getAll();
        data.settings.lastExport = new Date().toISOString();
        saveAll(data);
        
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const now = new Date();
        const dateStr = now.getFullYear().toString() + 
            (now.getMonth() + 1).toString().padStart(2, '0') + 
            now.getDate().toString().padStart(2, '0');
        const filename = `device-doctor-backup-${dateStr}.json`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return filename;
    }

    function importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (!importedData.issues || !importedData.knowledge || !importedData.tags) {
                        reject(new Error('无效的数据格式：缺少必要字段'));
                        return;
                    }
                    
                    const currentData = getAll();
                    const mergedData = {
                        issues: mergeArrays(currentData.issues, importedData.issues, 'id'),
                        knowledge: mergeArrays(currentData.knowledge, importedData.knowledge, 'id'),
                        tags: [...new Set([...currentData.tags, ...importedData.tags])],
                        settings: { ...currentData.settings, ...importedData.settings }
                    };
                    
                    saveAll(mergedData);
                    resolve(mergedData);
                } catch (err) {
                    reject(new Error('JSON 解析失败：' + err.message));
                }
            };
            reader.onerror = function() {
                reject(new Error('文件读取失败'));
            };
            reader.readAsText(file);
        });
    }

    function mergeArrays(current, imported, key) {
        const map = new Map();
        current.forEach(item => map.set(item[key], item));
        imported.forEach(item => map.set(item[key], item));
        return Array.from(map.values());
    }

    function findSimilarKnowledge(issue) {
        const knowledge = getKnowledge();
        if (!issue.tags || issue.tags.length === 0) return [];
        
        const scored = knowledge.map(k => {
            let score = 0;
            if (k.tags) {
                issue.tags.forEach(tag => {
                    if (k.tags.includes(tag)) score += 10;
                });
            }
            if (k.title && issue.title) {
                const titleLower = k.title.toLowerCase();
                const issueLower = issue.title.toLowerCase();
                if (titleLower.includes(issueLower) || issueLower.includes(titleLower)) {
                    score += 20;
                }
            }
            if (k.relatedDevices && issue.deviceId) {
                if (k.relatedDevices.includes(issue.deviceId)) {
                    score += 5;
                }
            }
            return { item: k, score };
        });
        
        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(s => s.item);
    }

    function getDevices() {
        return getAll().devices || [];
    }

    function getDeviceById(id) {
        return getAll().devices?.find(d => d.id === id) || null;
    }

    function getDeviceByDeviceId(deviceId) {
        return getAll().devices?.find(d => d.deviceId === deviceId) || null;
    }

    function addDevice(device) {
        const data = getAll();
        if (!data.devices) data.devices = [];
        
        if (!device.id) {
            const maxNum = data.devices.reduce((max, d) => {
                const num = parseInt(d.id.replace('DEV-', ''), 10);
                return num > max ? num : max;
            }, 0);
            device.id = `DEV-${(maxNum + 1).toString().padStart(3, '0')}`;
        }
        if (!device.status) {
            device.status = 'active';
        }
        
        data.devices.unshift(device);
        saveAll(data);
        return device;
    }

    function updateDevice(id, updates) {
        const data = getAll();
        if (!data.devices) return null;
        
        const index = data.devices.findIndex(d => d.id === id);
        if (index === -1) return null;
        
        data.devices[index] = { ...data.devices[index], ...updates };
        saveAll(data);
        return data.devices[index];
    }

    function deleteDevice(id) {
        const data = getAll();
        if (!data.devices) return false;
        
        data.devices = data.devices.filter(d => d.id !== id);
        saveAll(data);
        return true;
    }

    function getDeviceTypes() {
        return getAll().deviceTypes || [];
    }

    function addDeviceType(type) {
        const data = getAll();
        if (!data.deviceTypes) data.deviceTypes = [];
        
        if (!data.deviceTypes.includes(type)) {
            data.deviceTypes.push(type);
            saveAll(data);
        }
        return data.deviceTypes;
    }

    function searchDevices(query) {
        const devices = getDevices();
        if (!query) return devices;
        
        const q = query.toLowerCase();
        return devices.filter(d => 
            d.deviceId?.toLowerCase().includes(q) ||
            d.name?.toLowerCase().includes(q) ||
            d.model?.toLowerCase().includes(q) ||
            d.type?.toLowerCase().includes(q) ||
            d.remark?.toLowerCase().includes(q)
        );
    }

    return {
        getAll,
        saveAll,
        getIssues,
        getIssueById,
        addIssue,
        updateIssue,
        updateIssueStage,
        deleteIssue,
        getKnowledge,
        getKnowledgeById,
        addKnowledge,
        updateKnowledge,
        deleteKnowledge,
        incrementKnowledgeSolve,
        likeKnowledge,
        getKnowledgeCategories,
        getCategoryById,
        addCategory,
        updateCategory,
        deleteCategory,
        addDocumentToCategory,
        removeDocumentFromCategory,
        getTags,
        addTag,
        exportToJSON,
        importFromJSON,
        findSimilarKnowledge,
        resetWithDemoData,
        getDevices,
        getDeviceById,
        getDeviceByDeviceId,
        addDevice,
        updateDevice,
        deleteDevice,
        getDeviceTypes,
        addDeviceType,
        searchDevices
    };
})();
