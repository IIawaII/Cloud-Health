import { z } from 'zod';
import { verifyToken } from '../lib/auth';
import { jsonResponse, errorResponse, parseLLMResult, safeErrorResponse } from '../lib/response';
import { checkRateLimit } from '../lib/rateLimit';
import { callLLM, createStreamResponse } from '../lib/llm';
import { SYSTEM_PROMPTS, USER_PROMPTS } from '../lib/prompts';
import type { Env } from '../lib/env';

const planSchema = z.object({
  formData: z.record(z.unknown()).refine((val) => Object.keys(val).length > 0, '表单数据不能为空'),
  stream: z.boolean().optional(),
});

export const onRequestPost = async (context: EventContext<Env, string, Record<string, unknown>>) => {
  const { request } = context;

  try {
    // 认证检查
    const tokenData = await verifyToken(context);
    if (!tokenData) {
      return errorResponse('未授权', 401);
    }

    // 速率限制：每个用户每小时最多 10 次计划生成
    const rateLimit = await checkRateLimit({
      kv: context.env.AUTH_TOKENS,
      key: `ai:${tokenData.userId}:plan`,
      limit: 10,
      windowSeconds: 3600,
    });
    if (!rateLimit.allowed) {
      return errorResponse('计划生成请求过于频繁，请稍后再试', 429);
    }

    const body = await request.json<unknown>();
    const parseResult = planSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || '请求参数错误';
      return errorResponse(firstError, 400);
    }
    const { formData, stream } = parseResult.data;

    const userBaseUrl = request.headers.get('X-AI-Base-URL');
    const userApiKey = request.headers.get('X-AI-API-Key');
    const userModel = request.headers.get('X-AI-Model');

    const baseUrl = userBaseUrl || context.env.AI_BASE_URL;
    const apiKey = userApiKey || context.env.AI_API_KEY;
    const model = userModel || context.env.AI_MODEL;

    if (!baseUrl || !apiKey || !model) {
      return errorResponse('未配置 AI API，请在设置中填写或联系管理员', 503);
    }

    const response = await callLLM({
      baseUrl,
      apiKey,
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.PLAN_GENERATOR },
        { role: 'user', content: USER_PROMPTS.generatePlan(formData) },
      ],
      stream: stream ?? false,
      temperature: 0.6,
      max_tokens: 4000,
    });

    if (!response.ok) {
      const err = await response.text();
      return errorResponse(`模型请求失败: ${err}`, 502);
    }

    if (stream) {
      return createStreamResponse(response);
    }

    const data = await response.json();
    const result = parseLLMResult(data);

    return jsonResponse({ result }, 200);
  } catch (err) {
    return safeErrorResponse(err);
  }
};
