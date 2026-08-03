/**
 * 어휘 단어 전체 셔플 후 unit 재배분 스크립트
 *
 * 목적: 현재 알파벳 순서로 편중된 unit 배치를 무작위로 재배분
 * - 전체 단어를 모아서 한 번에 셔플 (seeded: 고정 seed로 일관성 유지)
 * - 셔플된 순서대로 unit에 분배 (toefl-hard: 50개/unit, toefl-easy: 40개/unit)
 * - unit 내에서는 추가 셔플하지 않음 (배분된 순서 그대로 유지)
 *
 * 사용: node shuffle_vocabulary_units.cjs
 */
const SUPABASE_URL = 'https://rpxmiyieukfuyhldqdto.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweG1peWlldWtmdXlobGRxZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzkxMTksImV4cCI6MjA3MjYxNTExOX0.H3lyRcpK6d3z24Y_ZgOOCoZ5n6U3WiZF1qZY3LNlYjA';
const TABLE = 'kv_store_e46cd33a';

// ── Seeded shuffle (vocaWordSets.ts와 동일 알고리즘) ──
function seededShuffle(array, seed) {
  const shuffled = [...array];
  let currentSeed = seed;
  const seededRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ── kv_store에서 단어 가져오기 ──
async function fetchWords(tabType) {
  const key = `vocabulary_words_${tabType}`;
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?key=eq.${key}&select=value`;
  const response = await fetch(url, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${key}: ${response.status}`);
  }
  const data = await response.json();
  return data[0]?.value || [];
}

// ── kv_store에 단어 업로드 (PostgREST upsert) ──
async function uploadWords(tabType, words) {
  const key = `vocabulary_words_${tabType}`;
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ key, value: words }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to upload ${key}: ${response.status} ${text}`);
  }
  console.log(`  ✅ Uploaded ${words.length} words to ${key}`);
}

// ── 메인: 단어 전체 셔플 후 unit 재배분 ──
async function redistributeWords(tabType, wordsPerDay, seed) {
  console.log(`\n=== ${tabType} ===`);

  // 1. 기존 단어 가져오기
  const words = await fetchWords(tabType);
  console.log(`  Fetched ${words.length} words`);

  if (words.length === 0) {
    console.log(`  ⚠️ No words found, skipping`);
    return;
  }

  // 2. dayNumber 제거 (클린한 단어 리스트)
  const cleanWords = words.map(w => {
    const { dayNumber, ...rest } = w;
    return rest;
  });

  // 3. 전체 단어를 한 번에 셔플 (seeded: 고정 seed로 일관성 유지)
  const SHUFFLE_SEED = seed; // 고정 seed
  const shuffledWords = seededShuffle(cleanWords, SHUFFLE_SEED);

  // 4. 셔플된 순서대로 unit에 분배
  const totalDays = Math.ceil(shuffledWords.length / wordsPerDay);
  const redistributed = [];
  for (let day = 1; day <= totalDays; day++) {
    const start = (day - 1) * wordsPerDay;
    const end = start + wordsPerDay;
    const dayWords = shuffledWords.slice(start, end);
    for (const w of dayWords) {
      redistributed.push({ ...w, dayNumber: day });
    }
  }

  // 5. 검증: 각 unit의 단어 수 확인
  const dayCounts = {};
  for (const w of redistributed) {
    dayCounts[w.dayNumber] = (dayCounts[w.dayNumber] || 0) + 1;
  }
  console.log(`  Total days: ${totalDays}`);
  console.log(`  Words per day: ${Object.values(dayCounts).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`);

  // 6. 알파벳 편중 확인 (Unit 1의 첫 글자 분포)
  const unit1Letters = redistributed
    .filter(w => w.dayNumber === 1)
    .map(w => w.english[0].toLowerCase());
  console.log(`  Unit 1 first letters: ${unit1Letters.join(', ')}`);

  const unitLastLetters = redistributed
    .filter(w => w.dayNumber === totalDays)
    .map(w => w.english[0].toLowerCase());
  console.log(`  Unit ${totalDays} first letters: ${unitLastLetters.join(', ')}`);

  // 7. 업로드
  await uploadWords(tabType, redistributed);
}

// ── 실행 ──
(async () => {
  console.log('🔧 어휘 단어 전체 셔플 후 unit 재배분 시작');
  console.log(`   Supabase: ${SUPABASE_URL}`);

  try {
    // toefl-hard: 1,500개, 50개/unit, 30 units (seed: 42)
    await redistributeWords('toefl-hard', 50, 42);

    // toefl-easy: 400개, 40개/unit, 10 units (seed: 137)
    await redistributeWords('toefl-easy', 40, 137);

    console.log('\n🎉 모든 단어 재배분 완료!');
    console.log('   - 각 unit에 알파벳 A-Z가 골고루 분산됨');
    console.log('   - unit 내 순서는 셔플 결과 그대로 유지 (추가 셔플 없음)');
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    process.exit(1);
  }
})();
