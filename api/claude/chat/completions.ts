import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLAUDE_API_URL = 'https://apiclaude.cc/v1/chat/completions';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'sk-7bb2bdf867bc08ac04bae5cd03dbc96351d08d6f0ec80716596a22b7a74b06f9';

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
        max_tokens: max_tokens || 2500,
        temperature: temperature || 0.7,
        stream: stream || false,
      }),
    });

    // 스트리밍 응답 처리
    if (stream) {
      res.writeHead(200, {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const reader = response.body;
      if (!reader) {
        res.end();
        return;
      }

      // Node.js环境下需要使用不同的方式处理streaming
      const text = await response.text();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          res.write(line + '\n\n');
        }
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
