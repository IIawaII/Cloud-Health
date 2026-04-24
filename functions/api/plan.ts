import { verifyToken } from '../lib/auth';
import { jsonResponse, errorResponse } from '../lib/response';

interface Env {
  AUTH_TOKENS: KVNamespace;
  AI_API_KEY: string;
  AI_BASE_URL: string;
  AI_MODEL: string;
}

export const onRequestPost = async (context: EventContext<Env, string, Record<string, unknown>>) => {
  const { request } = context;

  try {
    // 认证检查
    const tokenData = await verifyToken(context);
    if (!tokenData) {
      return errorResponse('未授权', 401);
    }

    const body = await request.json<{
      formData: Record<string, unknown>;
      stream?: boolean;
    }>();

    const { formData, stream } = body;

    const userBaseUrl = request.headers.get('X-AI-Base-URL');
    const userApiKey = request.headers.get('X-AI-API-Key');
    const userModel = request.headers.get('X-AI-Model');

    const baseUrl = userBaseUrl || context.env.AI_BASE_URL;
    const apiKey = userApiKey || context.env.AI_API_KEY;
    const model = userModel || context.env.AI_MODEL;

    if (!baseUrl || !apiKey || !model) {
      return errorResponse('未配置 AI API，请在设置中填写或联系管理员', 503);
    }

    const prompt = `你是一位资深的健康管理师和营养学专家。请根据以下用户信息，为其量身定制一份详细的健康管理计划。

用户信息：
${JSON.stringify(formData, null, 2)}

请生成一份结构化的健康计划，包含以下内容（使用 Markdown 格式）：

# 个性化健康管理计划

## 1. 用户健康档案摘要
简要总结用户的基本情况和健康目标。

## 2. 饮食管理方案
- 每日饮食原则
- 推荐食物清单
- 需避免的食物
- 示例一日食谱（早餐、午餐、晚餐、加餐）

## 3. 运动锻炼计划
- 每周运动安排（具体天数、时长、运动类型）
- 不同阶段的强度调整
- 运动注意事项

## 4. 作息与生活习惯建议
- 睡眠管理
- 压力调节
- 日常健康习惯

## 5. 阶段性目标与监测
- 短期目标（1个月内）
- 中期目标（3个月内）
- 长期目标（半年以上）
- 建议监测的指标

## 6. 注意事项与禁忌
列出用户需要特别注意的健康事项。

请确保计划具有可执行性，内容专业且易于理解。`;

    // 流式输出
    if (stream) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                '你是一位资深的健康管理师和营养学专家，擅长根据用户个人情况制定科学、可执行的健康管理计划。请使用中文回答。',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 4000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return errorResponse(`模型请求失败: ${err}`, 502);
      }

      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // 非流式输出
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              '你是一位资深的健康管理师和营养学专家，擅长根据用户个人情况制定科学、可执行的健康管理计划。请使用中文回答。',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return errorResponse(`模型请求失败: ${err}`, 502);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const result = data.choices?.[0]?.message?.content || '';

    return jsonResponse({ result }, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse(msg, 500);
  }
};
