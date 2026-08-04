/**
 * kv_store_e46cd33a 진단 + 유실 키 복구 스크립트
 *
 * 사용법:
 *   node scripts/check-restore-kv.cjs           → 진단만 (읽기 전용)
 *   node scripts/check-restore-kv.cjs --restore → 누락된 단일 키를 기본값으로 복구
 *
 * 복구 대상 (단일 키):
 *   - advertisements    → []
 *   - training-config   → {}
 *   - training-results  → []
 *
 * 참고: TPO/Test/Training 실제 문제 데이터는 개별 키(tpo:N, test:N, training:N)로
 * 저장되며, 유실된 콘텐츠 자체는 이 스크립트로 재생성할 수 없습니다.
 * (키가 없어도 GET API는 빈 배열을 정상 반환하므로 앱은 정상 동작합니다.)
 */
const { createClient } = require('@supabase/supabase-js');

const PROJECT_ID = 'rpxmiyieukfuyhldqdto';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweG1peWlldWtmdXlobGRxZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzkxMTksImV4cCI6MjA3MjYxNTExOX0.H3lyRcpK6d3z24Y_ZgOOCoZ5n6U3WiZF1qZY3LNlYjA';
const TABLE = 'kv_store_e46cd33a';

const supabase = createClient(`https://${PROJECT_ID}.supabase.co`, ANON_KEY);

const RESTORE_DEFAULTS = {
  'advertisements': [],
  'training-config': {},
  'training-results': [],
  'students': [],
};

async function main() {
  const doRestore = process.argv.includes('--restore');

  // 1. 전체 키 목록 조회
  const { data, error } = await supabase.from(TABLE).select('key');
  if (error) {
    console.error('❌ 키 목록 조회 실패:', error.message);
    process.exit(1);
  }
  const keys = new Set(data.map(r => r.key));
  console.log(`\n=== kv_store 전체 키 ${keys.size}개 ===`);

  // 2. prefix별 개수 집계
  const countPrefix = (p) => [...keys].filter(k => k.startsWith(p)).length;
  console.log(`tpo:N 개별 키       : ${countPrefix('tpo:')}개`);
  console.log(`test:N 개별 키      : ${countPrefix('test:')}개`);
  console.log(`training:N 개별 키  : ${countPrefix('training:')}개`);

  // 3. 중요 단일 키 존재 여부
  console.log('\n=== 단일 키 상태 ===');
  const singleKeys = ['advertisements', 'training-config', 'training-results',
    'test-results', 'students', 'lms-contents', 'reports', 'question-types-config',
    'question-types-results', 'custom-avatar-gallery'];
  for (const k of singleKeys) {
    console.log(`${keys.has(k) ? '✅' : '❌'} ${k}`);
  }

  // 4. 복구 모드
  if (!doRestore) {
    console.log('\n(복구하려면: node scripts/check-restore-kv.cjs --restore)');
    return;
  }

  console.log('\n=== 복구 시작 ===');
  for (const [key, defaultValue] of Object.entries(RESTORE_DEFAULTS)) {
    if (keys.has(key)) {
      console.log(`⏭️  ${key} — 이미 존재, 건너뜀`);
      continue;
    }
    const { error: upErr } = await supabase.from(TABLE).upsert({ key, value: defaultValue });
    if (upErr) {
      console.error(`❌ ${key} 복구 실패:`, upErr.message);
    } else {
      console.log(`✅ ${key} 복구 완료 (기본값: ${JSON.stringify(defaultValue)})`);
    }
  }

  if (countPrefix('training:') === 0) {
    console.log('\n⚠️  training:N 문제 데이터는 유실 상태입니다.');
    console.log('   → GET API는 빈 배열을 정상 반환하므로 앱 오류는 없습니다.');
    console.log('   → 실제 문제 콘텐츠는 CMS에서 다시 등록해야 합니다.');
  }
  console.log('\n완료.');
}

main().catch(e => { console.error('❌ 오류:', e.message); process.exit(1); });
