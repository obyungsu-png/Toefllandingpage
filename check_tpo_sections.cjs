/**
 * TPO/Test 섹션별 문제 수 상세 진단
 * 사용: node check_tpo_sections.cjs
 */
const SUPABASE_URL = 'https://rpxmiyieukfuyhldqdto.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweG1peWlldWtmdXlobGRxZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzkxMTksImV4cCI6MjA3MjYxNTExOX0.H3lyRcpK6d3z24Y_ZgOOCoZ5n6U3WiZF1qZY3LNlYjA';
const HEADERS = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

async function getKvValue(key) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/kv_store_e46cd33a?key=eq.${encodeURIComponent(key)}&select=value`, { headers: HEADERS });
  const rows = await res.json();
  return rows && rows.length > 0 ? rows[0].value : null;
}

function analyzeSections(value) {
  if (!value || !value.sections) return null;
  const sections = value.sections;
  const out = {};
  if (Array.isArray(sections)) {
    sections.forEach(s => {
      const name = s.section || s.name || s.type || 'unknown';
      const qCount = Array.isArray(s.questions) ? s.questions.length : (s.questionCount || 0);
      out[name] = qCount;
    });
  } else {
    // object: { reading: [...], listening: [...], ... }
    Object.entries(sections).forEach(([name, qs]) => {
      out[name] = Array.isArray(qs) ? qs.length : (qs && Array.isArray(qs.questions) ? qs.questions.length : '?');
    });
  }
  return out;
}

async function main() {
  console.log('TPO/Test 섹션별 문제 수\n');
  const items = [];
  for (let n = 1; n <= 6; n++) items.push(['tpo', n]);
  for (let n = 1; n <= 2; n++) items.push(['test', n]);

  for (const [type, n] of items) {
    const key = `${type}:${n}`;
    const v = await getKvValue(key);
    if (!v) { console.log(`${key}: 없음`); continue; }
    const sections = analyzeSections(v);
    const date = `${v.year ?? '-'}/${v.month ?? '-'}/${v.day ?? '-'}`;
    if (!sections) {
      console.log(`${key} (${date}): sections 구조 없음`);
      continue;
    }
    const summary = Object.entries(sections).map(([k, c]) => `${k}:${c}`).join(' | ');
    console.log(`${key} (${date}): ${summary}`);
  }
}
main().catch(console.error);
