/**
 * TPO 7 리딩 섹션에서 문제 21, 32 제거.
 *
 * 배경: 라이팅 유형(이메일 작성, 아카데믹 디스커션 포스트)이 리딩 섹션에
 * 잘못 올라와 있어 사용자가 리딩 모의고사를 풀 때 라이팅 문제가 등장함.
 *
 * 사용:
 *   node remove_tpo7_reading_q21_q32.cjs           # dry-run (변경 없이 확인)
 *   node remove_tpo7_reading_q21_q32.cjs --apply   # 실제 삭제 후 저장
 */
const SUPABASE_URL = 'https://rpxmiyieukfuyhldqdto.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweG1peWlldWtmdXlobGRxZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzkxMTksImV4cCI6MjA3MjYxNTExOX0.H3lyRcpK6d3z24Y_ZgOOCoZ5n6U3WiZF1qZY3LNlYjA';
const TABLE = 'kv_store_e46cd33a';
const KEY = 'tpo:7';
const TARGETS = new Set(['21', '32']);
const HEADERS = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

const APPLY = process.argv.includes('--apply');

async function getValue() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?key=eq.${encodeURIComponent(KEY)}&select=value`,
    { headers: HEADERS }
  );
  const rows = await res.json();
  return rows && rows.length > 0 ? rows[0].value : null;
}

async function upsertValue(value) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: {
      ...HEADERS,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ key: KEY, value }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
}

function describe(q) {
  const num = q.questionNumber ?? '?';
  const type = q.questionType ?? '?';
  const title = q.passageTitle ?? '';
  const text = (q.questionText || '').slice(0, 60).replace(/\s+/g, ' ');
  return `Q${num} | ${type} | ${title} | ${text}`;
}

(async () => {
  const test = await getValue();
  if (!test) {
    console.log(`${KEY}: 데이터 없음`);
    return;
  }
  const sections = Array.isArray(test.sections) ? test.sections : [];
  const reading = sections.find(s => s.sectionType === 'Reading');
  if (!reading || !Array.isArray(reading.questions)) {
    console.log('Reading 섹션이 없거나 questions 배열이 아님');
    return;
  }

  const removed = [];
  const kept = [];
  for (const q of reading.questions) {
    const num = String(q.questionNumber ?? '');
    if (TARGETS.has(num)) removed.push(q);
    else kept.push(q);
  }

  console.log(`Reading 문제 수: ${reading.questions.length} → ${kept.length}`);
  console.log(`제거 대상 (${removed.length}개):`);
  removed.forEach(q => console.log(`  - ${describe(q)}`));

  if (removed.length === 0) {
    console.log('제거할 문제가 없어 저장을 건너뜁니다.');
    return;
  }

  if (!APPLY) {
    console.log('\ndry-run 모드입니다. 실제 적용하려면 --apply 옵션을 붙여 다시 실행하세요.');
    return;
  }

  reading.questions = kept;
  await upsertValue(test);
  console.log('\n저장 완료.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
