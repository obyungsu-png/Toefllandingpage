/**
 * TPO/Test 문제 데이터 상세 진단
 * 각 TPO N / Test N의 섹션별 문제 수 확인
 * 사용: node check_tpo_data.cjs
 */
const SUPABASE_URL = 'https://rpxmiyieukfuyhldqdto.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweG1peWlldWtmdXlobGRxZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzkxMTksImV4cCI6MjA3MjYxNTExOX0.H3lyRcpK6d3z24Y_ZgOOCoZ5n6U3WiZF1qZY3LNlYjA';
const HEADERS = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

async function getKvValue(key) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/kv_store_e46cd33a?key=eq.${encodeURIComponent(key)}&select=value`,
    { headers: HEADERS }
  );
  const rows = await res.json();
  return rows && rows.length > 0 ? rows[0].value : null;
}

function analyzeQuestions(value, label) {
  if (!value) {
    return `  ❌ ${label}: 데이터 없음`;
  }
  // value는 보통 { questions: [...] } 또는 배열
  let questions = null;
  if (Array.isArray(value)) questions = value;
  else if (value && Array.isArray(value.questions)) questions = value.questions;
  else if (value && typeof value === 'object') {
    // tpo:N 구조 추정
    const keys = Object.keys(value);
    return `  📦 ${label}: object keys=[${keys.join(',')}]`;
  }
  if (!questions) return `  ⚠️ ${label}: 구조 불명`;
  const sections = {};
  questions.forEach(q => {
    const s = q.section || q.type || 'unknown';
    sections[s] = (sections[s] || 0) + 1;
  });
  const summary = Object.entries(sections).map(([k, v]) => `${k}:${v}`).join(', ');
  return `  ✅ ${label}: ${questions.length}문제 (${summary})`;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  TPO/Test 문제 데이터 상세 진단');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. tpo-tests 목록 (메타데이터)
  console.log('📋 [tpo-tests 목록 — CMS 등록된 테스트 메타]');
  const tpoList = await getKvValue('tpo-tests');
  if (tpoList) {
    const arr = Array.isArray(tpoList) ? tpoList : (tpoList.tests || []);
    console.log(`  등록된 TPO/Test 수: ${arr.length}`);
    arr.forEach(t => {
      console.log(`   • ${t.testType || '?'} ${t.testNumber ?? '?'} — year:${t.year ?? '-'} month:${t.month ?? '-'} day:${t.day ?? '-'}`);
    });
  } else {
    console.log('  ❌ tpo-tests 목록 없음');
  }

  console.log('\n📋 [test-tests 목록]');
  const testList = await getKvValue('test-tests');
  if (testList) {
    const arr = Array.isArray(testList) ? testList : (testList.tests || []);
    console.log(`  등록된 Test 수: ${arr.length}`);
    arr.forEach(t => {
      console.log(`   • ${t.testType || '?'} ${t.testNumber ?? '?'} — year:${t.year ?? '-'} month:${t.month ?? '-'}`);
    });
  } else {
    console.log('  ❌ test-tests 목록 없음');
  }

  // 2. 각 TPO N 문제 데이터
  console.log('\n📝 [TPO별 문제 데이터]');
  for (let n = 1; n <= 10; n++) {
    const v = await getKvValue(`tpo:${n}`);
    console.log(analyzeQuestions(v, `tpo:${n}`));
  }

  console.log('\n📝 [Test별 문제 데이터]');
  for (let n = 1; n <= 5; n++) {
    const v = await getKvValue(`test:${n}`);
    console.log(analyzeQuestions(v, `test:${n}`));
  }

  // 3. reports / test-results
  console.log('\n📊 [결과 데이터]');
  const reports = await getKvValue('reports');
  console.log(reports ? `  ✅ reports: ${Array.isArray(reports) ? reports.length : '?'}건` : '  ❌ reports 없음');
  const testResults = await getKvValue('test-results');
  console.log(testResults ? `  ✅ test-results: ${Array.isArray(testResults) ? testResults.length : '?'}건` : '  ❌ test-results 없음');

  // 4. lms-contents
  console.log('\n📚 [LMS 콘텐츠]');
  const lms = await getKvValue('lms-contents');
  console.log(lms ? `  ✅ lms-contents: ${Array.isArray(lms) ? lms.length : '?'}건` : '  ❌ lms-contents 없음');

  console.log('\n═══════════════════════════════════════════════════');
}

main().catch(console.error);
