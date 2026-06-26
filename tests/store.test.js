// 知识库标签与分类功能的单元测试
const test = require('node:test');
const assert = require('node:assert');
const { loadStore } = require('./setup');

// 辅助：重置 localStorage 让下次 loadStore 走全新 demo 数据
function freshStore() {
    return loadStore();
}

// ============================================================
// Bug 1: updateKnowledge 不同步标签到全局 tags 数组
// 现象：编辑文档新增标签后，标签筛选列表里看不到新标签
// ============================================================
test('updateKnowledge 应把新标签同步到全局 tags 数组', () => {
    const { Store } = freshStore();
    const beforeTags = Store.getTags().slice();
    const newTag = '全新标签-' + Date.now();

    Store.updateKnowledge('KNW-001', { tags: ['温度传感器', newTag] });

    const afterTags = Store.getTags();
    assert.ok(
        afterTags.includes(newTag),
        `更新文档后全局 tags 应包含新标签 "${newTag}"，实际：[${afterTags.join(', ')}]`
    );
    assert.ok(
        afterTags.length >= beforeTags.length,
        '全局 tags 数量不应减少'
    );
});

// ============================================================
// Bug 2: deleteCategory 后文档变孤儿，从侧边栏消失
// 现象：删除分类时，分类内文档不再出现在任何分组
// 期望：被删分类的文档应迁移到"未分类"组
// ============================================================
test('deleteCategory 应把文档迁移到未分类组而非丢弃', () => {
    const { Store } = freshStore();
    // cat-sensor 含 KNW-001, KNW-002
    const catBefore = Store.getCategoryById('cat-sensor');
    assert.strictEqual(catBefore.documents.length, 2);

    Store.deleteCategory('cat-sensor');

    // 文档本身仍存在
    assert.ok(Store.getKnowledgeById('KNW-001'), 'KNW-001 文档本身不应被删除');
    assert.ok(Store.getKnowledgeById('KNW-002'), 'KNW-002 文档本身不应被删除');

    // 应存在一个"未分类"组容纳这些文档
    const categories = Store.getKnowledgeCategories();
    const uncat = categories.find(c => c.name === '未分类' || c.id === 'cat-uncategorized');
    assert.ok(uncat, '删除分类后应存在"未分类"组');
    assert.ok(
        uncat.documents.includes('KNW-001'),
        'KNW-001 应被迁移到未分类组'
    );
    assert.ok(
        uncat.documents.includes('KNW-002'),
        'KNW-002 应被迁移到未分类组'
    );
});

// ============================================================
// Bug 3: 缺少切换文档分类的方法
// 现象：编辑文档时无法把它从一个分类移到另一个分类
// 期望：setDocumentCategory(docId, newCategoryId) 移动文档
// ============================================================
test('setDocumentCategory 应把文档从原分类移到新分类', () => {
    const { Store } = freshStore();
    // 初始：KNW-001 在 cat-sensor
    assert.ok(
        Store.getCategoryById('cat-sensor').documents.includes('KNW-001'),
        '前置条件：KNW-001 应在 cat-sensor'
    );
    assert.ok(
        !Store.getCategoryById('cat-connect').documents.includes('KNW-001'),
        '前置条件：KNW-001 不应在 cat-connect'
    );

    const result = Store.setDocumentCategory('KNW-001', 'cat-connect');
    assert.ok(result, 'setDocumentCategory 应返回 true');

    assert.ok(
        !Store.getCategoryById('cat-sensor').documents.includes('KNW-001'),
        '移动后 KNW-001 不应仍在 cat-sensor'
    );
    assert.ok(
        Store.getCategoryById('cat-connect').documents.includes('KNW-001'),
        '移动后 KNW-001 应在 cat-connect'
    );
});

test('setDocumentCategory 目标为空时应把文档放入未分类组', () => {
    const { Store } = freshStore();
    const result = Store.setDocumentCategory('KNW-001', null);
    assert.ok(result, '应成功移到未分类');

    assert.ok(
        !Store.getCategoryById('cat-sensor').documents.includes('KNW-001'),
        '原分类不应再包含 KNW-001'
    );
    const uncat = Store.getKnowledgeCategories().find(
        c => c.id === 'cat-uncategorized' || c.name === '未分类'
    );
    assert.ok(uncat, '应存在未分类组');
    assert.ok(uncat.documents.includes('KNW-001'), 'KNW-001 应在未分类组');
});
