import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLAUDE_API_URL = 'https://apiclaude.cc/v1/chat/completions';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'sk-3bd59126ffdfa8ed1fcca872704a87bd00f8a81e00edb4b0126551f2dd8cb070';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
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

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CLAUDE_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-5',
        messages,
        max_tokens: max_tokens || 1200,
        temperature: temperature || 0.6,
        stream: stream || false,
      }),
    });

    // 스트리밍 응답 — 청크 단위 실시간 파이핑
    if (stream) {
      res.writeHead(200, {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      // HTTP status 에러는 SSE 내에 error 이벤트로 전송
      if (!response.ok) {
        const errText = await response.text();
        res.write(`data: {"error":{"message":"${errText.slice(0, 200)}","type":"api_error","code":"${response.status}"}}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      const reader = response.body;
      if (!reader) {
        res.end();
        return;
      }

      // 실시간 청크 파이핑 — 전체 대기 없이 즉시 전송
      for await (const chunk of reader as unknown as AsyncIterable<Buffer>) {
        res.write(chunk);
      }
      res.end();
      return;
    }

    // 비스트리밍 응답
    const data = await response.json();

    if (!response.ok) {
      res.writeHead(response.status, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (error: any) {
    console.error('Claude proxy error:', error);
    res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
  }
}
