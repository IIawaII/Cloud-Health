import { verifyToken } from '../lib/auth';
import { jsonResponse, errorResponse, parseLLMResult, safeErrorResponse } from '../lib/response';
import { checkRateLimit } from '../lib/rateLimit';
import { callLLM, createStreamResponse } from '../lib/llm';
import { SYSTEM_PROMPTS, USER_PROMPTS } from '../lib/prompts';
import type { Env } from '../lib/env';

const MAX_FILE_SIZE_MB = 5;

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

    // 校验文件大小
    let dataSizeMB: number;
    if (fileData.startsWith('data:')) {
      // base64 格式：剔除前缀后按 4/3 估算原始大小
      const base64Content = fileData.split(',')[1] || '';
      dataSizeMB = (base64Content.length * 3) / 4 / 1024 / 1024;
    } else {
      // 纯文本格式（如 text/plain）直接按字符长度计算
      dataSizeMB = new Blob([fileData]).size / 1024 / 1024;
    }
    if (dataSizeMB > MAX_FILE_SIZE_MB) {
      return errorResponse(`文件大小超过 ${MAX_FILE_SIZE_MB}MB 限制`, 413);
    }

    // 速率限制：每个用户每小时最多 20 次分析
    const rateLimit = await checkRateLimit({
      kv: context.env.AUTH_TOKENS,
      key: `ai:${tokenData.userId}:analyze`,
      limit: 20,
      windowSeconds: 3600,
    });
    if (!rateLimit.allowed) {
      return errorResponse('分析请求过于频繁，请稍后再试', 429);
    }

    const isImage = fileType.startsWith('image/');
    const isText = fileType === 'application/pdf' || fileType === 'text/plain';

    if (!isImage && !isText) {
      return errorResponse('不支持的文件类型', 400);
    }

    // 校验 fileType 与 fileData 内容是否匹配，防止伪造类型
    if (isImage && !fileData.startsWith('data:image/')) {
      return errorResponse('文件内容与声明的图片类型不匹配', 400);
    }
    if (fileType === 'text/plain' && fileData.startsWith('data:')) {
      return errorResponse('文本文件不应为 base64 编码', 400);
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

    const messages = isImage
      ? [
          { role: 'system', content: SYSTEM_PROMPTS.REPORT_ANALYZER_IMAGE },
          {
            role: 'user',
            content: [
              { type: 'text', text: USER_PROMPTS.analyzeImage(fileName) },
              { type: 'image_url', image_url: { url: fileData } },
            ],
          },
        ]
      : [
          { role: 'system', content: SYSTEM_PROMPTS.REPORT_ANALYZER_TEXT },
          { role: 'user', content: USER_PROMPTS.analyzeText(fileName, fileData) },
        ];

    const response = await callLLM({
      baseUrl,
      apiKey,
      model,
      messages,
      stream: stream ?? false,
      temperature: 0.5,
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
