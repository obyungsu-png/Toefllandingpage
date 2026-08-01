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
 *   - response_format: 'verbose_json' (words/duration 포함)
 *
 * 응답: { text, duration?, words?, segments? } 또는 { error }
 *
 * ⚠️ multipart/form-data 를 그대로 업스트림으로 전달하기 위해
 *    Vercel 기본 body parser 를 비활성화 (config.api.bodyParser = false).
 */
const STT_API_URL = 'https://apiclaude.cc/v1/audio/transcriptions';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// multipart 요청은 body parser 비활성화 — raw stream 으로 수집 후 전달
export const config = {
  api: {
    bodyParser: false,
  },
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/** 요청 스트림을 Buffer 로 수집 */
function collectRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

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
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'multipart/form-data 요청이 필요합니다.' }));
      return;
    }

    // raw multipart body 수집 (bodyParser 비활성화 상태)
    const rawBody = await collectRawBody(req);
    if (rawBody.length === 0) {
      res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '빈 요청 본문입니다.' }));
      return;
    }

    // content-length 동기화 — 업스트림이 정확한 길이 필요
    const upstreamHeaders: Record<string, string> = {
      'Authorization': `Bearer ${CLAUDE_API_KEY}`,
      'User-Agent': 'OBS',
      'Content-Type': contentType,
    };
    if (rawBody.length) upstreamHeaders['Content-Length'] = String(rawBody.length);

    const response = await fetch(STT_API_URL, {
      method: 'POST',
      headers: upstreamHeaders,
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

    // 응답 그대로 전달 (JSON 또는 text)
    const contentTypeResp = response.headers.get('content-type') || 'application/json';
    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': contentTypeResp });
    res.end(respText);
  } catch (error: any) {
    console.error('STT proxy error:', error);
    res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
  }
}
