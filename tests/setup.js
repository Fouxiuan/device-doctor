// 测试环境：mock localStorage 并通过 vm 沙箱加载 store.js / data.js
const vm = require('vm');
const fs = require('fs');
const path = require('path');

function createMockLocalStorage() {
    let store = {};
    return {
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
        },
        setItem(key, value) {
            store[key] = String(value);
        },
        removeItem(key) {
            delete store[key];
        },
        clear() {
            store = {};
        },
        get _store() {
            return store;
        }
    };
}

function loadStore() {
    const rootDir = path.resolve(__dirname, '..');
    const dataCode = fs.readFileSync(path.join(rootDir, 'js', 'data.js'), 'utf8');
    const storeCode = fs.readFileSync(path.join(rootDir, 'js', 'store.js'), 'utf8');

    const sandbox = {
        localStorage: createMockLocalStorage(),
        console,
        Date,
        Math,
        JSON,
        parseInt,
        isNaN
    };
    // 让顶层 const/var 声明挂到 sandbox，方便测试访问
    sandbox.globalThis = sandbox;
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    // 追加导出语句，把 const 声明挂到 sandbox 全局
    vm.runInContext(dataCode + '\nglobalThis.DEMO_DATA = DEMO_DATA;', sandbox);
    vm.runInContext(storeCode + '\nglobalThis.Store = Store;', sandbox);

    return {
        Store: sandbox.Store,
        DEMO_DATA: sandbox.DEMO_DATA,
        localStorage: sandbox.localStorage
    };
}

module.exports = { loadStore };
