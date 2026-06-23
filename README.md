# 设备诊疗师 — 异常闭环与知识管家

> 一个基于 Web 的轻量级设备异常处理工作台，将「状态看板」与「智能知识库」深度绑定，让异常处理从「人追着问题跑」变成「数据推着人走」。

**TRAE AI 创造力大赛 · 学习工作赛道参赛作品**

---

## 项目简介

设备诊疗师是面向硬件测试工程师、设备运维人员的效率工具。核心解决三大痛点：

| 痛点 | 现状 | 解决方案 |
|------|------|----------|
| 状态靠吼 | 设备处理状态全靠口头沟通或手动改 Excel | 可视化 Kanban 看板，一屏总览所有设备阶段 |
| 找人靠翻 | 不知道异常对应谁负责，翻通讯录沟通成本高 | 异常记录直接绑定责任人，看板卡片一目了然 |
| 经验靠脑 | 历史解决经验散落在聊天记录或本地文档 | 结构化知识库，标签化归档，关键词秒级检索 |

## 功能特性

### 状态看板（Dashboard）
- 5 阶段 Kanban 看板：数据校对 → 检测中 → 判定正常 → 判定危险 → 穿戴测试
- 统计卡片实时显示各阶段设备数量，点击可筛选
- 设备卡片支持**拖拽切换状态**，包括任意方向移动（如维修后回退到检测中）
- 卡片显示设备编号、异常简述、负责人、时间、标签

### 智能知识库（Knowledge）
- 关键词模糊搜索，匹配标题、内容、标签、设备编号
- 标签筛选栏，常用异常类型一键过滤
- 知识卡片展示方案标题、关联设备、解决次数、处理步骤
- 状态标签区分方案可靠性：已验证 / 待验证 / 高风险
- 支持展开/收起查看完整处理步骤

### 新增异常弹窗（Modal）
- 设备编号输入联想（自动补全历史设备）
- 多选标签（支持自定义标签）
- 阶段选择、负责人、详细描述
- 「保存并推荐方案」可关联知识库

### 数据管理
- **LocalStorage** 主存储，日常操作实时保存
- **JSON 导入/导出**，数据持久化与团队分享
- 纯前端实现，零后端依赖，数据完全属于用户

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 结构 | HTML5 | 语义化标签 |
| 样式 | CSS3 | Flexbox/Grid 布局，CSS 变量管理主题色 |
| 逻辑 | 原生 JavaScript (ES6+) | IIFE 模块化，无框架依赖 |
| 存储 | LocalStorage + JSON | 双存储策略 |
| 交互 | HTML5 Drag and Drop API | 看板拖拽 |

## 本地部署

### 方式一：直接打开（最简单）

无需任何安装，直接用浏览器打开 `index.html` 文件即可使用。

### 方式二：本地 HTTP 服务器（推荐）

使用任意 HTTP 服务器启动项目：

```bash
# 进入项目目录
cd device-doctor

# Python 3
python3 -m http.server 8080

# Node.js (需安装 serve)
npx serve -p 8080

# VS Code
# 安装 Live Server 扩展，右键 index.html → Open with Live Server
```

然后在浏览器访问 `http://localhost:8080`。

### 方式三：TRAE IDE 中预览

1. 在 TRAE IDE 中打开项目文件夹
2. 打开 `index.html` 文件
3. 点击右上角预览按钮即可在内置浏览器中查看

## 项目结构

```
device-doctor/
├── index.html              # 主入口，路由容器
├── css/
│   ├── main.css            # 全局样式、CSS 变量、布局框架
│   ├── dashboard.css       # 看板样式（统计卡片、Kanban 列、设备卡片）
│   ├── knowledge.css       # 知识库样式（搜索框、标签、知识卡片）
│   └── modal.css           # 弹窗样式（表单、动画）
├── js/
│   ├── app.js              # 路由管理、页面初始化、全局事件
│   ├── store.js            # LocalStorage 封装、JSON 导入导出
│   ├── dashboard.js        # 看板渲染、拖拽逻辑、筛选交互
│   ├── knowledge.js        # 知识库搜索、标签过滤、卡片渲染
│   ├── modal.js            # 弹窗组件（新增/编辑异常、新增方案）
│   └── data.js             # 示例数据（Demo 演示用）
└── README.md
```

## 数据模型

### 设备异常记录 (Issue)

```javascript
{
  id: "ISS-001",
  deviceId: "A-1023",
  title: "温度传感器漂移",
  description: "设备运行 2 小时后温度读数偏差超过 5°C",
  stage: "detecting",        // verifying | detecting | normal | danger | wearing
  assignee: "张三",
  tags: ["温度传感器", "校准"],
  createdAt: "2026-06-22T09:00:00",
  updatedAt: "2026-06-22T14:30:00",
  knowledgeId: "KNW-001"     // 关联知识库方案（可选）
}
```

### 知识库方案 (Knowledge)

```javascript
{
  id: "KNW-001",
  title: "温度传感器漂移 — 校准与更换流程",
  tags: ["温度传感器", "校准"],
  relatedDevices: ["A-1023", "A-1056"],
  solveCount: 8,
  status: "verified",        // verified | pending | high-risk
  content: "1. 进入工程模式 → 2. 执行零点校准 → ...",
  author: "张三",
  createdAt: "2026-06-15",
  likes: 12,
  comments: 3
}
```

## 浏览器兼容性

- Chrome / Edge 90+
- Firefox 88+
- Safari 14+
- 移动端浏览器（响应式布局）

## 数据备份与恢复

- **导出**：点击页面顶部「导出数据」按钮，自动下载 JSON 备份文件
- **导入**：点击「导入数据」按钮，选择之前导出的 JSON 文件即可恢复
- **重置**：清除浏览器 LocalStorage 后刷新页面，将自动加载示例数据

## 后续扩展方向

- 团队协作：多用户数据同步、任务指派通知
- 知识库方案支持 Markdown 富文本编辑
- 数据可视化：异常趋势图表、责任人工作量统计
- AI 能力深化：通过 TRAE MCP 实现异常自动分类、相似案例智能推荐

## License

MIT License
