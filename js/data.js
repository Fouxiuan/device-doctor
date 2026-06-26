const DEMO_DATA = {
    issues: [
        {
            id: "ISS-20260622-001",
            deviceId: "A-1023",
            title: "温度传感器漂移",
            description: "设备运行 2 小时后温度读数偏差超过 5°C，怀疑传感器校准偏移",
            stage: "detecting",
            assignee: "张三",
            tags: ["温度传感器", "校准"],
            createdAt: "2026-06-22T09:00:00",
            updatedAt: "2026-06-22T14:30:00",
            knowledgeId: "KNW-001"
        },
        {
            id: "ISS-20260622-002",
            deviceId: "B-2048",
            title: "电压波动异常",
            description: "电池模式下电压波动范围超过 ±0.5V，影响测量精度",
            stage: "verifying",
            assignee: "李四",
            tags: ["电源", "电压异常"],
            createdAt: "2026-06-22T10:15:00",
            updatedAt: "2026-06-22T10:15:00",
            knowledgeId: null
        },
        {
            id: "ISS-20260621-003",
            deviceId: "A-1056",
            title: "固件升级后连接中断",
            description: "升级至 v2.3.1 固件后，蓝牙连接频繁中断，平均每 15 分钟断开一次",
            stage: "verifying",
            assignee: "王五",
            tags: ["固件问题", "蓝牙"],
            createdAt: "2026-06-21T16:00:00",
            updatedAt: "2026-06-22T08:00:00",
            knowledgeId: "KNW-003"
        },
        {
            id: "ISS-20260621-004",
            deviceId: "C-3001",
            title: "屏幕显示残影",
            description: "长时间显示静态画面后切换界面，原画面有残影残留，约 30 秒后消失",
            stage: "normal",
            assignee: "张三",
            tags: ["显示", "屏幕"],
            createdAt: "2026-06-20T11:00:00",
            updatedAt: "2026-06-21T15:00:00",
            knowledgeId: null
        },
        {
            id: "ISS-20260620-005",
            deviceId: "A-1089",
            title: "心率数据不准",
            description: "静止状态下心率测量值与医用设备对比偏差超过 10bpm，运动时偏差更大",
            stage: "danger",
            assignee: "赵六",
            tags: ["光学传感器", "心率"],
            createdAt: "2026-06-19T14:00:00",
            updatedAt: "2026-06-20T10:00:00",
            knowledgeId: "KNW-002"
        },
        {
            id: "ISS-20260620-006",
            deviceId: "B-2076",
            title: "充电接口松动",
            description: "磁吸充电接口吸力减弱，触碰容易断开，影响充电稳定性",
            stage: "wearing",
            assignee: "李四",
            tags: ["充电", "硬件"],
            createdAt: "2026-06-18T09:00:00",
            updatedAt: "2026-06-20T16:00:00",
            knowledgeId: "KNW-004"
        },
        {
            id: "ISS-20260619-007",
            deviceId: "D-4012",
            title: "GPS 定位漂移",
            description: "户外跑步模式下 GPS 轨迹偏移严重，距离误差超过 10%",
            stage: "detecting",
            assignee: "王五",
            tags: ["GPS", "定位"],
            createdAt: "2026-06-18T10:00:00",
            updatedAt: "2026-06-19T14:00:00",
            knowledgeId: "KNW-005"
        },
        {
            id: "ISS-20260618-008",
            deviceId: "A-1034",
            title: "续航时间缩短",
            description: "使用半年后电池续航从 14 天降至 7 天左右，怀疑电池老化",
            stage: "danger",
            assignee: "赵六",
            tags: ["电池", "续航"],
            createdAt: "2026-06-17T08:00:00",
            updatedAt: "2026-06-18T11:00:00",
            knowledgeId: null
        },
        {
            id: "ISS-20260617-009",
            deviceId: "B-2015",
            title: "按键无响应",
            description: "物理按键偶发无响应，需要用力按压才能触发，怀疑按键弹片疲劳",
            stage: "wearing",
            assignee: "张三",
            tags: ["按键", "硬件"],
            createdAt: "2026-06-16T13:00:00",
            updatedAt: "2026-06-17T09:00:00",
            knowledgeId: "KNW-004"
        },
        {
            id: "ISS-20260616-010",
            deviceId: "C-3056",
            title: "数据同步失败",
            description: "App 同步数据时经常卡在 80%，需要重启设备才能继续同步",
            stage: "normal",
            assignee: "李四",
            tags: ["同步", "App"],
            createdAt: "2026-06-15T15:00:00",
            updatedAt: "2026-06-16T17:00:00",
            knowledgeId: null
        }
    ],
    knowledge: [
        {
            id: "KNW-001",
            title: "温度传感器漂移 — 校准与更换流程",
            tags: ["温度传感器", "校准"],
            relatedDevices: ["A-1023", "A-1056"],
            solveCount: 8,
            status: "verified",
            content: "# 温度传感器漂移 — 校准与更换流程\n\n## 适用设备\n智能手环 Pro（A-1023、A-1056 等型号）\n\n## 校准步骤\n\n1. **进入工程模式**：长按侧键 10 秒 + 连续点击屏幕 5 次\n2. 进入传感器校准菜单 → 选择**温度传感器**\n3. **执行零点校准**：将设备置于恒温 25°C 环境中静置 30 分钟\n4. 点击「开始校准」，等待校准完成（约 2 分钟）\n5. 对比标准温度计读数，误差应 **< ±0.5°C**\n\n## 更换条件\n\n若校准后仍超差，需更换温度传感器模块。\n\n> 更换后必须重新执行校准流程。",
            author: "张三",
            createdAt: "2026-06-15",
            likes: 12,
            comments: 3
        },
        {
            id: "KNW-002",
            title: "光学心率传感器精度调试指南",
            tags: ["光学传感器", "心率"],
            relatedDevices: ["A-1089", "A-1102"],
            solveCount: 5,
            status: "pending",
            content: "# 光学心率传感器精度调试指南\n\n## 快速排查\n\n- 检查传感器窗口是否有**污渍或划痕**，清洁后重新测试\n- 确认佩戴位置：**腕骨上方两指处**，贴合皮肤但不过紧\n\n## 进阶调试\n\n1. 进入工程模式查看原始 **PPG 信号质量**\n2. 调整 LED 电流档位，从低到高逐档测试\n3. 若信号质量仍差，考虑更换传感器模组\n\n## 更换后验证\n\n更换后需进行 **24 小时稳定性测试**。",
            author: "赵六",
            createdAt: "2026-06-10",
            likes: 8,
            comments: 5
        },
        {
            id: "KNW-003",
            title: "蓝牙连接频繁中断排查步骤",
            tags: ["固件问题", "蓝牙"],
            relatedDevices: ["A-1056", "B-2048"],
            solveCount: 15,
            status: "verified",
            content: "# 蓝牙连接频繁中断排查步骤\n\n## 基础排查（先做）\n\n1. 确认手机系统版本和 App 版本是否兼容\n2. 清除 App 蓝牙缓存，**重新配对**设备\n3. 检查设备蓝牙 MAC 地址是否正常\n\n## 日志分析\n\n进入工程模式查看蓝牙日志，定位断开原因：\n\n- 若为**固件问题**，尝试降级到上一个稳定版本\n- 若为**硬件问题**，确认天线接触良好\n\n## 上报研发\n\n以上均无效则记录日志提交研发分析。",
            author: "王五",
            createdAt: "2026-06-08",
            likes: 20,
            comments: 7
        },
        {
            id: "KNW-004",
            title: "磁吸接口与按键维修操作规范",
            tags: ["充电", "硬件", "按键"],
            relatedDevices: ["B-2076", "B-2015"],
            solveCount: 12,
            status: "verified",
            content: "# 磁吸接口与按键维修操作规范\n\n## 一、磁吸接口维修\n\n1. 检查磁吸触点是否**氧化**，用酒精棉片清洁\n2. 测量磁吸吸力，正常应 **> 5N**\n3. 若吸力不足，更换磁吸模组\n4. 重新焊接时注意温度控制在 **280°C** 以内\n\n## 二、按键维修\n\n1. 拆开后盖，取出按键板\n2. 检查弹片是否**变形或氧化**\n3. 轻微变形可尝试矫正，严重则更换\n4. 组装后测试按键手感和触发力",
            author: "李四",
            createdAt: "2026-06-05",
            likes: 15,
            comments: 2
        },
        {
            id: "KNW-005",
            title: "GPS 定位偏移常见原因与优化",
            tags: ["GPS", "定位"],
            relatedDevices: ["D-4012"],
            solveCount: 6,
            status: "high-risk",
            content: "# GPS 定位偏移常见原因与优化\n\n> ⚠️ **注意**：GPS 相关操作涉及射频调试，需在专业指导下进行\n\n## 常见原因排查\n\n1. 确认测试环境是否**开阔**，有无高楼或树木遮挡\n2. 检查 GPS 天线接触是否良好\n3. 查看星历数据是否更新，可手动触发 **AGPS 下载**\n4. 检查固件中 GPS 配置参数是否正确\n5. 尝试切换 GPS 模式：\n   - GPS\n   - GPS+GLONASS\n   - GPS+北斗\n\n## 硬件更换\n\n若硬件故障需更换 GPS 模块，更换后需**重新校准**。",
            author: "王五",
            createdAt: "2026-06-12",
            likes: 4,
            comments: 8
        }
    ],
    knowledgeCategories: [
        {
            id: "cat-sensor",
            name: "传感器类",
            expanded: true,
            documents: ["KNW-001", "KNW-002"]
        },
        {
            id: "cat-connect",
            name: "连接与通信",
            expanded: true,
            documents: ["KNW-003", "KNW-005"]
        },
        {
            id: "cat-hardware",
            name: "硬件维修",
            expanded: true,
            documents: ["KNW-004"]
        }
    ],
    tags: [
        "温度传感器",
        "校准",
        "电源",
        "电压异常",
        "固件问题",
        "蓝牙",
        "显示",
        "屏幕",
        "光学传感器",
        "心率",
        "充电",
        "硬件",
        "GPS",
        "定位",
        "电池",
        "续航",
        "按键",
        "同步",
        "App"
    ],
    devices: [
        {
            id: "DEV-001",
            deviceId: "A-1023",
            name: "智能手环 Pro",
            model: "SH-Pro-2026",
            type: "穿戴设备",
            productionDatetime: "2026-01-15T08:30",
            status: "active",
            remark: "首批测试样机，搭载温度传感器 v2.0"
        },
        {
            id: "DEV-002",
            deviceId: "B-2048",
            name: "健康监测手表",
            model: "HW-Watch-X1",
            type: "穿戴设备",
            productionDatetime: "2026-02-20T14:15",
            status: "active",
            remark: "长续航版本，支持血氧监测"
        },
        {
            id: "DEV-003",
            deviceId: "A-1056",
            name: "智能手环 Pro",
            model: "SH-Pro-2026",
            type: "穿戴设备",
            productionDatetime: "2026-01-15T09:45",
            status: "active",
            remark: "第二批量产机，固件版本 v2.3.1"
        },
        {
            id: "DEV-004",
            deviceId: "C-3001",
            name: "智能眼镜 Air",
            model: "GL-Air-01",
            type: "AR设备",
            productionDatetime: "2026-03-10T11:20",
            status: "active",
            remark: "MicroLED 显示屏，支持心率投影"
        },
        {
            id: "DEV-005",
            deviceId: "A-1089",
            name: "智能手环 Pro",
            model: "SH-Pro-2026",
            type: "穿戴设备",
            productionDatetime: "2026-01-20T16:00",
            status: "maintenance",
            remark: "光学传感器待校准，已返厂维修"
        },
        {
            id: "DEV-006",
            deviceId: "B-2076",
            name: "健康监测手表",
            model: "HW-Watch-X1",
            type: "穿戴设备",
            productionDatetime: "2026-02-28T10:30",
            status: "active",
            remark: "磁吸充电接口，支持 ECG"
        },
        {
            id: "DEV-007",
            deviceId: "D-4012",
            name: "运动手环 Sport",
            model: "SH-Sport-G1",
            type: "穿戴设备",
            productionDatetime: "2026-04-05T13:45",
            status: "active",
            remark: "专业运动款，双频 GPS + 北斗"
        },
        {
            id: "DEV-008",
            deviceId: "A-1034",
            name: "智能手环 Pro",
            model: "SH-Pro-2026",
            type: "穿戴设备",
            productionDatetime: "2026-01-18T15:10",
            status: "retired",
            remark: "电池老化，已退役用作备件"
        },
        {
            id: "DEV-009",
            deviceId: "B-2015",
            name: "健康监测手表",
            model: "HW-Watch-X1",
            type: "穿戴设备",
            productionDatetime: "2026-02-10T09:00",
            status: "active",
            remark: "工程测试版，物理按键款"
        },
        {
            id: "DEV-010",
            deviceId: "C-3056",
            name: "智能眼镜 Air",
            model: "GL-Air-01",
            type: "AR设备",
            productionDatetime: "2026-03-15T14:30",
            status: "active",
            remark: "开发者版本，支持自定义 App"
        }
    ],
    deviceTypes: [
        "穿戴设备",
        "AR设备",
        "便携医疗设备",
        "环境传感器",
        "其他"
    ],
    settings: {
        theme: "light",
        lastExport: null
    }
};

const STAGES = {
    verifying: { label: "数据校对", color: "verifying" },
    detecting: { label: "检测中", color: "detecting" },
    normal: { label: "判定正常", color: "normal" },
    danger: { label: "判定危险", color: "danger" },
    wearing: { label: "穿戴测试", color: "wearing" }
};

const ASSIGNEES = [
    "张三",
    "李四",
    "王五",
    "赵六",
    "孙七",
    "周八"
];
