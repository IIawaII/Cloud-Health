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
    const body = await request.json<{
      mode: 'generate' | 'grade';
      category?: string;
      difficulty?: string;
      questions?: Array<{
        question: string;
        options: string[];
        correctAnswer?: number;
      }>;
      userAnswers?: number[];
    }>();

    const { mode, category, difficulty, questions, userAnswers } = body;

    if (mode === 'generate') {
      const tokenData = await verifyToken(context);
      if (!tokenData) {
        return errorResponse('未授权', 401);
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

      const prompt = `请生成5道健康知识问答题，类别：${category || '综合健康知识'}，难度：${difficulty || '中等'}。

要求：
1. 每道题包含4个选项（A、B、C、D）
2. 标明每道题的正确答案索引（0=A, 1=B, 2=C, 3=D）
3. 为每道题提供简要的知识点解析

请严格按照以下 JSON 格式输出，不要包含其他文字：
{
  "questions": [
    {
      "question": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "correctAnswer": 0,
      "explanation": "解析内容"
    }
  ]
}`;

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
                '你是一位健康知识教育专家，擅长生成有趣且富有教育意义的健康知识问答题。请严格按照用户要求的 JSON 格式输出，不要包含 markdown 代码块标记或其他额外文字。',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return errorResponse(`模型请求失败: ${err}`, 502);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = data.choices?.[0]?.message?.content || '';

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
      if (questions.length === 0) {
        return errorResponse('题目数据为空，无法评分', 400);
      }
      if (userAnswers.length !== questions.length) {
        return errorResponse('答题数量与题目数量不匹配', 400);
      }

      let correctCount = 0;
      const results = questions.map((q: { question: string; options: string[]; correctAnswer?: number; explanation?: string }, idx: number) => {
        const isCorrect = userAnswers[idx] === q.correctAnswer;
        if (isCorrect) correctCount++;
        return {
          question: q.question,
          userAnswer: userAnswers[idx],
          correctAnswer: q.correctAnswer,
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
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse(msg, 500);
  }
};
