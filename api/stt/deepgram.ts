import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * STT(음성→텍스트) 서버리스 프록시 — Deepgram Nova-3
 * -----------------------------------------------------------------------------
 * 2026 Speaking AI 채점 1순위 STT 엔진.
 *
 * Deepgram 장점 (사용자 제공 비교표 기준):
 *   • 초고속 (200~300ms 지연)
 *   • 단어(Word) 단위 타임스탬프 기본 제공 → WPM/무음 구간 정밀 측정
 *   • 클라우드 처리 (서버 컴퓨팅 부담 0)
 *   • Nova-3 최상위급 정확도
 *
 * 보안: DEEPGRAM_API_KEY 환경변수만 사용 (클라이언트에 키 노출 없음).
 *
 * 요청: raw 오디오 바이너리 (multipart 아님)
 *   - Content-Type: audio/webm | audio/mp4 | audio/wav | audio/mpeg 등
 *   - Body: 오디오 바이트 스트림
 *   - (옵션) X-Audio-Filename 헤더로 파일명 전달 — 확장자 추정용
 *
 * 응답 (정규화된 SttResult 호환 JSON):
 *   { text, duration?, words?: [{word,start,end}], source: 'deepgram' }
 *
 * ⚠️ raw 바이너리를 그대로 업스트림으로 전달하기 위해
 *    Vercel 기본 body parser 를 비활성화 (config.api.bodyParser = false).
 */
const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// raw 오디오 바이너리 전달 — body parser 비활성화
export const config = {
  api: {
    bodyParser: false,
  },
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Audio-Filename',
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

/** Deepgram 이 이해하는 Content-Type 으로 정규화 */
function normalizeAudioContentType(reqContentType: string, filename?: string): string {
  const ct = (reqContentType || '').toLowerCase();
  // 이미 audio/* 면 그대로 사용
  if (ct.startsWith('audio/')) return ct;

  // 파일명 확장자로 추정
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  if (ext === 'webm') return 'audio/webm';
  if (ext === 'mp4' || ext === 'm4a') return 'audio/mp4';
  if (ext === 'wav') return 'audio/wav';
  if (ext === 'mp3' || ext === 'mpeg') return 'audio/mpeg';
  if (ext === 'ogg') return 'audio/ogg';
  if (ext === 'flac') return 'audio/flac';

  // 기본값 — webm (MediaRecorder 기본 포맷)
  return 'audio/webm';
}

/** Deepgram 응답을 SttResult 호환 형태로 정규화 */
function normalizeDeepgramResponse(data: any): {
  text: string;
  duration?: number;
  words?: { word: string; start: number; end: number }[];
} {
  const channel = data?.results?.channels?.[0];
  const alt = channel?.alternatives?.[0];
  const transcript = String(alt?.transcript || '').trim();
  const duration = typeof data?.metadata?.duration === 'number'
    ? data.metadata.duration
    : undefined;

  // 단어 타임스탬프 추출 — WPM/무음 구간 계산용
  let words: { word: string; start: number; end: number }[] | undefined;
  const rawWords = alt?.words;
  if (Array.isArray(rawWords) && rawWords.length > 0) {
    words = rawWords
      .map((w: any) => ({
        word: String(w.word || w.text || ''),
        start: Number(w.start ?? w.start_time ?? 0),
        end: Number(w.end ?? w.end_time ?? 0),
      }))
      .filter((w: { word: string }) => w.word);
  }

  return { text: transcript, duration, words };
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

  if (!DEEPGRAM_API_KEY) {
    res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'DEEPGRAM_API_KEY 환경변수가 설정되지 않았습니다. Vercel/로컬 환경에 DEEPGRAM_API_KEY 를 등록하세요.',
    }));
    return;
  }

  try {
    const reqContentType = req.headers['content-type'] || '';
    const filename = (req.headers['x-audio-filename'] as string) || undefined;

    // multipart/form-data 인 경우 file 필드 추출 (레거시 호환)
    let audioBuffer: Buffer;
    let audioContentType: string;

    if (reqContentType.includes('multipart/form-data')) {
      // multipart — raw 바디 수집 후 file 파트 추출
      const rawBody = await collectRawBody(req);
      if (rawBody.length === 0) {
        res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '빈 요청 본문입니다.' }));
        return;
      }
      const parsed = extractMultipartFile(rawBody, reqContentType);
      if (!parsed) {
        res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'multipart file 필드를 찾을 수 없습니다.' }));
        return;
      }
      audioBuffer = parsed.buffer;
      audioContentType = normalizeAudioContentType(parsed.contentType, parsed.filename);
    } else {
      // raw 오디오 바이너리 (권장)
      const rawBody = await collectRawBody(req);
      if (rawBody.length === 0) {
        res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '빈 오디오 본문입니다.' }));
        return;
      }
      audioBuffer = rawBody;
      audioContentType = normalizeAudioContentType(reqContentType, filename);
    }

    // Deepgram API 호출 — Nova-3, 단어 타임스탬프, 구두점, 스마트 포맷
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
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': audioContentType,
        'Content-Length': String(audioBuffer.length),
      },
      body: audioBuffer,
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

    // 응답 정규화
    let data: any;
    try {
      data = JSON.parse(respText);
    } catch {
      res.writeHead(502, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Deepgram 응답 JSON 파싱 실패', detail: respText.slice(0, 200) }));
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
    console.error('Deepgram STT proxy error:', error);
    res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
  }
}

// ── multipart/form-data 파싱 (file 필드 추출) ────────────────────────────
// Vercel body parser 비활성화 시 자체 파싱 필요.
function extractMultipartFile(
  raw: Buffer,
  contentType: string,
): { buffer: Buffer; contentType: string; filename: string } | null {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!boundaryMatch) return null;
  const boundary = boundaryMatch[1] || boundaryMatch[2];
  if (!boundary) return null;

  const boundaryBuf = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = 0;
  while (true) {
    const idx = raw.indexOf(boundaryBuf, start);
    if (idx === -1) break;
    if (start > 0) parts.push(raw.slice(start, idx));
    start = idx + boundaryBuf.length;
    // CRLF 건너뛰기
    if (raw[start] === 0x0d && raw[start + 1] === 0x0a) start += 2;
    if (raw.slice(start, start + 2).toString() === '--') break; // 종료 boundary
  }

  for (const part of parts) {
    const partStr = part.toString('latin1');
    // 헤더/바디 분리 (\r\n\r\n)
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headerStr = partStr.slice(0, headerEnd);
    const bodyStart = Buffer.byteLength(partStr.slice(0, headerEnd + 4), 'latin1');
    const bodyEnd = part.length - 2; // trailing \r\n
    const body = part.slice(bodyStart, bodyEnd);

    // Content-Disposition 에서 name/filename 추출
    const nameMatch = headerStr.match(/name="([^"]*)"/);
    if (nameMatch && nameMatch[1] === 'file') {
      const fileMatch = headerStr.match(/filename="([^"]*)"/);
      const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
      return {
        buffer: body,
        contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream',
        filename: fileMatch ? fileMatch[1] : 'recording',
      };
    }
  }
  return null;
}
