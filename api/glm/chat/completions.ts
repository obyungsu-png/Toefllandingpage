import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GLM (Zhipu open.bigmodel.cn) Vercel 서버리스 프록시.
 * Claude 프록시와 동일한 패턴 — 서버 환경변수로만 키를 관리해 클라이언트 노출 방지.
 *
 * 환경변수(Vercel Project Settings → Environment Variables):
 *   GLM_API_KEY=xxxxxxxx.xxxxxxxx   (권장 — 서버 전용, 클라이언트에 노출 안 됨)
 *   VITE_GLM_API_KEY=…              (레거시 fallback — 기존 값이 있으면 사용)
 *
 * 스트리밍(stream: true) / 비스트리밍 모두 지원.
 */

const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
// 기본 GLM 키(레거시 하드코딩) — 환경변수 미설정 배포에서도 즉시 작동.
// 새 키로 교체하려면 Vercel env GLM_API_KEY 로 등록하면 우선순위가 더 높습니다.
const DEFAULT_GLM_API_KEY = 'dc2213720f4b4a88ae06ddbd434ab1dd.qDGcLtBM9gGqp6ff';
const GLM_API_KEY = process.env.GLM_API_KEY || process.env.VITE_GLM_API_KEY || DEFAULT_GLM_API_KEY;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, CORS_HEADERS);
    res.end('Method Not Allowed');
    return;
  }

  try {
    const { model, messages, max_tokens, temperature, stream } = req.body;

    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OBS',
        Authorization: `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || 'glm-4-flash',
        messages,
        max_tokens: max_tokens || 1200,
        temperature: temperature ?? 0.6,
        stream: stream || false,
      }),
    });

    if (stream) {
      res.writeHead(200, {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      if (!response.ok) {
        const errText = await response.text();
        res.write(`data: {"error":{"message":"${errText.slice(0, 200).replace(/"/g, '\\"')}","type":"api_error","code":"${response.status}"}}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        res.end();
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) res.write(value);
      }
      res.end();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      res.writeHead(response.status, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (error: any) {
    console.error('GLM proxy error:', error);
    res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
  }
}
