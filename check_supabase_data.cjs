/**
 * Supabase 데이터 유실 상태 진단 스크립트 (v2)
 * 사용: node check_supabase_data.cjs
 */
const SUPABASE_URL = 'https://rpxmiyieukfuyhldqdto.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweG1peWlldWtmdXlobGRxZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzkxMTksImV4cCI6MjA3MjYxNTExOX0.H3lyRcpK6d3z24Y_ZgOOCoZ5n6U3WiZF1qZY3LNlYjA';
const HEADERS = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

const TABLES = [
  // 핵심 CMS
  'listening_images',
  // 라이선스
  'users_profile',
  'license_keys',
  // 데이터
  'kv_store_e46cd33a',
  'reports',
  'speaking_recordings',
  'reading_highlights',
  // 추가 추정 테이블
  'tpo_questions',
  'writing_questions',
  'speaking_questions',
  'advertisements',
  'lms_contents',
];

async function checkTable(name) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${name}?select=*&limit=1`, {
      headers: { ...HEADERS, Prefer: 'count=exact' },
    });
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 404 || text.includes('does not exist') || text.includes('relation')) {
        return { status: '❌ 없음', detail: '테이블 없음' };
      }
      return { status: '⚠️ 오류', detail: `HTTP ${res.status}` };
    }
    const range = res.headers.get('content-range');
    const count = range ? range.split('/')[1] : '?';
    return { status: '✅ 존재', detail: `${count} rows` };
  } catch (e) {
    return { status: '⚠️ 오류', detail: e.message };
  }
}

// listening_images 상세: test_type 별 row 수
async function checkListeningImages() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/listening_images?select=*&limit=3`, { headers: HEADERS });
    if (!res.ok) return ['  ⚠️ 조회 실패: ' + res.status];
    const rows = await res.json();
    if (!rows || rows.length === 0) return ['  ❌ 데이터 없음 (0 rows)'];
    const sample = rows[0];
    const cols = Object.keys(sample);
    return [
      `  컬럼: ${cols.join(', ')}`,
      `  샘플 key/id: ${JSON.stringify(sample).slice(0, 200)}`,
    ];
  } catch (e) {
    return ['  ⚠️ 오류: ' + e.message];
  }
}

// kv_store 내 모든 key 나열 (CMS/어휘/하이라이트 등 확인)
async function listAllKvKeys() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store_e46cd33a?select=key&limit=200`, { headers: HEADERS });
    const rows = await res.json();
    if (!rows) return ['  ⚠️ 조회 실패'];
    return rows.map(r => `   • ${r.key}`);
  } catch (e) {
    return ['  ⚠️ 오류: ' + e.message];
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Supabase 데이터 유실 상태 진단 (v2)');
  console.log('═══════════════════════════════════════════════════\n');

  console.log('📊 [테이블 row 수]');
  for (const t of TABLES) {
    const r = await checkTable(t);
    console.log(`  ${r.status}  ${t.padEnd(24)} — ${r.detail}`);
  }

  console.log('\n📦 [listening_images 상세 — 핵심 CMS]');
  const li = await checkListeningImages();
  li.forEach(l => console.log(l));

  console.log('\n🔑 [kv_store 모든 key]');
  const keys = await listAllKvKeys();
  keys.forEach(k => console.log(k));

  console.log('\n═══════════════════════════════════════════════════');
}

main().catch(console.error);
