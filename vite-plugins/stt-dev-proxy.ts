import type { Plugin, ViteDevServer } from 'vite';

/**
 * vite-plugins/stt-dev-proxy.ts — Vite dev 미들웨어 (Deepgram STT)
 * -----------------------------------------------------------------------------
 * dev 환경에서 /api/stt/deepgram 요청을 가로채 Deepgram Nova-3 API 를 직접 호출.
 * 프로덕션(Vercel)에서는 서버리스 함수 api/stt/deepgram.ts 가 동일 역할 수행.
 *
 * 기존 vite.config.ts 의 /api/stt → apiclaude.cc 프록시보다 먼저 실행되어
 * Deepgram 라우트가 apiclaude.cc 로 잘못 전달되지 않도록 차단.
 *
 * 환경변수: DEEPGRAM_API_KEY (.env.local 에서 loadEnv 로 로드)
 */
const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

interface SttWord {
  word: string;
  start: number;
  end: number;
}

function normalizeAudioContentType(reqContentType: string, filename?: string): string {
  const ct = (reqContentType || '').toLowerCase();
  if (ct.startsWith('audio/')) return ct;
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  if (ext === 'webm') return 'audio/webm';
  if (ext === 'mp4' || ext === 'm4a') return 'audio/mp4';
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'mp3' || ext === 'mpeg') return 'audio/mpeg';
  if (ext === 'ogg') return 'audio/ogg';
  if (ext === 'flac') return 'audio/flac';
  return 'audio/webm';
}

function normalizeDeepgramResponse(data: any): {
  text: string;
  duration?: number;
  words?: SttWord[];
} {
  const channel = data?.results?.channels?.[0];
  const alt = channel?.alternatives?.[0];
  const transcript = String(alt?.transcript || '').trim();
  const duration = typeof data?.metadata?.duration === 'number'
    ? data.metadata.duration
    : undefined;

  let words: SttWord[] | undefined;
  const rawWords = alt?.words;
  if (Array.isArray(rawWords) && rawWords.length > 0) {
    words = rawWords
      .map((w: any) => ({
        word: String(w.word || w.text || ''),
        start: Number(w.start ?? 0),
        end: Number(w.end ?? 0),
      }))
      .filter((w: SttWord) => w.word);
  }
  return { text: transcript, duration, words };
}

function collectRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Audio-Filename',
};

export function sttDevProxyPlugin(deepgramApiKey: string): Plugin {
  return {
    name: 'stt-dev-proxy',
    configureServer(server: ViteDevServer) {
      // 미들웨어를 proxy 보다 먼저 등록 → /api/stt/deepgram 가로채기
      server.middlewares.use('/api/stt/deepgram', async (req, res, next) => {
        // CORS preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(200, CORS_HEADERS);
          res.end();
          return;
        }
        if (req.method !== 'POST') {
          res.writeHead(405, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }
        if (!deepgramApiKey) {
          res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'DEEPGRAM_API_KEY 가 .env.local 에 설정되지 않았습니다. Deepgram 콘솔에서 키 발급 후 등록하세요.',
          }));
          return;
        }

        try {
          const reqContentType = (req.headers['content-type'] as string) || '';
          const filename = (req.headers['x-audio-filename'] as string) || undefined;
          const rawBody = await collectRawBody(req);

          if (rawBody.length === 0) {
            res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '빈 오디오 본문입니다.' }));
            return;
          }

          const audioContentType = normalizeAudioContentType(reqContentType, filename);

          const params = new URLSearchParams({
            model: 'nova-3',
            smart_format: 'true',
            punctuate: 'true',
            utterances: 'true',
            numerals: 'true',
            language: 'en',
          });

          const response = await fetch(`${DEEPGRAM_API_URL}?${params.toString()}`, {
            method: 'POST',
            headers: {
              'Authorization': `Token ${deepgramApiKey}`,
              'Content-Type': audioContentType,
              'Content-Length': String(rawBody.length),
            },
            body: rawBody,
          });

          const respText = await response.text();
          if (!response.ok) {
            res.writeHead(response.status, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: `Deepgram STT 오류 (${response.status})`,
              detail: respText.slice(0, 300),
            }));
            return;
          }

          let data: any;
          try {
            data = JSON.parse(respText);
          } catch {
            res.writeHead(502, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Deepgram 응답 JSON 파싱 실패' }));
            return;
          }

          const normalized = normalizeDeepgramResponse(data);
          res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            text: normalized.text,
            duration: normalized.duration,
            words: normalized.words,
            source: 'deepgram',
          }));
        } catch (error: any) {
          console.error('[stt-dev-proxy] Deepgram 오류:', error?.message);
          res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error?.message || 'Internal Server Error' }));
        }
      });
    },
  };
}
