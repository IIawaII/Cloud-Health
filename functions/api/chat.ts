import { z } from 'zod';
import { verifyToken } from '../lib/auth';
import { jsonResponse, errorResponse, parseLLMResult, safeErrorResponse } from '../lib/response';
import { checkRateLimit } from '../lib/rateLimit';
import { callLLM, createStreamResponse } from '../lib/llm';
import { SYSTEM_PROMPTS } from '../lib/prompts';
import type { Env } from '../lib/env';

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string().min(1, '消息角色不能为空'),
      content: z.string().min(1, '消息内容不能为空'),
    })
  ).min(1, '消息列表不能为空'),
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

    // 速率限制：每个用户每分钟最多 30 次 AI 请求
    const rateLimit = await checkRateLimit({
      kv: context.env.AUTH_TOKENS,
      key: `ai:${tokenData.userId}:chat`,
      limit: 30,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return errorResponse('AI 请求过于频繁，请稍后再试', 429);
    }

    const body = await request.json<unknown>();
    const parseResult = chatSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || '请求参数错误';
      return errorResponse(firstError, 400);
    }
    const { messages, stream } = parseResult.data;

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
      messages: [{ role: 'system', content: SYSTEM_PROMPTS.HEALTH_ADVISOR }, ...messages],
      stream: stream ?? false,
      temperature: 0.7,
      max_tokens: 3000,
    });

    if (!response.ok) {
      const err = await response.text();
      return errorResponse(`模型请求失败: ${err}`, 502);
    }

    if (stream) {
      return createStreamResponse(response);
    }

    const data = await response.json();
    const resultText = parseLLMResult(data);

    return jsonResponse({ result: resultText }, 200);
  } catch (err) {
    return safeErrorResponse(err);
  }
};
