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

// ── 시스템 프록시 자동 감지 (Windows) ─────────────────────────────────────
// Node.js native fetch() (undici) 는 HTTP_PROXY/HTTPS_PROXY env var 나
// Windows 시스템 프록시(WinINET) 를 자동 사용하지 않음 → HuggingFace 모델
// 다운로드가 "fetch failed" 로 실패.
// 이 블록은 Windows 레지스트리에서 시스템 프록시를 읽어 env var 설정 + undici
// ProxyAgent 를 글로벌 dispatcher 로 등록하여 @xenova/transformers 의 fetch()
// 가 프록시를 사용하도록 함. (중국/기업망 등 프록시 환경 필수)
// 이미 HTTP_PROXY/HTTPS_PROXY env var 가 설정되어 있으면 존중하고 건너뜀.
function setupSystemProxy() {
  if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
    return; // 수동 설정 존중
  }
  if (process.platform !== 'win32') {
    return; // Windows 전용
  }
  let proxyUrl = null;
  try {
    const { execSync } = require('child_process');
    // ProxyEnable 확인
    const enableOut = execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable',
      { encoding: 'utf8', timeout: 5000 }
    );
    const enableMatch = enableOut.match(/ProxyEnable\s+REG_DWORD\s+0x(\w+)/);
    if (!enableMatch || enableMatch[1] === '0') {
      return; // 프록시 비활성화
    }
    // ProxyServer 읽기
    const serverOut = execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer',
      { encoding: 'utf8', timeout: 5000 }
    );
    const serverMatch = serverOut.match(/ProxyServer\s+REG_SZ\s+(\S+)/);
    if (!serverMatch) return;
    proxyUrl = serverMatch[1];
    // 정규화: "127.0.0.1:7897" -> "http://127.0.0.1:7897"
    if (!/^https?:\/\//i.test(proxyUrl)) {
      proxyUrl = 'http://' + proxyUrl;
    }
  } catch {
    return; // 레지스트리 읽기 실패 - 조용히 무시
  }
  if (!proxyUrl) return;
  process.env.HTTP_PROXY = proxyUrl;
  process.env.HTTPS_PROXY = proxyUrl;
  console.log(`[local-whisper] 시스템 프록시 감지: ${proxyUrl}`);
  // undici ProxyAgent 로 native fetch() 가 프록시를 사용하도록 설정
  try {
    const { ProxyAgent, setGlobalDispatcher } = require('undici');
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
    console.log('[local-whisper] undici ProxyAgent 적용 완료 (HuggingFace 다운로드용)');
  } catch (e) {
    console.log('[local-whisper] undici ProxyAgent 미적용:', e.message, '(env var만 설정됨)');
  }
}
setupSystemProxy();

// ── sharp 스텁 주입 ──────────────────────────────────────────────────────
// @xenova/transformers v2 가 'import sharp from "sharp"' (정적 import) 를 사용.
// sharp native binary(libvips) 가 설치되지 않은 환경(Windows + GitHub 네트워크 차단)
// 에서 require('sharp') 가 크래시 → Transformers.js 전체 로딩 실패.
// 오디오(Whisper) 전용이므로 sharp(이미지 처리) 는 불필요 — require 를 가로채
// 빈 스텁을 반환하여 이미지 처리 경로를 우회.
// (이미지 비전 모델 사용 시에는 sharp 을 정상 설치해야 함)
const Module = require('module');
const _originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'sharp') {
    // 빈 객체 반환 → Transformers.js 의 `else if (sharp)` 분기에서
    // loadImageFunction 이 설정되지 않아 이미지 처리가 비활성화됨.
    // 오디오 파이프라인(Whisper)에는 영향 없음.
    return {};
  }
  return _originalLoad.apply(this, arguments);
};

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
 * WAV 파일 수동 디코딩 → Float32Array (Transformers.js Node.js 전용)
 * -----------------------------------------------------------------------------
 * Node.js 환경에는 AudioContext(Web API) 가 없어 Transformers.js 가 파일 경로로
 * 오디오를 로드하지 못함 ("AudioContext is not available" 에러).
 * 따라서 WAV 파일을 직접 파싱하여 PCM → Float32Array 로 변환 후 파이프라인에 전달.
 * (참고: https://huggingface.co/docs/transformers.js/guides/node-audio-processing)
 *
 * 지원 포맷: 16-bit PCM, mono/stereo, 8/16/24/32-bit 정수 PCM, IEEE float
 * webm/mp4 등은 ffmpeg 설치가 필요 (이 함수에서 처리하지 않음).
 */
function decodeWav(buffer) {
  const view = new DataView(buffer);
  // RIFF 헤더 검증
  if (view.getUint32(0, false) !== 0x52494646 /* 'RIFF' */) {
    throw new Error('유효한 WAV 파일이 아닙니다 (RIFF 헤더 누락).');
  }
  // 'fmt ' 청크 찾기
  let offset = 12;
  let sampleRate = 16000;
  let bitsPerSample = 16;
  let numChannels = 1;
  let audioFormat = 1; // 1=PCM, 3=IEEE float
  let dataOffset = -1;
  let dataLength = 0;
  while (offset + 8 <= buffer.byteLength) {
    const chunkId = view.getUint32(offset, false);
    const chunkSize = view.getUint32(offset + 4, true);
    if (chunkId === 0x666d7420 /* 'fmt ' */) {
      audioFormat = view.getUint16(offset + 8, true);
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (chunkId === 0x64617461 /* 'data' */) {
      dataOffset = offset + 8;
      dataLength = chunkSize;
      break;
    }
    offset += 8 + chunkSize + (chunkSize % 2); // 패딩
  }
  if (dataOffset < 0) {
    throw new Error('WAV 파일에 data 청크가 없습니다.');
  }
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(dataLength / bytesPerSample);
  const float32 = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    let sample = 0;
    const pos = dataOffset + i * bytesPerSample;
    if (bitsPerSample === 16) {
      // 16-bit signed PCM → -1.0..1.0
      sample = view.getInt16(pos, true) / 32768;
    } else if (bitsPerSample === 8) {
      // 8-bit unsigned PCM (0..255, 중심 128)
      sample = (view.getUint8(pos) - 128) / 128;
    } else if (bitsPerSample === 24) {
      // 24-bit signed PCM (little-endian)
      const b0 = view.getUint8(pos);
      const b1 = view.getUint8(pos + 1);
      const b2 = view.getInt8(pos + 2);
      sample = ((b2 << 16) | (b1 << 8) | b0) / 8388608;
    } else if (bitsPerSample === 32) {
      if (audioFormat === 3) {
        // 32-bit IEEE float
        sample = view.getFloat32(pos, true);
      } else {
        // 32-bit signed PCM
        sample = view.getInt32(pos, true) / 2147483648;
      }
    }
    float32[i] = sample;
  }
  // 스테레오 → 모노 믹스다운
  let mono = float32;
  if (numChannels > 1) {
    const monoLen = Math.floor(numSamples / numChannels);
    mono = new Float32Array(monoLen);
    for (let i = 0; i < monoLen; i++) {
      let sum = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        sum += float32[i * numChannels + ch];
      }
      mono[i] = sum / numChannels;
    }
  }
  return { audio: mono, sampleRate };
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

    // Node.js 환경에서는 AudioContext 가 없어 Transformers.js 가 파일 경로로
    // 오디오를 로드하지 못함 → WAV 는 수동 디코딩하여 Float32Array 직접 전달.
    // webm/mp4 디코딩은 ffmpeg 필요 (Transformers.js 가 내부적으로 사용).
    const ext = contentTypeToExt(contentType, filename);
    const arrayBuffer = audioBuffer.buffer.slice(
      audioBuffer.byteOffset,
      audioBuffer.byteOffset + audioBuffer.byteLength
    );

    // 오디오 입력 준비: WAV 는 Float32Array 직접 전달, webm/mp4 는 임시 파일
    // (AudioContext 미사용 — Node.js 전용 처리)
    // tmpFile 은 try/finally 양쪽에서 접근해야 하므로 try 밖에서 선언.
    let audioInput;
    let tmpFile = null;
    if (ext === 'wav') {
      const decoded = decodeWav(arrayBuffer);
      audioInput = decoded.audio;
    } else {
      // webm/mp4 — ffmpeg 가 있어야 Transformers.js 가 디코딩 가능
      const tmpDir = os.tmpdir();
      tmpFile = path.join(tmpDir, `whisper-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
      fs.writeFileSync(tmpFile, audioBuffer);
      audioInput = tmpFile;
    }

    try {
      // 모델 로드 (lazy)
      const transcriber = await getTranscriber();
      if (!transcriber) {
        throw new Error('Whisper 모델이 로드되지 않았습니다. @xenova/transformers 설치를 확인하세요.');
      }

      // 변환 — 단어 단위 타임스탬프 요청
      const output = await transcriber(audioInput, {
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
      // 임시 파일 정리 (webm/mp4 케이스)
      if (tmpFile) {
        try { fs.unlinkSync(tmpFile); } catch {}
      }
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
