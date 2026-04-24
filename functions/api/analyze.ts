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
      fileData: string;
      fileType: string;
      fileName: string;
      stream?: boolean;
    }>();

    const { fileData, fileType, fileName, stream } = body;

    // 校验参数
    if (!fileData || !fileType || !fileName) {
      return errorResponse('请提供完整的文件信息', 400);
    }

    // 校验 fileData 格式（必须是 data: 开头的 base64，禁止外部 URL）
    if (!fileData.startsWith('data:')) {
      return errorResponse('无效的文件数据格式', 400);
    }

    const isImage = fileType.startsWith('image/');
    const isPdf = fileType === 'application/pdf';

    let messages: Array<Record<string, unknown>> = [];

    if (isImage) {
      messages = [
        {
          role: 'system',
          content:
            '你是一位专业的健康管理顾问和医学分析师。请仔细分析用户上传的医疗健康相关图像，提供结构化的分析结果。请使用中文回答。',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `请分析这份名为\"${fileName}\"的健康报告/检测图像。请从以下几个方面进行分析：\n1. 报告概述：这份报告/检测的主要内容是什么\n2. 关键指标：列出关键健康指标及其数值\n3. 异常分析：指出任何异常或需要关注的指标\n4. 健康建议：基于分析结果给出具体的健康改善建议\n5. 后续行动：建议下一步需要做什么（如复查、就医等）\n\n请以 Markdown 格式输出，结构清晰。`,
            },
            {
              type: 'image_url',
              image_url: { url: fileData },
            },
          ],
        },
      ];
    } else if (isPdf || fileType === 'text/plain') {
      messages = [
        {
          role: 'system',
          content:
            '你是一位专业的健康管理顾问和医学分析师。请仔细分析用户上传的健康报告文本内容，提供结构化的分析结果。请使用中文回答。',
        },
        {
          role: 'user',
          content: `请分析这份名为\"${fileName}\"的健康报告。报告内容如下：\n\n${fileData}\n\n请从以下几个方面进行分析：\n1. 报告概述：这份报告的主要内容是什么\n2. 关键指标：列出关键健康指标及其数值\n3. 异常分析：指出任何异常或需要关注的指标\n4. 健康建议：基于分析结果给出具体的健康改善建议\n5. 后续行动：建议下一步需要做什么（如复查、就医等）\n\n请以 Markdown 格式输出，结构清晰。`,
        },
      ];
    } else {
      return errorResponse('不支持的文件类型', 400);
    }

    const userBaseUrl = request.headers.get('X-AI-Base-URL');
    const userApiKey = request.headers.get('X-AI-API-Key');
    const userModel = request.headers.get('X-AI-Model');

    const baseUrl = userBaseUrl || context.env.AI_BASE_URL;
    const apiKey = userApiKey || context.env.AI_API_KEY;
    const model = userModel || context.env.AI_MODEL;

    if (!baseUrl || !apiKey || !model) {
      return errorResponse('未配置 AI API，请在设置中填写或联系管理员', 503);
    }

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
          messages,
          temperature: 0.5,
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
        messages,
        temperature: 0.5,
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
