const DEMO_DATA = {
  issues: [
    {
      id: 'ISS-001',
      title: '心率数据异常波动，数值忽高忽低',
      device: 'HUAWEI WATCH GT 4',
      deviceId: 'DEV-001',
      stage: 'verifying',
      assignee: '张工程师',
      assigneeInitial: '张',
      tags: ['心率', '数据异常', '传感器'],
      createdAt: '2026-06-18 10:30',
      updatedAt: '2026-06-20 14:20',
      description: '用户反馈在静息状态下心率监测数据波动过大，从60次/分钟跳到120次/分钟，持续约30秒后恢复正常。',
      knowledgeId: 'KNOW-001'
    },
    {
      id: 'ISS-002',
      title: '血氧测量值偏低，与实际情况不符',
      device: 'Apple Watch Series 9',
      deviceId: 'DEV-002',
      stage: 'detecting',
      assignee: '李工程师',
      assigneeInitial: '李',
      tags: ['血氧', '精度问题'],
      createdAt: '2026-06-19 09:15',
      updatedAt: '2026-06-21 11:00',
      description: '用户反映血氧测量值经常显示在90%以下，但在医院测量为98%，偏差较大。',
      knowledgeId: null
    },
    {
      id: 'ISS-003',
      title: '睡眠监测数据缺失，深睡时长为0',
      device: 'Xiaomi Band 8',
      deviceId: 'DEV-003',
      stage: 'normal',
      assignee: '王工程师',
      assigneeInitial: '王',
      tags: ['睡眠', '数据缺失'],
      createdAt: '2026-06-17 16:45',
      updatedAt: '2026-06-20 09:30',
      description: '连续三天睡眠监测中深睡时长显示为0，浅睡和REM数据正常。已确认是固件算法问题，新版本已修复。',
      knowledgeId: 'KNOW-002'
    },
    {
      id: 'ISS-004',
      title: '电池续航严重缩短，一天就没电',
      device: 'OPPO Watch SE',
      deviceId: 'DEV-004',
      stage: 'danger',
      assignee: '张工程师',
      assigneeInitial: '张',
      tags: ['电池', '续航', '功耗'],
      createdAt: '2026-06-20 08:00',
      updatedAt: '2026-06-22 10:15',
      description: '用户更新固件后电池续航从5天缩短到1天，GPS和心率传感器持续高功耗运行。需要立即定位问题。',
      knowledgeId: null
    },
    {
      id: 'ISS-005',
      title: 'GPS定位偏移，轨迹误差超过50米',
      device: 'Garmin Forerunner 965',
      deviceId: 'DEV-005',
      stage: 'wearing',
      assignee: '李工程师',
      assigneeInitial: '李',
      tags: ['GPS', '定位', '运动'],
      createdAt: '2026-06-21 14:30',
      updatedAt: '2026-06-22 16:00',
      description: '户外运动时GPS轨迹偏移严重，直线距离误差可达50-100米。在高楼密集区域尤为明显。',
      knowledgeId: 'KNOW-003'
    },
    {
      id: 'ISS-006',
      title: '屏幕触控失灵，部分区域无响应',
      device: 'HUAWEI WATCH GT 4',
      deviceId: 'DEV-001',
      stage: 'verifying',
      assignee: '王工程师',
      assigneeInitial: '王',
      tags: ['屏幕', '触控', '硬件'],
      createdAt: '2026-06-22 09:00',
      updatedAt: '2026-06-22 09:00',
      description: '用户反馈手表屏幕下方三分之一区域触控无响应，其余区域正常。疑似硬件问题。',
      knowledgeId: null
    },
    {
      id: 'ISS-007',
      title: '蓝牙频繁断连，消息推送延迟',
      device: 'Apple Watch Series 9',
      deviceId: 'DEV-002',
      stage: 'detecting',
      assignee: '张工程师',
      assigneeInitial: '张',
      tags: ['蓝牙', '连接', '消息推送'],
      createdAt: '2026-06-21 11:20',
      updatedAt: '2026-06-22 08:45',
      description: 'iPhone 15 Pro连接后，蓝牙每10分钟左右断连一次，重新连接需要30秒以上。',
      knowledgeId: 'KNOW-004'
    },
    {
      id: 'ISS-008',
      title: '防水性能不达标，游泳后进水',
      device: 'Xiaomi Band 8',
      deviceId: 'DEV-003',
      stage: 'danger',
      assignee: '李工程师',
      assigneeInitial: '李',
      tags: ['防水', '硬件', '质量'],
      createdAt: '2026-06-20 15:30',
      updatedAt: '2026-06-22 12:00',
      description: '标称5ATM防水，但用户游泳约30分钟后发现屏幕内有水雾，按键失灵。',
      knowledgeId: null
    },
    {
      id: 'ISS-009',
      title: 'NFC门禁卡复制失败',
      device: 'OPPO Watch SE',
      deviceId: 'DEV-004',
      stage: 'normal',
      assignee: '王工程师',
      assigneeInitial: '王',
      tags: ['NFC', '门禁卡'],
      createdAt: '2026-06-18 13:00',
      updatedAt: '2026-06-21 17:30',
      description: '用户尝试复制门禁卡时提示"不支持此卡片类型"，该卡为普通ID卡。通过固件更新增加了兼容性。',
      knowledgeId: 'KNOW-005'
    },
    {
      id: 'ISS-010',
      title: '运动模式自动识别不准',
      device: 'Garmin Forerunner 965',
      deviceId: 'DEV-005',
      stage: 'wearing',
      assignee: '张工程师',
      assigneeInitial: '张',
      tags: ['运动识别', '算法'],
      createdAt: '2026-06-22 07:45',
      updatedAt: '2026-06-22 07:45',
      description: '跑步模式经常误识别为骑行，骑行又误识别为跑步。识别准确率约60%。',
      knowledgeId: null
    }
  ],
  devices: [
    {
      id: 'DEV-001',
      name: 'HUAWEI WATCH GT 4',
      model: 'TET-B19',
      type: '智能手表',
      manufactureDate: '2024-03-15',
      status: 'active',
      note: '46mm 曜石黑，不锈钢表体'
    },
    {
      id: 'DEV-002',
      name: 'Apple Watch Series 9',
      model: 'A2982',
      type: '智能手表',
      manufactureDate: '2023-09-22',
      status: 'active',
      note: '45mm GPS版，午夜色铝金属表壳'
    },
    {
      id: 'DEV-003',
      name: 'Xiaomi Band 8',
      model: 'M2239B1',
      type: '智能手环',
      manufactureDate: '2023-04-18',
      status: 'maintenance',
      note: '标准版，黑色硅胶表带'
    },
    {
      id: 'DEV-004',
      name: 'OPPO Watch SE',
      model: 'OWW211',
      type: '智能手表',
      manufactureDate: '2022-10-08',
      status: 'active',
      note: '46mm 水墨灰，eSIM版'
    },
    {
      id: 'DEV-005',
      name: 'Garmin Forerunner 965',
      model: '010-02809-60',
      type: '运动手表',
      manufactureDate: '2023-03-02',
      status: 'active',
      note: '钛合金表圈，AMOLED屏幕'
    },
    {
      id: 'DEV-006',
      name: '荣耀手环9',
      model: 'CRE-B19',
      type: '智能手环',
      manufactureDate: '2024-05-20',
      status: 'retired',
      note: '已退役，用于测试'
    }
  ],
  knowledge: [
    {
      id: 'KNOW-001',
      title: '心率数据异常波动排查指南',
      categoryId: 'CAT-001',
      tags: ['心率', '传感器', '排查'],
      deviceIds: ['DEV-001', 'DEV-002'],
      content: '## 问题描述\n\n用户反馈心率数据出现异常波动，数值忽高忽低。\n\n## 可能原因\n\n1. **佩戴方式不正确**\n   - 表带过松或过紧\n   - 佩戴位置过高或过低\n   - 手腕有汗水或护肤品\n\n2. **环境因素**\n   - 温度剧烈变化\n   - 强光直射传感器\n   - 电磁干扰\n\n3. **传感器问题**\n   - 传感器表面脏污\n   - 硬件故障\n\n## 排查步骤\n\n### 第一步：确认佩戴方式\n\n请用户确认：\n- 表带松紧度：能插入一根手指为宜\n- 佩戴位置：腕骨以上一指宽\n- 保持手腕干燥，无护肤品残留\n\n### 第二步：清洁传感器\n\n1. 用软布沾少量清水擦拭传感器表面\n2. 确保无污渍、油脂残留\n3. 擦干后重新佩戴测试\n\n### 第三步：环境测试\n\n1. 在室内恒温环境下测试\n2. 避免阳光直射传感器\n3. 静息状态下测量5分钟，观察数据稳定性\n\n### 第四步：固件检查\n\n1. 确认设备固件为最新版本\n2. 尝试重启设备\n3. 恢复出厂设置后重新配对\n\n## 判定标准\n\n- **正常波动**：±5次/分钟以内\n- **轻微异常**：±10次/分钟，持续时间短\n- **严重异常**：±20次/分钟以上，持续出现\n\n## 解决方案\n\n| 原因 | 解决方案 | 预计解决率 |\n|------|----------|------------|\n| 佩戴问题 | 指导正确佩戴方式 | 70% |\n| 清洁问题 | 清洁传感器 | 15% |\n| 固件问题 | 更新固件/恢复出厂 | 10% |\n| 硬件故障 | 返厂维修 | 5% |',
      createdAt: '2026-05-10 14:30',
      updatedAt: '2026-06-15 09:20'
    },
    {
      id: 'KNOW-002',
      title: '睡眠监测深睡时长为零解决方案',
      categoryId: 'CAT-001',
      tags: ['睡眠', '算法', '固件'],
      deviceIds: ['DEV-003'],
      content: '## 问题现象\n\n睡眠监测报告中深睡时长显示为0分钟，浅睡和REM数据正常。\n\n## 根本原因\n\n经过分析，该问题由以下原因导致：\n\n1. **算法阈值设置过高**：深睡判定阈值设置过于严格，导致部分深睡阶段被误判为浅睡\n2. **体动检测过于敏感**：轻微体动就被判定为浅睡状态\n3. **心率变异性(HRV)计算偏差**：HRV数据不稳定影响深睡判定\n\n## 解决方案\n\n### 固件更新\n\n最新固件版本已优化深睡检测算法：\n- 降低深睡判定阈值\n- 优化体动检测灵敏度\n- 改进HRV计算稳定性\n\n**固件版本要求**：V2.3.5及以上\n\n### 用户侧操作\n\n1. 更新设备固件到最新版本\n2. 重启设备\n3. 连续佩戴3-5晚，观察数据是否恢复正常\n\n## 验证方法\n\n更新固件后，建议用户：\n1. 保证连续7小时以上睡眠\n2. 佩戴松紧适度\n3. 连续监测3晚以上\n4. 深睡占比应在15%-25%之间为正常',
      createdAt: '2026-04-20 11:00',
      updatedAt: '2026-06-18 16:45'
    },
    {
      id: 'KNOW-003',
      title: 'GPS定位误差问题排查手册',
      categoryId: 'CAT-002',
      tags: ['GPS', '定位', '运动'],
      deviceIds: ['DEV-005', 'DEV-001'],
      content: '## 问题描述\n\n户外运动时GPS轨迹偏移，直线距离误差大。\n\n## 影响因素分析\n\n### 环境因素（最常见）\n\n| 环境类型 | 误差范围 | 占比 |\n|----------|----------|------|\n| 开阔地带（操场、公园） | 5-10米 | 10% |\n| 城市街道（有高楼） | 20-50米 | 60% |\n| 树林密集区域 | 30-80米 | 20% |\n| 室内/地下 | 完全失效 | 10% |\n\n### 设备因素\n\n1. GPS天线性能\n2. 固件算法版本\n3. 多星系统支持\n\n## 优化建议\n\n### 运动前准备\n\n1. **提前定位**：开始运动前在开阔处等待2-3分钟，让GPS完成搜星\n2. **检查卫星数量**：确保连接卫星数在8颗以上\n3. **更新星历数据**：定期同步星历，加快定位速度\n\n### 运动中注意\n\n1. 尽量在开阔区域运动\n2. 高楼附近适当放慢配速\n3. 避免将设备遮挡在衣物内\n\n### 数据校准\n\n1. 使用跑步机模式时手动校准距离\n2. 可通过第三方软件修正轨迹\n3. 多运动几次后算法会自动学习优化\n\n## 何时考虑硬件问题\n\n如果出现以下情况，可能是硬件故障：\n- 开阔地带持续定位失败\n- 卫星数量始终少于4颗\n- 定位时间超过10分钟\n- 完全无法搜到卫星信号',
      createdAt: '2026-03-15 09:30',
      updatedAt: '2026-06-20 14:10'
    },
    {
      id: 'KNOW-004',
      title: '蓝牙断连问题通用排查流程',
      categoryId: 'CAT-003',
      tags: ['蓝牙', '连接', '兼容性'],
      deviceIds: ['DEV-002', 'DEV-004'],
      content: '## 问题现象\n\n手表与手机蓝牙频繁断连，消息推送不及时。\n\n## 排查步骤\n\n### 第一步：基础检查\n\n- [ ] 确认手机蓝牙已开启\n- [ ] 确认设备电量充足\n- [ ] 确认设备未连接其他手机\n- [ ] 确认手机系统为最新版本\n\n### 第二步：常见原因及解决方案\n\n#### 1. 系统后台限制\n\n**现象**：锁屏后几分钟断连\n\n**解决方法**：\n- iOS：设置 → 通用 → 后台App刷新 → 确保对应App已开启\n- Android：设置 → 电池 → 将对应App设为「无限制」\n\n#### 2. 蓝牙缓存问题\n\n**现象**：连接不稳定，时断时续\n\n**解决方法**：\n1. 手机系统设置中忽略此设备\n2. 重启手机蓝牙\n3. 重新配对连接\n\n#### 3. 距离与遮挡\n\n**现象**：特定位置断连\n\n**解决方法**：\n- 确保手机和手表距离在10米以内\n- 避免中间有金属物体遮挡\n- 避免电磁干扰源（微波炉、路由器等）\n\n#### 4. App版本问题\n\n**现象**：更新App后开始断连\n\n**解决方法**：\n- 更新到最新版本App\n- 或回退到上一个稳定版本\n\n### 第三步：高级排查\n\n如果以上方法都无效：\n\n1. 尝试连接其他手机，判断是否为设备问题\n2. 恢复设备出厂设置后重新配对\n3. 收集蓝牙日志提交技术支持\n\n## 正常连接标准\n\n- **连接距离**：空旷环境10米以上\n- **重连时间**：30秒内自动重连\n- **日断连次数**：少于2次为正常',
      createdAt: '2026-05-28 16:00',
      updatedAt: '2026-06-19 10:30'
    },
    {
      id: 'KNOW-005',
      title: 'NFC门禁卡兼容性说明',
      categoryId: 'CAT-003',
      tags: ['NFC', '门禁卡', '兼容性'],
      deviceIds: ['DEV-004'],
      content: '## 支持的卡片类型\n\n### 支持复制\n\n- 未加密的ID卡（125KHz）\n- 未加密的IC卡（13.56MHz）\n- 部分加密IC卡（需知道密码）\n- 第3代、第5代门禁卡\n\n### 不支持复制\n\n- CPU卡（带操作系统）\n- 银行卡、交通卡等金融卡片\n- 有特殊加密协议的门禁卡\n- 身份证、护照等证件\n\n## 常见问题\n\n### Q: 提示"不支持此卡片类型"怎么办？\n\nA: 可能是以下原因：\n1. 卡片是CPU卡，目前不支持复制\n2. 卡片加密方式特殊\n3. 卡片频率不在支持范围内\n\n建议：联系物业确认卡片类型，或使用手机NFC工具检测。\n\n### Q: 复制成功但开不了门？\n\nA: 可能原因：\n1. 复制时信号不好，数据不完整\n2. 门禁系统有防复制机制\n3. 卡片有滚动码验证\n\n解决方法：重新复制一次，确保复制过程中不要移动卡片。\n\n### Q: 能开单元门但开不了电梯？\n\nA: 这是因为单元门和电梯使用了不同的门禁系统，需要分别添加两张卡。\n\n## 固件更新日志\n\n### V2.2.0 更新\n- 新增对第5代门禁卡的支持\n- 优化ID卡复制成功率\n- 修复部分卡片识别失败问题',
      createdAt: '2026-04-05 13:20',
      updatedAt: '2026-06-16 15:40'
    },
    {
      id: 'KNOW-006',
      title: '电池续航异常排查指南',
      categoryId: 'CAT-002',
      tags: ['电池', '续航', '功耗'],
      deviceIds: ['DEV-001', 'DEV-002', 'DEV-003', 'DEV-004', 'DEV-005'],
      content: '## 正常续航参考\n\n| 设备类型 | 正常续航 | 待机续航 |\n|----------|----------|----------|\n| 智能手表 | 7-14天 | 30天以上 |\n| 运动手表 | 10-20天 | 40天以上 |\n| 智能手环 | 14-30天 | 60天以上 |\n\n## 续航缩短常见原因\n\n### 1. 传感器持续工作\n\n- 心率常亮模式\n- 血氧持续监测\n- GPS后台运行\n\n### 2. 系统设置\n\n- 屏幕亮度太高\n- 亮屏时间过长\n- 通知过多\n- 振动强度大\n\n### 3. 固件问题\n\n- 新版固件有功耗bug\n- 后台进程异常\n- 传感器校准失败\n\n### 4. 电池老化\n\n- 使用超过2年\n- 循环充电次数过多\n- 长期高温环境使用\n\n## 排查步骤\n\n1. 检查电池使用详情，确认哪些功能耗电最多\n2. 降低屏幕亮度，缩短亮屏时间\n3. 关闭不常用的传感器持续监测\n4. 减少不必要的通知推送\n5. 重启设备观察是否恢复\n6. 如刚更新固件，可能是优化期，使用3-5天后会恢复\n\n## 何时需要维修\n\n如果出现以下情况，可能是电池故障：\n- 续航突然降到正常的一半以下\n- 电量显示跳变（比如从50%直接到20%）\n- 充电速度明显变慢\n- 设备使用超过2年',
      createdAt: '2026-02-10 10:00',
      updatedAt: '2026-06-21 09:15'
    }
  ],
  categories: [
    {
      id: 'CAT-001',
      name: '健康监测',
      icon: 'heart',
      order: 1
    },
    {
      id: 'CAT-002',
      name: '运动定位',
      icon: 'run',
      order: 2
    },
    {
      id: 'CAT-003',
      name: '连接通信',
      icon: 'bluetooth',
      order: 3
    },
    {
      id: 'CAT-004',
      name: '硬件故障',
      icon: 'wrench',
      order: 4
    }
  ],
  settings: {
    aiEnabled: false,
    aiApiKey: '',
    aiModel: 'doubao-pro-32k',
    firstVisit: true
  }
};

const STAGE_CONFIG = {
  verifying: {
    label: '数据校对',
    color: 'var(--stage-verifying)',
    bgColor: 'var(--stage-verifying-bg)',
    dotClass: 'dot-verifying',
    cardClass: 'stage-verifying'
  },
  detecting: {
    label: '检测中',
    color: 'var(--stage-detecting)',
    bgColor: 'var(--stage-detecting-bg)',
    dotClass: 'dot-detecting',
    cardClass: 'stage-detecting'
  },
  normal: {
    label: '判定正常',
    color: 'var(--stage-normal)',
    bgColor: 'var(--stage-normal-bg)',
    dotClass: 'dot-normal',
    cardClass: 'stage-normal'
  },
  danger: {
    label: '判定危险',
    color: 'var(--stage-danger)',
    bgColor: 'var(--stage-danger-bg)',
    dotClass: 'dot-danger',
    cardClass: 'stage-danger'
  },
  wearing: {
    label: '穿戴测试',
    color: 'var(--stage-wearing)',
    bgColor: 'var(--stage-wearing-bg)',
    dotClass: 'dot-wearing',
    cardClass: 'stage-wearing'
  }
};

const STAGE_ORDER = ['verifying', 'detecting', 'normal', 'danger', 'wearing'];

const ASSIGNEES = [
  { name: '张工程师', initial: '张' },
  { name: '李工程师', initial: '李' },
  { name: '王工程师', initial: '王' },
  { name: '赵工程师', initial: '赵' },
  { name: '刘工程师', initial: '刘' }
];

const DEVICE_TYPES = ['智能手表', '智能手环', '运动手表', '智能耳机', '智能体重秤', '智能血压计'];

const DEVICE_STATUS = {
  active: { label: '使用中', class: 'active' },
  maintenance: { label: '维修中', class: 'maintenance' },
  retired: { label: '已退役', class: 'retired' }
};