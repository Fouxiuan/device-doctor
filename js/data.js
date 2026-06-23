// data.js — Demo 示例数据
const DEMO_DATA = {
  tags: [
    '温度传感器', '电压异常', '固件问题', '信号干扰',
    '主板短路', '校准', '电池续航', '蓝牙连接',
    '屏幕显示', '穿戴舒适度'
  ],
  issues: [
    { id: 'ISS-001', deviceId: 'A-1023', title: '温度传感器漂移', description: '设备运行2小时后温度读数偏差超过5度，影响数据准确性', stage: 'detecting', assignee: '张三', tags: ['温度传感器', '校准'], createdAt: '2026-06-20T09:00:00', updatedAt: '2026-06-20T14:30:00', knowledgeId: 'KNW-001' },
    { id: 'ISS-002', deviceId: 'B-8841', title: '电压波动异常', description: '待机状态下电压读数不稳定，波动范围超过0.3V', stage: 'verifying', assignee: '李四', tags: ['电压异常'], createdAt: '2026-06-21T08:15:00', updatedAt: '2026-06-21T08:15:00', knowledgeId: null },
    { id: 'ISS-003', deviceId: 'C-3301', title: '蓝牙信号频繁断连', description: '与手机连接后每隔10-15分钟断开一次，需手动重连', stage: 'detecting', assignee: '王五', tags: ['蓝牙连接', '信号干扰'], createdAt: '2026-06-21T10:00:00', updatedAt: '2026-06-22T09:00:00', knowledgeId: null },
    { id: 'ISS-004', deviceId: 'D-1205', title: '固件升级后功能恢复', description: '升级至v2.3.1后传感器读数恢复正常，待穿戴测试验证', stage: 'normal', assignee: '赵六', tags: ['固件问题'], createdAt: '2026-06-19T16:00:00', updatedAt: '2026-06-22T11:00:00', knowledgeId: 'KNW-003' },
    { id: 'ISS-005', deviceId: 'E-9902', title: '主板短路风险', description: '设备充电时出现轻微烧焦味，拆机发现电容鼓包', stage: 'danger', assignee: '孙七', tags: ['主板短路', '电压异常'], createdAt: '2026-06-22T08:00:00', updatedAt: '2026-06-22T10:00:00', knowledgeId: 'KNW-004' },
    { id: 'ISS-006', deviceId: 'F-2210', title: '人体工学验证', description: '设备佩戴超过4小时后用户反馈手腕压迫感明显', stage: 'wearing', assignee: '周八', tags: ['穿戴舒适度'], createdAt: '2026-06-22T13:00:00', updatedAt: '2026-06-22T13:00:00', knowledgeId: null },
    { id: 'ISS-007', deviceId: 'A-1056', title: '温度传感器响应延迟', description: '环境温度突变时传感器响应时间超过30秒', stage: 'verifying', assignee: '张三', tags: ['温度传感器'], createdAt: '2026-06-22T14:00:00', updatedAt: '2026-06-22T14:00:00', knowledgeId: null },
    { id: 'ISS-008', deviceId: 'G-4478', title: '电池续航骤降', description: '满电状态下续航从48小时降至12小时，疑似固件导致', stage: 'detecting', assignee: '李四', tags: ['电池续航', '固件问题'], createdAt: '2026-06-22T09:30:00', updatedAt: '2026-06-22T15:00:00', knowledgeId: null },
    { id: 'ISS-009', deviceId: 'H-6632', title: '屏幕闪烁异常', description: '低亮度环境下屏幕出现不规则闪烁，高亮度正常', stage: 'normal', assignee: '王五', tags: ['屏幕显示'], createdAt: '2026-06-21T11:00:00', updatedAt: '2026-06-22T16:00:00', knowledgeId: null },
    { id: 'ISS-010', deviceId: 'I-7789', title: 'WiFi信号弱导致数据丢失', description: '设备距离路由器超过5米时数据上传失败率超过30%', stage: 'wearing', assignee: '赵六', tags: ['信号干扰'], createdAt: '2026-06-22T10:00:00', updatedAt: '2026-06-22T10:00:00', knowledgeId: null }
  ],
  knowledge: [
    { id: 'KNW-001', title: '温度传感器漂移 — 校准与更换流程', tags: ['温度传感器', '校准'], relatedDevices: ['A-1023', 'A-1056'], solveCount: 8, status: 'verified', content: '1. 进入工程模式（长按电源键10秒+双击屏幕）\n2. 执行零点校准：设置 → 维护 → 传感器校准 → 零点\n3. 对比标准温度源，记录误差值\n4. 若误差超过5度，更换传感器模块（型号：TS-200）\n5. 更换后重新校准，连续运行4小时验证稳定性', author: '张三', createdAt: '2026-06-15', likes: 12, comments: 3 },
    { id: 'KNW-002', title: '电压波动异常排查手册', tags: ['电压异常'], relatedDevices: ['B-8841', 'C-2201'], solveCount: 5, status: 'pending', content: '1. 检查电源适配器输出电压（标准5V/1A）\n2. 测量主板供电测试点（TP1, TP2）\n3. 排查电容是否鼓包或漏液\n4. 检查电池接触点是否氧化\n5. 若以上正常，更新电源管理固件', author: '李四', createdAt: '2026-06-10', likes: 8, comments: 1 },
    { id: 'KNW-003', title: '固件升级后异常恢复指南', tags: ['固件问题'], relatedDevices: ['D-1205', 'G-4478'], solveCount: 6, status: 'verified', content: '1. 确认当前固件版本（设置 → 关于 → 版本号）\n2. 下载最新稳定版固件（官网下载区）\n3. 进入恢复模式（关机后按住音量键+电源键）\n4. 通过USB连接电脑，使用升级工具刷入\n5. 升级完成后恢复出厂设置\n6. 重新配对并校准传感器', author: '赵六', createdAt: '2026-06-18', likes: 15, comments: 4 },
    { id: 'KNW-004', title: '主板短路风险 — 紧急处理预案', tags: ['主板短路', '电压异常'], relatedDevices: ['E-9902'], solveCount: 2, status: 'high-risk', content: '1. 立即断开电源，勿尝试开机\n2. 隔离设备，放置于防火区域\n3. 拍照记录电容/电路板状态\n4. 联系硬件组进行专业检测\n5. 填写异常报告，标注风险等级\n6. 若为批量问题，通知质检组排查同批次设备', author: '孙七', createdAt: '2026-06-20', likes: 15, comments: 5 },
    { id: 'KNW-005', title: '蓝牙连接稳定性优化方案', tags: ['蓝牙连接', '信号干扰'], relatedDevices: ['C-3301', 'I-7789'], solveCount: 4, status: 'pending', content: '1. 更新设备蓝牙固件至最新版本\n2. 清除手机端蓝牙缓存后重新配对\n3. 避免与2.4GHz WiFi设备同频段使用\n4. 检查设备天线是否松动或损坏\n5. 在信号干扰强的环境中使用蓝牙5.0模式', author: '王五', createdAt: '2026-06-22', likes: 6, comments: 2 }
  ]
};