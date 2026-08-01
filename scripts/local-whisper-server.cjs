/**
 * local-whisper-server.cjs — 로컬 Whisper STT dev 서버
 * -----------------------------------------------------------------------------
 * 2026 Speaking AI 채점 2순위 STT 폴백 (오프라인 + 무료).
 *
 * Deepgram API 키 미설정 또는 네트워크 실패 시 useStt.ts 가 이 서버로 폴백.
 *
 * 특징 (사용자 제공 비교표 기준):
 *   • 100% 무료 (오픈소스, large-v3/base 모델)
 *   • 오프라인 동작 (모델은 최초 1회 다운로드)
 *   • 단어 단위 타임스탬프 지원 (return_timestamps: 'word')
 *   • CPU 동작 시 Deepgram 보다 느림 (2~5초+ 소요)
 *
 * 실행:
 *   npm run whisper:local
 *
 * 엔드포인트:
 *   POST http://localhost:8787/transcribe
 *     - Body: raw 오디오 바이너리 (webm/mp4/wav)
 *     - Header: Content-Type (audio/*)
 *     - Header: X-Audio-Filename (확장자 추정용, 옵션)
 *   응답: { text, words?: [{word,start,end}], duration?, source: 'local-whisper' }
 *
 * 사전 요구사항:
 *   • webm/mp4 디코딩을 위해 ffmpeg 가 시스템 PATH 에 있어야 함
 *     (Transformers.js 가 내부적으로 ffmpeg 사용).
 *     - Windows: https://ffmpeg.org/download.html 또는 `winget install ffmpeg`
 *   • 최초 실행 시 모델 자동 다운로드 (~150MB for whisper-base.en)
 *   • 환경변수 WHISPER_MODEL 로 모델 변경 가능
 *     (기본값: Xenova/whisper-base.en, 옵션: Xenova/whisper-tiny.en, Xenova/whisper-large-v3)
 *
 * ⚠️ 이 서버는 로컬 dev 전용 — Vercel 서버리스에서는 실행 불가 (컴퓨팅/시간제한).
 *    프로덕션에서는 Deepgram(1순위) 사용 권장.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.WHISPER_PORT || 8787;
const MODEL = process.env.WHISPER_MODEL || 'Xenova/whisper-base.en';

let pipeline = null;
let transcriber = null;
let isModelLoading = false;

/**
 * Transformers.js 파이프라인 로드 (lazy — 최초 요청 시)
 */
async function getTranscriber() {
  if (transcriber) return transcriber;
  if (isModelLoading) {
    // 로딩 중이면 완료까지 대기
    while (isModelLoading) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return transcriber;
  }
  isModelLoading = true;
  try {
    console.log(`[local-whisper] 모델 로딩 중: ${MODEL} (최초 실행 시 다운로드, 약 1~2분 소요)`);
    pipeline = require('@xenova/transformers').pipeline;
    transcriber = await pipeline('automatic-speech-recognition', MODEL, {
      progress_callback: (info) => {
        if (info.status === 'progress') {
          const pct = Math.round((info.progress || 0) * 100);
          process.stdout.write(`\r[local-whisper] 다운로드: ${pct}%`);
          if (pct >= 100) process.stdout.write('\n');
        }
      },
    });
    console.log(`[local-whisper] 모델 로딩 완료: ${MODEL}`);
  } catch (err) {
    console.error('[local-whisper] 모델 로딩 실패:', err.message);
    console.error('[local-whisper] @xenova/transformers 설치 확인: npm install');
    transcriber = null;
    throw err;
  } finally {
    isModelLoading = false;
  }
  return transcriber;
}

/**
 * 오디오 Content-Type → 확장자
 */
function contentTypeToExt(contentType, filename) {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('mp4') || ct.includes('m4a')) return 'm4a';
  if (ct.includes('webm')) return 'webm';
  if (ct.includes('wav')) return 'wav';
  if (ct.includes('mpeg') || ct.includes('mp3')) return 'mp3';
  if (ct.includes('ogg')) return 'ogg';
  if (filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext) return ext;
  }
  return 'webm';
}

/**
 * 요청 바디 수집
 */
function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Audio-Filename');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      model: MODEL,
      loaded: !!transcriber,
      loading: isModelLoading,
    }));
    return;
  }

  if (req.method !== 'POST' || !req.url.startsWith('/transcribe')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found. Use POST /transcribe' }));
    return;
  }

  try {
    const contentType = req.headers['content-type'] || '';
    const filename = req.headers['x-audio-filename'] || '';
    const audioBuffer = await collectBody(req);

    if (audioBuffer.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '빈 오디오 본문입니다.' }));
      return;
    }

    // 임시 파일로 저장 (Transformers.js 가 파일에서 디코딩)
    const ext = contentTypeToExt(contentType, filename);
    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `whisper-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
    fs.writeFileSync(tmpFile, audioBuffer);

    try {
      // 모델 로드 (lazy)
      const transcriber = await getTranscriber();
      if (!transcriber) {
        throw new Error('Whisper 모델이 로드되지 않았습니다. @xenova/transformers 설치를 확인하세요.');
      }

      // 변환 — 단어 단위 타임스탬프 요청
      const output = await transcriber(tmpFile, {
        return_timestamps: 'word',
        chunk_length_s: 30,
        stride_length_s: 5,
      });

      const text = String(output.text || '').trim();

      // 단어 타임스탬프 추출
      let words;
      if (Array.isArray(output.chunks)) {
        words = output.chunks
          .map((c) => {
            const ts = c.timestamp || [];
            const word = String(c.text || '').trim();
            const start = typeof ts[0] === 'number' ? ts[0] : 0;
            const end = typeof ts[1] === 'number' ? ts[1] : start;
            return { word, start, end };
          })
          .filter((w) => w.word);
      }

      // duration: 마지막 단어 end 시간
      let duration;
      if (words && words.length > 0) {
        duration = words[words.length - 1].end;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        text,
        words,
        duration: duration > 0 ? duration : undefined,
        source: 'local-whisper',
      }));
    } finally {
      // 임시 파일 정리
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  } catch (err) {
    console.error('[local-whisper] 변환 오류:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: `로컬 Whisper 변환 오류: ${err.message}`,
      hint: 'ffmpeg 설치 여부와 @xenova/transformers 패키지를 확인하세요.',
    }));
  }
});

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  로컬 Whisper STT 서버 (오프라인 폴백)');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  엔드포인트: http://localhost:${PORT}/transcribe`);
  console.log(`  헬스체크:   http://localhost:${PORT}/health`);
  console.log(`  모델:       ${MODEL}`);
  console.log(`  환경변수:   WHISPER_MODEL, WHISPER_PORT`);
  console.log('───────────────────────────────────────────────────────────');
  console.log('  ⚠️ 최초 요청 시 모델 다운로드로 인해 지연됩니다 (~1~2분).');
  console.log('  ⚠️ webm/mp4 디코딩에 ffmpeg 가 필요합니다.');
  console.log('  ⚠️ 로컬 dev 전용 — Vercel 서버리스에서는 미실행.');
  console.log('  useStt.ts 가 Deepgram 실패 시 자동 폴백합니다.');
  console.log('═══════════════════════════════════════════════════════════');
});
