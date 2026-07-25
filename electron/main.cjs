const { app, BrowserWindow, ipcMain, session, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Claude API는 이제 Vercel 서버리스 프록시를 통해서만 호출됩니다.
// (보안: API 키는 Electron에 노출되지 않고 Vercel 환경변수에서만 관리)
// CLAUDE_PROXY_ORIGIN은 Electron에서 절대 URL로 호출할 Vercel 프록시의 origin.
// 환경변수 CLAUDE_PROXY_ORIGIN이 있으면 사용, 없으면 패키지명 기반 추정 URL.
const CLAUDE_PROXY_ORIGIN = process.env.CLAUDE_PROXY_ORIGIN
  || 'https://toefl-allmyexam.vercel.app';

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

  if (process.env.ELECTRON_DEV === 'true') {
    // 개발 모드에서만 DevTools 열기 (Ctrl+Shift+I로도 가능)
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
  }
}

// ─────────────────────────────────────────────────────────────────
//  Claude 프록시 세션 인터셉터 — Vercel 프록시 호출 시 CORS 우회
//  이제 Claude API 키는 Electron에 저장되지 않고 Vercel 환경변수에서만 관리됨.
//  Electron 렌더러는 Vercel 프록시(CLAUDE_PROXY_ORIGIN)를 통해 Claude를 호출.
// ─────────────────────────────────────────────────────────────────
function setupClaudeApiInterceptor() {
  // 응답 헤더: CORS 헤더 주입 (Chromium CORS 검사 통과)
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: [`${CLAUDE_PROXY_ORIGIN}/*`] },
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
//  수동 업데이트 (GitHub Releases)
//  자동 다운로드 비활성화 — 사용자가 명시적으로 확인·다운로드·설치
// ─────────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  let autoUpdater;
  try {
    ({ autoUpdater } = require('electron-updater'));
  } catch (e) {
    console.log('electron-updater not installed yet — auto-update disabled');
    return;
  }

  // 자동 다운로드 비활성화 — 사용자가 수동으로 다운로드 버튼을 누를 때만 다운로드
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    console.log('📦 업데이트 발견:', info.version, '— 다운로드 대기 (사용자 확인 필요)');
    mainWindow?.webContents.send('update-available', info.version);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ 업데이트 다운로드 완료:', info.version, '— 설치 대기 (사용자 확인 필요)');
    mainWindow?.webContents.send('update-downloaded', info.version);
  });

  autoUpdater.on('error', (err) => {
    console.error('❌ 업데이트 오류:', err.message);
  });

  // IPC: 수동 업데이트 확인 (사용자가 버튼 클릭 시)
  ipcMain.handle('check-update', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return result?.updateInfo?.version || null;
    } catch (e) {
      console.error('Update check failed:', e.message);
      return null;
    }
  });

  // IPC: 업데이트 다운로드 (사용자가 다운로드 버튼 클릭 시)
  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return true;
    } catch (e) {
      console.error('Download failed:', e.message);
      return false;
    }
  });

  // IPC: 업데이트 설치 (앱 재시작)
  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  // 앱 시작 시 자동 확인 제거 — 사용자가 명시적으로 확인 버튼을 누를 때만 작동
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
