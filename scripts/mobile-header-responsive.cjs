/**
 * 모바일 시험 헤더 반응형 일괄 치환 스크립트
 * - 시험 화면 상단 헤더(TOEFL PC 재현용)를 모바일에서 컴팩트하게 조정
 * - 데스크톱(md 이상) 레이아웃은 그대로 유지
 *
 * 사용: node scripts/mobile-header-responsive.cjs
 */
const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '..', 'src', 'components');

// [찾을 문자열, 바꿀 문자열] — 정확한 리터럴 매칭만 사용
const REPLACEMENTS = [
  // 1. 헤더 컨테이너 — 모바일에서 높이/패딩 축소
  [
    'h-16 flex items-center justify-between px-8 shadow-lg',
    'h-14 md:h-16 flex items-center justify-between px-3 md:px-8 shadow-lg',
  ],
  // 2. 로고 텍스트 — 모바일에서 축소
  [
    "text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer",
    "text-white text-base md:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer",
  ],
  // 3. 버튼 그룹 간격
  [
    'flex items-center gap-3">\r\n',
    'flex items-center gap-1.5 md:gap-3">\r\n',
  ],
  // 4. Volume 버튼 (bg-[#0A6068], gap-3)
  [
    'flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2',
    'flex items-center gap-1.5 md:gap-3 bg-[#0A6068] border border-white rounded-lg px-2.5 py-1.5 md:px-5 md:py-2',
  ],
  // 5. Back 버튼 (bg-[#0A6068], gap-2)
  [
    'flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2',
    'flex items-center gap-1 md:gap-2 bg-[#0A6068] border border-white rounded-lg px-2.5 py-1.5 md:px-5 md:py-2',
  ],
  // 6. Next 버튼 (bg-white)
  [
    'flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2',
    'flex items-center gap-1 md:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2.5 py-1.5 md:px-5 md:py-2',
  ],
  // 7. 버튼 텍스트 — 흰색
  [
    "text-white font-['Inter',_sans-serif] font-semibold text-base",
    "text-white font-['Inter',_sans-serif] font-semibold text-xs md:text-base",
  ],
  // 8. 버튼 텍스트 — Next(틸)
  [
    "text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base",
    "text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs md:text-base",
  ],
];

let totalFiles = 0;
let totalReplacements = 0;
const changedFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.tsx')) processFile(full);
  }
}

function processFile(filePath) {
  totalFiles++;
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  let fileReplacements = 0;

  for (const [from, to] of REPLACEMENTS) {
    if (!from) continue;
    const count = content.split(from).length - 1;
    if (count > 0) {
      content = content.split(from).join(to);
      fileReplacements += count;
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    changedFiles.push({ file: path.basename(filePath), replacements: fileReplacements });
    totalReplacements += fileReplacements;
  }
}

walk(COMPONENTS_DIR);

console.log(`\n=== 모바일 헤더 반응형 치환 완료 ===`);
console.log(`검사 파일: ${totalFiles}개`);
console.log(`변경 파일: ${changedFiles.length}개, 총 치환: ${totalReplacements}건\n`);
for (const c of changedFiles) {
  console.log(`  ✅ ${c.file} (${c.replacements}건)`);
}
