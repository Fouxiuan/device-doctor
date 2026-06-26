// AI 智能诊疗模块
// 基于火山方舟大模型 API 实现异常自动归类、标签推荐和方案智能匹配
// 文档参考: https://www.volcengine.com/docs/82379/1330310
const AIDoctor = (function() {
    const API_KEY_STORAGE = 'device-doctor-ai-key';
    const MODEL_STORAGE = 'device-doctor-ai-model';
    const API_BASE = 'https://ark.cn-beijing.volces.com/api/v3';

    // 可选模型列表（参考火山方舟模型列表页）
    // https://www.volcengine.com/docs/82379/1330310
    const MODELS = [
        { id: 'doubao-seed-2-0-pro-260215',  label: 'Doubao-Seed-2.0-Pro（推荐，旗舰稳定版）' },
        { id: 'doubao-seed-2-0-mini-260428', label: 'Doubao-Seed-2.0-Mini（轻量快速版）' },
        { id: 'doubao-seed-2-0-lite-260428', label: 'Doubao-Seed-2.0-Lite（超轻量版）' },
        { id: 'doubao-1-5-pro-32k-250115',   label: 'Doubao-1.5-Pro-32k（往期版本）' },
        { id: 'doubao-1-5-lite-32k-250115',  label: 'Doubao-1.5-Lite-32k（往期版本）' },
    ];
    const DEFAULT_MODEL = MODELS[0].id;

    let lastRequest = null;

    function getConfig() {
        const apiKey = localStorage.getItem(API_KEY_STORAGE);
        const model = localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
        return { apiKey, model, enabled: !!apiKey };
    }

    function setApiKey(key) {
        if (key) {
            localStorage.setItem(API_KEY_STORAGE, key);
        } else {
            localStorage.removeItem(API_KEY_STORAGE);
        }
    }

    function setModel(model) {
        if (model) {
            localStorage.setItem(MODEL_STORAGE, model);
        } else {
            localStorage.removeItem(MODEL_STORAGE);
        }
    }

    function getModels() {
        return MODELS;
    }

    function isConfigured() {
        return !!localStorage.getItem(API_KEY_STORAGE);
    }

    // 统一调用大模型对话接口
    async function chat(messages, options = {}) {
        const { apiKey, model } = getConfig();
        if (!apiKey) {
            throw new Error('未配置 API Key，请先在设置中配置');
        }

        const body = {
            model: model,
            messages,
            temperature: options.temperature ?? 0.3,
            max_tokens: options.max_tokens ?? 800
        };

        const response = await fetch(`${API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API 请求失败 (${response.status})：${errText.slice(0, 200)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        return content;
    }

    // 智能诊疗：根据异常描述自动归类标签、推荐阶段、生成处理建议
    async function diagnose(issueInfo) {
        const { title, description, deviceId, deviceName, deviceType } = issueInfo;

        if (!title && !description) {
            return { error: '请先填写异常标题或描述' };
        }

        // 收集已有标签和知识库作为上下文
        const allTags = Store.getTags();
        const knowledge = Store.getKnowledge().slice(0, 20).map(k => ({
            title: k.title,
            tags: k.tags,
            solveCount: k.solveCount
        }));

        const systemPrompt = `你是"设备诊疗师"系统的 AI 诊断助手。根据用户描述的设备异常，输出 JSON 格式的诊断结果。
要求：
1. recommendedTags: 推荐 2-5 个标签，优先从已有标签中选择，可新增
2. recommendedStage: 推荐阶段，从 [verifying(数据校对), detecting(检测中), normal(判定正常), danger(判定危险), wearing(穿戴测试)] 中选一个
3. possibleCause: 可能原因分析（50-100字）
4. suggestion: 初步处理建议（50-150字）
5. severity: 严重程度 [low, medium, high]

只输出 JSON，不要任何额外文字。`;

        const userPrompt = `设备信息：
- 编号：${deviceId || '未知'}
- 名称：${deviceName || '未知'}
- 类型：${deviceType || '未知'}

异常标题：${title || '无'}
异常描述：${description || '无'}

已有标签库：${JSON.stringify(allTags)}
已有知识库（参考）：${JSON.stringify(knowledge)}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        const content = await chat(messages, { temperature: 0.4, max_tokens: 600 });

        try {
            // 提取 JSON（兼容 markdown 代码块包裹）
            const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const result = JSON.parse(jsonStr);
            return result;
        } catch (e) {
            return { error: 'AI 返回格式异常，请重试', raw: content };
        }
    }

    // 智能生成知识库方案
    async function generateSolution(issueInfo) {
        const { title, description, deviceId, deviceName } = issueInfo;

        const systemPrompt = `你是设备维修知识库编写助手。根据设备异常信息，生成一份结构化的维修处理方案，使用 Markdown 格式。
包含：## 故障现象、## 可能原因、## 处理步骤（有序列表）、## 注意事项。控制在 300 字以内。`;

        const userPrompt = `设备：${deviceName || deviceId || '未知'}
异常：${title}
描述：${description || '无'}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        return await chat(messages, { temperature: 0.5, max_tokens: 800 });
    }

    // 智能问答：针对设备异常的对话式咨询
    async function ask(question, context = {}) {
        const { issueTitle, issueDescription, deviceInfo } = context;

        const systemPrompt = `你是设备诊疗师 AI 助手，帮助用户解答设备异常相关问题。回答简洁实用，控制在 200 字以内。`;

        let userPrompt = '';
        if (issueTitle) userPrompt += `当前异常：${issueTitle}\n`;
        if (issueDescription) userPrompt += `异常描述：${issueDescription}\n`;
        if (deviceInfo) userPrompt += `设备信息：${deviceInfo}\n`;
        userPrompt += `\n用户问题：${question}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        return await chat(messages, { temperature: 0.6, max_tokens: 500 });
    }

    return {
        diagnose,
        generateSolution,
        ask,
        setApiKey,
        setModel,
        getModels,
        isConfigured,
        getConfig
    };
})();