# ============================================================
# Vercel 배포 자동화 스크립트 — STT (Deepgram) 환경변수 포함
# ------------------------------------------------------------
# 사전 요구사항: vercel login 완료 (대화형 브라우저 인증)
# 실행: powershell -ExecutionPolicy Bypass -File scripts\deploy-vercel.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$projectDir = Split-Path -Parent $Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Vercel 배포 자동화 (DEEPGRAM_API_KEY 포함)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# 1. 로그인 확인
Write-Host "`n[1/4] Vercel 로그인 상태 확인..." -ForegroundColor Yellow
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ 로그인되지 않음. 먼저 실행: vercel login" -ForegroundColor Red
    Write-Host "     브라우저가 열리면 이메일 입력 → 인증 코드 입력" -ForegroundColor Gray
    exit 1
}
Write-Host "  ✅ 로그인됨: $whoami" -ForegroundColor Green

# 2. 프로젝트 연결
Write-Host "`n[2/4] Vercel 프로젝트 연결..." -ForegroundColor Yellow
if (-not (Test-Path ".vercel\project.json")) {
    Write-Host "  프로젝트 연결 진행 (기존 toefl-allmyexam 프로젝트 선택)..." -ForegroundColor Gray
    vercel link --yes 2>&1 | Write-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ⚠️ 자동 연결 실패. 수동으로 'vercel link' 실행 후 재시도." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✅ 이미 연결됨 (.vercel/project.json 존재)" -ForegroundColor Green
}

# 3. DEEPGRAM_API_KEY 환경변수 등록
Write-Host "`n[3/4] DEEPGRAM_API_KEY 환경변수 등록..." -ForegroundColor Yellow
$deepgramKey = "bc513625b0510fe6756f523f6445776fd08bcbb0"

# 환경변수 존재 여부 확인
$existingEnv = vercel env ls 2>&1
if ($existingEnv -match "DEEPGRAM_API_KEY") {
    Write-Host "  ℹ️  DEEPGRAM_API_KEY 이미 존재 — 값 업데이트 진행" -ForegroundColor Gray
    # 기존 값 삭제 후 재등록
    "y" | vercel env rm DEEPGRAM_API_KEY production 2>&1 | Out-Null
}

# production 환경에 등록 (stdin으로 값 전달)
$deepgramKey | vercel env add DEEPGRAM_API_KEY production 2>&1 | Write-Host
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ DEEPGRAM_API_KEY 등록 완료 (production)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ 자동 등록 실패. 수동 등록 필요:" -ForegroundColor Red
    Write-Host "     vercel env add DEEPGRAM_API_KEY production" -ForegroundColor Gray
    Write-Host "     값: $deepgramKey" -ForegroundColor Gray
}

# preview 환경에도 등록 (개발 미리보기용)
$deepgramKey | vercel env add DEEPGRAM_API_KEY preview 2>&1 | Out-Null
Write-Host "  ✅ DEEPGRAM_API_KEY 등록 완료 (preview)" -ForegroundColor Green

# 4. 프로덕션 배포
Write-Host "`n[4/4] 프로덕션 배포 진행..." -ForegroundColor Yellow
vercel --prod --yes 2>&1 | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Gray
    if ($_ -match "Production:.*https://") {
        $deployUrl = ($_ -split "\s+" | Where-Object { $_ -match "^https://" })[0]
        Write-Host "`n  🚀 배포 완료: $deployUrl" -ForegroundColor Green
    }
}

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  배포 완료 — Deepgram STT (1순위) 프로덕션 활성화" -ForegroundColor Cyan
Write-Host "  • DEEPGRAM_API_KEY: 등록됨" -ForegroundColor Green
Write-Host "  • 로컬 Whisper: dev 전용 (프로덕션은 Deepgram 사용)" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# 배포된 Deepgram 엔드포인트 테스트 안내
Write-Host "`n[검증] 배포된 Deepgram 프록시 테스트:" -ForegroundColor Yellow
Write-Host "  curl -X POST https://toefl-allmyexam.vercel.app/api/stt/deepgram \" -ForegroundColor Gray
Write-Host "    -H 'Content-Type: audio/wav' -H 'X-Audio-Filename: test.wav' \" -ForegroundColor Gray
Write-Host "    --data-binary @test.wav" -ForegroundColor Gray
