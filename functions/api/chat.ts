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
      messages: Array<{ role: string; content: string }>;
      stream?: boolean;
    }>();

    const { messages, stream } = body;

    const userBaseUrl = request.headers.get('X-AI-Base-URL');
    const userApiKey = request.headers.get('X-AI-API-Key');
    const userModel = request.headers.get('X-AI-Model');

    const baseUrl = userBaseUrl || context.env.AI_BASE_URL;
    const apiKey = userApiKey || context.env.AI_API_KEY;
    const model = userModel || context.env.AI_MODEL;

    if (!baseUrl || !apiKey || !model) {
      return errorResponse('未配置 AI API，请在设置中填写或联系管理员', 503);
    }

    const systemMessage = {
      role: 'system',
      content:
        '你是一位专业的健康管理顾问，拥有丰富的医学和营养学知识。你可以回答用户的健康问题，提供科学的健康建议。回答时请保持专业、友善，并提醒用户严重健康问题应咨询医生。请使用中文回答。',
    };

    const allMessages = [systemMessage, ...messages];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 3000,
        stream: stream ?? false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return errorResponse(`模型请求失败: ${err}`, 502);
    }

    if (stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
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
