const AI = {
  async diagnose({ title, description, device }) {
    const settings = Store.getSettings();
    if (!settings.aiApiKey) {
      throw new Error('请先配置 AI API Key');
    }

    const prompt = `
你是一名专业的可穿戴设备故障诊断专家。请根据以下异常信息进行分析诊断：

【异常标题】${title}
【设备型号】${device || '未知'}
【问题描述】${description || '无详细描述'}

请分析并返回以下 JSON 格式的结果（不要返回其他文字）：
{
  "tags": ["标签1", "标签2"],
  "stage": "verifying"（可选值：verifying/detecting/normal/danger/wearing）,
  "suggestion": "可能原因的简短说明",
  "solution": "建议的处理方法"
}

注意：
- tags 请给出 2-5 个最相关的标签
- stage 请根据问题严重程度判断初始阶段
- suggestion 和 solution 请简洁明了，每段不超过 100 字
`;

    try {
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + settings.aiApiKey
        },
        body: JSON.stringify({
          model: settings.aiModel || 'doubao-pro-32k',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('API 请求失败: ' + response.status + ' ' + errorText);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return this.validateResult(result);
      }

      throw new Error('无法解析 AI 返回结果');
    } catch (e) {
      console.error('AI diagnosis error:', e);
      throw e;
    }
  },

  validateResult(result) {
    const validStages = ['verifying', 'detecting', 'normal', 'danger', 'wearing'];
    return {
      tags: Array.isArray(result.tags) ? result.tags.slice(0, 5) : [],
      stage: validStages.includes(result.stage) ? result.stage : 'verifying',
      suggestion: result.suggestion || '',
      solution: result.solution || ''
    };
  },

  async generateTags(text) {
    try {
      const result = await this.diagnose({ title: text, description: '' });
      return result.tags || [];
    } catch (e) {
      return [];
    }
  }
};