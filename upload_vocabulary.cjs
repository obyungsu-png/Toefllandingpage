/**
 * 어휘 데이터 복구 스크립트
 * - toefl-hard (vol.2): InitializeVocabularyVol2.tsx에서 836개 단어 추출 → 60개씩 DAY 구성
 * - toefl-easy (vol.1): vocaWordSets.ts에서 403개 단어 추출 → 40개씩 DAY 구성
 * Edge Function의 /vocabulary-bulk-multi/:tabType 엔드포인트를 통해 일괄 업로드
 */
const fs = require('fs');
const path = require('path');

const SERVER_BASE_URL = 'https://rpxmiyieukfuyhldqdto.supabase.co/functions/v1/make-server-e46cd33a';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweG1peWlldWtmdXlobGRxZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzkxMTksImV4cCI6MjA3MjYxNTExOX0.H3lyRcpK6d3z24Y_ZgOOCoZ5n6U3WiZF1qZY3LNlYjA';

const srcDir = path.join(__dirname, 'src', 'components');

/**
 * TypeScript 파일에서 단어 객체 배열을 추출
 * 형식: { english: "...", korean: "...", definition: "...", synonyms: "..." }
 */
function extractWords(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const words = [];

  // 단어 객체 패턴 매칭
  const regex = /\{\s*english:\s*"([^"]+)"\s*,\s*korean:\s*"([^"]+)"\s*,\s*definition:\s*"([^"]+)"\s*,\s*synonyms:\s*"([^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    words.push({
      english: match[1],
      korean: match[2],
      definition: match[3],
      synonyms: match[4],
    });
  }
  return words;
}

/**
 * 단어 배열을 DAY별로 그룹화
 */
function groupByDay(words, wordsPerDay) {
  const wordsByDay = {};
  const totalDays = Math.ceil(words.length / wordsPerDay);
  for (let day = 1; day <= totalDays; day++) {
    const start = (day - 1) * wordsPerDay;
    const end = Math.min(start + wordsPerDay, words.length);
    wordsByDay[day] = words.slice(start, end);
  }
  return { wordsByDay, totalDays };
}

/**
 * Edge Function에 어휘 데이터 업로드
 */
async function uploadVocabulary(tabType, wordsByDay) {
  const url = `${SERVER_BASE_URL}/vocabulary-bulk-multi/${tabType}`;
  console.log(`  → POST ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ wordsByDay }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  return result;
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  어휘 데이터 복구 스크립트 시작');
  console.log('═══════════════════════════════════════\n');

  // ── 1. toefl-hard (vol.2): InitializeVocabularyVol2.tsx ──
  console.log('📦 [1/2] toefl-hard (vol.2) 데이터 추출 중...');
  const vol2Path = path.join(srcDir, 'InitializeVocabularyVol2.tsx');
  const vol2Words = extractWords(vol2Path);
  console.log(`  ✓ 추출 완료: ${vol2Words.length}개 단어`);

  const vol2Grouped = groupByDay(vol2Words, 60); // vol.2는 60개씩
  console.log(`  ✓ DAY 구성: ${vol2Grouped.totalDays}일 (DAY당 60개)\n`);

  console.log('🚀 toefl-hard 업로드 중...');
  try {
    const result = await uploadVocabulary('toefl-hard', vol2Grouped.wordsByDay);
    console.log(`  ✅ 성공! ${result.totalUploaded}개 단어가 ${result.days}개 DAY에 저장됨\n`);
  } catch (err) {
    console.error(`  ❌ 실패: ${err.message}\n`);
  }

  // ── 2. toefl-easy (vol.1): vocaWordSets.ts ──
  console.log('📦 [2/2] toefl-easy (vol.1) 데이터 추출 중...');
  const vol1Path = path.join(srcDir, 'vocaWordSets.ts');
  const vol1Words = extractWords(vol1Path);
  console.log(`  ✓ 추출 완료: ${vol1Words.length}개 단어`);

  const vol1Grouped = groupByDay(vol1Words, 40); // vol.1은 40개씩
  console.log(`  ✓ DAY 구성: ${vol1Grouped.totalDays}일 (DAY당 40개)\n`);

  console.log('🚀 toefl-easy 업로드 중...');
  try {
    const result = await uploadVocabulary('toefl-easy', vol1Grouped.wordsByDay);
    console.log(`  ✅ 성공! ${result.totalUploaded}개 단어가 ${result.days}개 DAY에 저장됨\n`);
  } catch (err) {
    console.error(`  ❌ 실패: ${err.message}\n`);
  }

  console.log('═══════════════════════════════════════');
  console.log('  복구 스크립트 완료');
  console.log('═══════════════════════════════════════');
}

main().catch(console.error);
