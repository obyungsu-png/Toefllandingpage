import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * STT(음성→텍스트) 서버리스 프록시 — apiclaude.cc Whisper 호환 엔드포인트
 * -----------------------------------------------------------------------------
 * OpenAI 호환 /v1/audio/transcriptions 스펙 사용.
 * 보안: CLAUDE_API_KEY 환경변수만 사용 (클라이언트에 키 노출 없음).
 *
 * 요청: multipart/form-data
 *   - file:       오디오 Blob (webm/mp4/wav/m4a)
 *   - model:      'whisper-1' (기본)
 *   - language:   'en' (기본 — 영어 STT)
 *   - response_format: 'json' | 'verbose_json' (기본 verbose_json → segments/words 포함)
 *
 * 응답: { text, duration?, words?, segments? } 또는 { error }
 */
const STT_API_URL = 'https://apiclaude.cc/v1/audio/transcriptions';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

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

  if (!CLAUDE_API_KEY) {
    res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'CLAUDE_API_KEY 환경변수가 설정되지 않았습니다. Vercel 프로젝트 설정에서 환경변수를 추가해주세요.',
    }));
    return;
  }

  try {
    // 클라이언트가 보낸 multipart/form-data 그대로 apiclaude.cc 로 전달
    // Vercel Node 런타임은 req.body 에 Buffer/stream 으로 원본 multipart 를 노출.
    // multipart 처리를 위해 원본 body 를 그대로 forwarding 하는 방식 사용.
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'multipart/form-data 요청이 필요합니다.' }));
      return;
    }

    // raw body 를 그대로 업스트림으로 전달 (Vercel 은 버퍼링된 body 제공)
    const rawBody: Buffer = req.body instanceof Buffer
      ? req.body
      : Buffer.isBuffer(req.body)
        ? req.body
        : typeof req.body === 'string'
          ? Buffer.from(req.body, 'binary')
          : Buffer.from(JSON.stringify(req.body));

    const response = await fetch(STT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLAUDE_API_KEY}`,
        'User-Agent': 'OBS',
        'Content-Type': contentType,
      },
      body: rawBody,
    });

    const respText = await response.text();

    if (!response.ok) {
      res.writeHead(response.status, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: `STT 업스트림 오류 (${response.status})`,
        detail: respText.slice(0, 300),
      }));
      return;
    }

    // 응답이 JSON 인지 확인 후 전달
    const contentTypeResp = response.headers.get('content-type') || 'application/json';
    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': contentTypeResp });
    res.end(respText);
  } catch (error: any) {
    console.error('STT proxy error:', error);
    res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
  }
}
