/**
 * 단어장 KV 진단/복구 스크립트
 *
 * 사용법:
 *   node scripts/diagnose-vocab.cjs                          → 4개 탭 모두 진단
 *   node scripts/diagnose-vocab.cjs --tab=toefl-easy         → 특정 탭만 진단
 *   node scripts/diagnose-vocab.cjs --tab=toefl-easy --dump  → words[i] 처음 3개 원본 출력
 *   node scripts/diagnose-vocab.cjs --tab=toefl-easy --regroup=40
 *       → 이 탭 단어들의 dayNumber 를 legacy 40개씩 재할당해 dry-run 결과 미리보기
 *   node scripts/diagnose-vocab.cjs --tab=toefl-easy --regroup=40 --apply
 *       → 위 재할당을 실제로 저장 (되돌릴 수 없음)
 *
 * 진단 결과 읽는 법:
 *   • total  : KV 에 저장된 단어 총 개수
 *   • days   : "DAY 선택" 그리드에 나타나야 하는 DAY 엔트리 목록
 *   • dayNumber 분포 : 실제 단어들이 어떤 dayNumber 값을 가지고 있는지
 *   • 미아(orphan) : dayNumber 는 있는데 해당 id 의 DAY 엔트리가 없는 단어 수
 *                    (UI 에서는 안 보이지만 DB 에는 살아있음)
 */

const SUPABASE_URL = 'https://rpxmiyieukfuyhldqdto.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweG1peWlldWtmdXlobGRxZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzkxMTksImV4cCI6MjA3MjYxNTExOX0.H3lyRcpK6d3z24Y_ZgOOCoZ5n6U3WiZF1qZY3LNlYjA';
const SERVER = `${SUPABASE_URL}/functions/v1/make-server-e46cd33a`;
const HEADERS = {
  Authorization: `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
};

const TABS = ['custom', 'etymology', 'toefl-easy', 'toefl-hard'];

// ---------------------------------------------------------------
// args
// ---------------------------------------------------------------
const args = process.argv.slice(2).reduce((acc, raw) => {
  const [k, v = 'true'] = raw.replace(/^--/, '').split('=');
  acc[k] = v;
  return acc;
}, {});
const targetTabs = args.tab ? [args.tab] : TABS;
const doDump = args.dump === 'true';
const regroupSize = args.regroup ? parseInt(args.regroup, 10) : null;
const doApply = args.apply === 'true';

// ---------------------------------------------------------------
// API helpers (via the app's own edge function)
// ---------------------------------------------------------------
async function fetchWords(tabType) {
  const res = await fetch(`${SERVER}/vocabulary/${tabType}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET /vocabulary/${tabType} → HTTP ${res.status}`);
  const data = await res.json();
  return data.words || [];
}

async function fetchDays(tabType) {
  const res = await fetch(`${SERVER}/vocabulary-days/${tabType}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET /vocabulary-days/${tabType} → HTTP ${res.status}`);
  const data = await res.json();
  return data.days || [];
}

// Rewrite all words for a tab (uses bulk-multi with replaceExisting).
// We split by dayNumber and send { wordsByDay } — server will replace each DAY.
async function rewriteAllWords(tabType, remappedWords) {
  const wordsByDay = {};
  for (const w of remappedWords) {
    const dn = w.dayNumber;
    if (!wordsByDay[dn]) wordsByDay[dn] = [];
    // strip dayNumber; server re-adds it
    const { dayNumber, ...rest } = w;
    wordsByDay[dn].push(rest);
  }
  const res = await fetch(`${SERVER}/vocabulary-bulk-multi/${tabType}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ wordsByDay, replaceExisting: true }),
  });
  if (!res.ok) {
    throw new Error(`POST bulk-multi → HTTP ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

async function restoreDaysUpTo(tabType, upTo) {
  const res = await fetch(`${SERVER}/vocabulary-days/${tabType}/restore`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ upTo }),
  });
  if (!res.ok) {
    // restore endpoint may not be deployed yet — that's OK, ignore silently
    return null;
  }
  return await res.json();
}

// ---------------------------------------------------------------
// per-tab report
// ---------------------------------------------------------------
async function diagnose(tabType) {
  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`  탭: ${tabType}`);
  console.log(`═══════════════════════════════════════════════════`);

  const words = await fetchWords(tabType);
  const days = await fetchDays(tabType);

  console.log(`  total 단어 : ${words.length}`);
  console.log(`  DAY 엔트리 : ${days.length}개`);
  const dayIds = new Set(days.map((d) => d.id));
  const daySummary = days
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((d) => `${d.id}:${d.name}`)
    .join(', ');
  console.log(`  DAY 목록   : ${daySummary}`);

  // dayNumber 분포
  const distribution = {};
  let noDayNumber = 0;
  for (const w of words) {
    const dn = w.dayNumber;
    if (dn === undefined || dn === null) {
      noDayNumber++;
      continue;
    }
    distribution[dn] = (distribution[dn] || 0) + 1;
  }
  const sortedKeys = Object.keys(distribution)
    .map(Number)
    .sort((a, b) => a - b);

  console.log(`  dayNumber 분포:`);
  if (noDayNumber > 0) {
    console.log(`     (dayNumber 없음): ${noDayNumber}개`);
  }
  let orphanCount = 0;
  for (const dn of sortedKeys) {
    const cnt = distribution[dn];
    const orphan = !dayIds.has(dn) ? '  ← 미아! (DAY 엔트리 없음)' : '';
    if (orphan) orphanCount += cnt;
    console.log(`     DAY ${String(dn).padStart(3)} : ${String(cnt).padStart(4)}개${orphan}`);
  }

  console.log(`  요약: 총 ${words.length}개 중 ${orphanCount}개가 미아 상태`);

  if (doDump && words.length > 0) {
    console.log(`\n  📦 단어 원본 샘플 (처음 3개):`);
    for (const w of words.slice(0, 3)) {
      console.log(`     ${JSON.stringify(w)}`);
    }
  }

  // ---------- regroup mode ----------
  if (regroupSize && regroupSize > 0) {
    console.log(`\n  🔧 regroup=${regroupSize} : dayNumber 를 ${regroupSize}개씩 재할당`);
    const remapped = words.map((w, index) => {
      const newDay = Math.floor(index / regroupSize) + 1;
      return { ...w, dayNumber: newDay };
    });

    const preview = {};
    for (const w of remapped) preview[w.dayNumber] = (preview[w.dayNumber] || 0) + 1;
    console.log(`     결과 분포:`);
    for (const dn of Object.keys(preview).map(Number).sort((a, b) => a - b)) {
      console.log(`        DAY ${String(dn).padStart(3)} : ${preview[dn]}개`);
    }

    if (doApply) {
      console.log(`\n  💾 --apply 감지: 실제 KV 에 저장합니다...`);
      const result = await rewriteAllWords(tabType, remapped);
      console.log(`  ✅ 저장 완료. (총 ${result.totalUploaded ?? remapped.length}개 재할당)`);

      // DAY 엔트리 자동 보정 (id 1..maxDay)
      const maxDay = Math.max(...Object.keys(preview).map(Number));
      const restored = await restoreDaysUpTo(tabType, maxDay);
      if (restored) {
        console.log(`  ✅ DAY 엔트리 ${restored.added ?? 0}개 자동 추가 완료.`);
      } else {
        console.log(`  ℹ️  DAY 복원 엔드포인트 미배포 — UI 의 "DAY 1~50 복원" 버튼을 눌러 주세요.`);
      }
    } else {
      console.log(`\n  ℹ️  실제로 저장하려면 --apply 를 추가로 붙여 다시 실행하세요.`);
    }
  }
}

async function main() {
  console.log('단어장 KV 진단 스크립트\n');
  console.log(`대상 탭: ${targetTabs.join(', ')}`);
  if (regroupSize) console.log(`regroup 모드: ${regroupSize}개씩 재할당 ${doApply ? '(APPLY!)' : '(dry-run)'}`);

  for (const tab of targetTabs) {
    try {
      await diagnose(tab);
    } catch (e) {
      console.error(`\n  ⚠️  ${tab} 진단 실패: ${e.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('완료.');
}

main().catch((e) => {
  console.error('치명적 오류:', e);
  process.exit(1);
});
