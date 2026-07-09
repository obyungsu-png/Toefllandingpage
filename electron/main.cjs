const { app, BrowserWindow, ipcMain, session, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Claude API 설정 (Electron main process에서 직접 호출 — CORS 제한 없음)
const CLAUDE_API_ORIGIN = 'https://apiclaude.cc';
const CLAUDE_API_KEY = 'sk-3bd59126ffdfa8ed1fcca872704a87bd00f8a81e00edb4b0126551f2dd8cb070';

// Google Translate TTS (고품질 음성 합성용)
const GOOGLE_TTS_ORIGIN = 'https://translate.google.com';

let mainWindow;

// ─────────────────────────────────────────────────────────────────
//  로컬 정적 파일 서버 (file:// 대신 HTTP 사용)
//  — asar 아카이브 내부의 이미지/정적 파일을 file://로 직접 접근할 수 없으므로
//    로컬 HTTP 서버로 build 폴더를 서빙합니다.
// ─────────────────────────────────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

function startStaticServer(rootDir, port) {
  const server = http.createServer((req, res) => {
    // URL에서 쿼리스트링 제거, 경로 정규화
    let urlPath = req.url.split('?')[0];
    // % 인코딩 디코딩
    urlPath = decodeURIComponent(urlPath);
    // 경로 트래버설 방지
    if (urlPath.includes('..')) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    // 기본 경로 → index.html
    if (urlPath === '/' || urlPath === '') {
      urlPath = '/index.html';
    }
    // SPA 라우팅: 확장자가 없으면 index.html 서빙 (HashRouter 사용하므로 거의 발생 안 함)
    const ext = path.extname(urlPath);
    if (!ext && !urlPath.includes('.')) {
      urlPath = '/index.html';
    }

    const filePath = path.join(rootDir, urlPath);
    const finalExt = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[finalExt] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`[static] 404: ${filePath}`);
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  server.listen(port, '127.0.0.1');
  return server;
}

// ─────────────────────────────────────────────────────────────────
//  BrowserWindow 생성
// ─────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_DEV) {
    // 개발 모드: Vite dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // 프로덕션: 로컬 HTTP 서버로 build 폴더 서빙
    // (file:// 대신 HTTP 사용 — asar 내부 정적 파일 접근 문제 해결)
    const possibleBuildDirs = [
      path.join(__dirname, '../build'),
      path.join(__dirname, '../../build'),
      path.join(process.cwd(), 'build'),
    ];
    let buildDir = null;
    for (const d of possibleBuildDirs) {
      console.log('Checking build dir:', d);
      if (fs.existsSync(path.join(d, 'index.html'))) {
        buildDir = d;
        break;
      }
    }
    if (buildDir) {
      const PORT = 18473; // 고정 포트 (충돌 회피용 임의 포트)
      console.log('Starting static server for:', buildDir, 'on port', PORT);
      startStaticServer(buildDir, PORT);
      mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
    } else {
      console.error('build/index.html not found in any location!');
    }
    mainWindow.webContents.openDevTools();
  }
}

// ─────────────────────────────────────────────────────────────────
//  Claude API 세션 인터셉터 — CORS 우회 + 인증 헤더 자동 추가
//  (렌더러에서 https://apiclaude.cc/v1/chat/completions 직접 fetch 가능)
// ─────────────────────────────────────────────────────────────────
function setupClaudeApiInterceptor() {
  // 1. 요청 헤더: Authorization 자동 추가
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [`${CLAUDE_API_ORIGIN}/*`] },
    (details, callback) => {
      details.requestHeaders['Authorization'] = `Bearer ${CLAUDE_API_KEY}`;
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  // 2. 응답 헤더: CORS 헤더 주입 (Chromium CORS 검사 통과)
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: [`${CLAUDE_API_ORIGIN}/*`] },
    (details, callback) => {
      details.responseHeaders['access-control-allow-origin'] = ['*'];
      details.responseHeaders['access-control-allow-methods'] = ['POST, OPTIONS'];
      details.responseHeaders['access-control-allow-headers'] = ['Content-Type, Authorization'];
      callback({ responseHeaders: details.responseHeaders });
    }
  );
}

// ─────────────────────────────────────────────────────────────────
//  Google TTS 세션 인터셉터 — CORS 우회
//  (렌더러에서 https://translate.google.com/translate_tts 직접 fetch 가능)
// ─────────────────────────────────────────────────────────────────
function setupGoogleTtsInterceptor() {
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: [`${GOOGLE_TTS_ORIGIN}/*`] },
    (details, callback) => {
      details.responseHeaders['access-control-allow-origin'] = ['*'];
      callback({ responseHeaders: details.responseHeaders });
    }
  );
}

// ─────────────────────────────────────────────────────────────────
//  자동 업데이트 (GitHub Releases)
// ─────────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  let autoUpdater;
  try {
    ({ autoUpdater } = require('electron-updater'));
  } catch (e) {
    console.log('electron-updater not installed yet — auto-update disabled');
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    console.log('📦 업데이트 발견:', info.version, '— 다운로드 중...');
    mainWindow?.webContents.send('update-available', info.version);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ 업데이트 다운로드 완료:', info.version, '— 재시작 시 적용');
    mainWindow?.webContents.send('update-downloaded', info.version);
  });

  autoUpdater.on('error', (err) => {
    console.error('❌ 자동 업데이트 오류:', err.message);
  });

  // IPC: 수동 업데이트 확인
  ipcMain.handle('check-update', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return result?.updateInfo?.version || null;
    } catch (e) {
      console.error('Update check failed:', e.message);
      return null;
    }
  });

  // IPC: 업데이트 설치 (앱 재시작)
  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  // 앱 시작 후 5초 뒤 업데이트 확인
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }, 5000);
}

// ─────────────────────────────────────────────────────────────────
//  파일 기반 로컬 캐시 (data.json)
//  — localStorage 용량 한계 대비, userData 폴더에 영구 저장
// ─────────────────────────────────────────────────────────────────
function getCachePath() {
  return path.join(app.getPath('userData'), 'data.json');
}

function setupCacheIpc() {
  ipcMain.handle('cache:read', (event, key) => {
    try {
      const cachePath = getCachePath();
      if (!fs.existsSync(cachePath)) return null;
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      return data[key]?.value ?? null;
    } catch {
      return null;
    }
  });

  ipcMain.handle('cache:write', (event, key, value) => {
    try {
      const cachePath = getCachePath();
      let data = {};
      if (fs.existsSync(cachePath)) {
        data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      }
      data[key] = { value, timestamp: Date.now() };
      fs.writeFileSync(cachePath, JSON.stringify(data), 'utf8');
      return true;
    } catch (e) {
      console.error('Cache write error:', e.message);
      return false;
    }
  });

  // IPC: 캐시 전체 읽기 (오프라인 모드용)
  ipcMain.handle('cache:read-all', () => {
    try {
      const cachePath = getCachePath();
      if (!fs.existsSync(cachePath)) return null;
      return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch {
      return null;
    }
  });
}

function setupMachineIdIpc() {
  const { execSync } = require('child_process');
  ipcMain.handle('get-machine-id', () => {
    try {
      const dataDir = app.getPath('userData');
      const idFile = path.join(dataDir, 'machine_id.txt');

      // 기존 캐시 파일 있으면 재사용 (WMIC 호출 최소화)
      if (fs.existsSync(idFile)) {
        const cached = fs.readFileSync(idFile, 'utf8').trim();
        if (cached && cached !== 'UNKNOWN_PC') return cached;
      }

      // 1차: 실제 하드웨어 UUID (BIOS/메인보드) — WMIC 명령
      try {
        const stdout = execSync('wmic csproduct get uuid', { timeout: 5000, windowsHide: true }).toString();
        const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
        const hwUuid = lines[1]; // 첫 줄은 "UUID" 헤더, 둘째 줄이 실제 값
        if (hwUuid && hwUuid !== '00000000-0000-0000-0000-000000000000') {
          fs.writeFileSync(idFile, hwUuid, 'utf8');
          console.log('[machine-id] WMIC 하드웨어 UUID 사용:', hwUuid);
          return hwUuid;
        }
      } catch (wmicErr) {
        console.warn('[machine-id] WMIC 실패, 파일 기반 UUID로 폴백:', wmicErr.message);
      }

      // 2차 폴백: 파일 기반 UUID (WMIC 실패 시)
      const { randomUUID } = require('crypto');
      const id = randomUUID();
      fs.writeFileSync(idFile, id, 'utf8');
      console.log('[machine-id] 파일 기반 UUID 사용:', id);
      return id;
    } catch (e) {
      console.error('Failed to get machine ID:', e);
      return null;
    }
  });
}

// ─────────────────────────────────────────────────────────────────
//  앱 시작
// ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // ── 마이크 권한 허용 (스피킹 녹음용 getUserMedia) ──
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media') {
      return true;
    }
    return false;
  });

  setupClaudeApiInterceptor();
  setupGoogleTtsInterceptor();
  setupCacheIpc();
  setupMachineIdIpc();
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
