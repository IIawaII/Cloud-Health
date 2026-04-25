import { verifyToken } from '../lib/auth';
import { jsonResponse, errorResponse, safeErrorResponse } from '../lib/response';
import { checkRateLimit } from '../lib/rateLimit';
import { callLLMText } from '../lib/llm';
import { SYSTEM_PROMPTS, USER_PROMPTS } from '../lib/prompts';
import type { Env } from '../lib/env';

export const onRequestPost = async (context: EventContext<Env, string, Record<string, unknown>>) => {
  const { request } = context;

  try {
    const body = await request.json<{
      mode: 'generate' | 'grade';
      category?: string;
      difficulty?: string;
      questions?: Array<{
        question: string;
        options: string[];
        correctAnswer?: number;
        explanation?: string;
      }>;
      userAnswers?: number[];
    }>();

    const { mode, category, difficulty, questions, userAnswers } = body;

    if (mode === 'generate') {
      const tokenData = await verifyToken(context);
      if (!tokenData) {
        return errorResponse('未授权', 401);
      }

      // 速率限制：每个用户每小时最多 20 次题目生成
      const rateLimit = await checkRateLimit({
        kv: context.env.AUTH_TOKENS,
        key: `ai:${tokenData.userId}:quiz`,
        limit: 20,
        windowSeconds: 3600,
      });
      if (!rateLimit.allowed) {
        return errorResponse('题目生成请求过于频繁，请稍后再试', 429);
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

      const content = await callLLMText({
        baseUrl,
        apiKey,
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.QUIZ_GENERATOR },
          { role: 'user', content: USER_PROMPTS.generateQuiz(category, difficulty) },
        ],
        temperature: 0.8,
        max_tokens: 3000,
      });

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('无法解析题目数据');
        }
      }

      return jsonResponse(parsed, 200);
    }

    if (mode === 'grade' && questions && userAnswers) {
      // 评分模式也要求登录，保持行为一致性
      const tokenData = await verifyToken(context);
      if (!tokenData) {
        return errorResponse('未授权', 401);
      }

      if (questions.length === 0) {
        return errorResponse('题目数据为空，无法评分', 400);
      }
      if (userAnswers.length !== questions.length) {
        return errorResponse('答题数量与题目数量不匹配', 400);
      }

      // 校验题目数据完整性
      for (let i = 0; i < questions.length; i++) {
        if (typeof questions[i].correctAnswer !== 'number') {
          return errorResponse(`第 ${i + 1} 题缺少正确答案数据`, 400);
        }
      }

      let correctCount = 0;
      const results = questions.map((q, idx) => {
        const isCorrect = userAnswers[idx] === q.correctAnswer;
        if (isCorrect) correctCount++;
        return {
          question: q.question,
          userAnswer: userAnswers[idx],
          correctAnswer: q.correctAnswer!,
          isCorrect,
          explanation: q.explanation || '',
        };
      });

      const score = Math.round((correctCount / questions.length) * 100);

      let comment = '';
      if (score >= 90) comment = '太棒了！你的健康知识储备非常丰富，继续保持！';
      else if (score >= 70) comment = '不错哦！你对健康知识有较好的了解，还有提升空间。';
      else if (score >= 50) comment = '还可以！建议多关注健康知识，提升健康素养。';
      else comment = '需要加油！建议你多学习一些基础健康知识，关爱自己的身体。';

      return jsonResponse({
        score,
        correctCount,
        total: questions.length,
        comment,
        results,
      }, 200);
    }

    return errorResponse('无效的请求参数', 400);
  } catch (err) {
    return safeErrorResponse(err);
  }
};
