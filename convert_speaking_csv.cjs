#!/usr/bin/env node
/**
 * 스피킹 CSV의 `8-11` 통합행을 4개 개별 행(Q8, Q9, Q10, Q11)으로 자동 분리.
 * convert_speaking_csv.py의 Node.js 포팅 (v2)
 *
 * 사용법:
 *   node convert_speaking_csv.cjs path/to/csv_TPO01_speaking.csv
 *   node convert_speaking_csv.cjs --suffix _v2 path/to/csv_TPO*_speaking.csv
 *   node convert_speaking_csv.cjs --dry-run path/to/csv_TPO*_speaking.csv
 */
const fs = require('fs');
const path = require('path');

const COMBINED_PATTERNS = new Set(['8-11', '8_11', '8~11', '8 - 11', '8–11']);
const INTERVIEW_START = 8;
const INTERVIEW_END = 11;

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function escapeCSVField(field) {
  if (field == null) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function convertFile(srcPath, suffix, dryRun) {
  let content = fs.readFileSync(srcPath, 'utf-8');
  // BOM 제거
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  const lines = content.split(/\r?\n/).filter(l => l.trim());

  if (lines.length === 0) {
    return `${path.basename(srcPath)}: EMPTY, skipped`;
  }

  const header = parseCSVLine(lines[0]);
  const body = lines.slice(1).map(parseCSVLine);

  // questionNumber 컬럼 인덱스
  const qnumIdx = header.indexOf('questionNumber');
  if (qnumIdx === -1) {
    return `${path.basename(srcPath)}: 'questionNumber' column not found, skipped`;
  }

  const qtextIdx = header.indexOf('questionText');
  const hasContext = header.includes('context');
  const hasModule = header.includes('module');
  const hasDay = header.includes('day');

  // 멱등성 체크
  const existingNums = new Set(body.map(r => (r[qnumIdx] || '').trim()));
  const alreadySplit = Array.from({ length: INTERVIEW_END - INTERVIEW_START + 1 }, (_, i) => String(INTERVIEW_START + i))
    .every(n => existingNums.has(n));
  const hasCombined = body.some(r => COMBINED_PATTERNS.has((r[qnumIdx] || '').trim()));

  if (alreadySplit && !hasCombined) {
    return `${path.basename(srcPath)}: already has Q8-Q11 as individual rows, unchanged`;
  }

  // 변환
  const newBody = [];
  let changed = false;
  let combinedCount = 0;

  for (const r of body) {
    if (COMBINED_PATTERNS.has((r[qnumIdx] || '').trim())) {
      combinedCount++;
      for (let n = INTERVIEW_START; n <= INTERVIEW_END; n++) {
        const clone = [...r];
        clone[qnumIdx] = String(n);
        if (qtextIdx !== -1) {
          clone[qtextIdx] = `Answer the researcher's question. (Question ${n} — audio only)`;
        }
        newBody.push(clone);
      }
      changed = true;
    } else {
      newBody.push(r);
    }
  }

  if (!changed) {
    return `${path.basename(srcPath)}: no '8-11' combined row found, unchanged`;
  }

  const dstPath = suffix
    ? srcPath.replace(/\.csv$/, suffix + '.csv')
    : srcPath;

  if (dryRun) {
    const stats = `combined_rows=${combinedCount}, new_rows=${newBody.length}, columns=${header.length}`;
    const modInfo = hasModule ? ', has_module=true' : '';
    const dayInfo = hasDay ? ', has_day=true' : '';
    const ctxInfo = hasContext ? ', has_context=true' : '';
    return `${path.basename(srcPath)}: would write ${newBody.length} rows to ${path.basename(dstPath)} (DRY RUN, ${stats}${modInfo}${dayInfo}${ctxInfo})`;
  }

  // 백업
  if (dstPath === srcPath) {
    const backupPath = srcPath.replace(/\.csv$/, '.bak.csv');
    fs.copyFileSync(srcPath, backupPath);
  }

  // 쓰기
  const output = [header, ...newBody]
    .map(row => row.map(escapeCSVField).join(','))
    .join('\r\n') + '\r\n';
  fs.writeFileSync(dstPath, output, 'utf-8');

  // 통계
  const statsParts = [
    `${body.length} → ${newBody.length} rows`,
    `combined_split=${combinedCount}`,
    `columns=${header.length}`,
  ];
  if (hasModule) statsParts.push('module=yes');
  if (hasDay) statsParts.push('day=yes');
  if (hasContext) statsParts.push('context=yes');

  return `${path.basename(srcPath)}: OK (${statsParts.join(', ')}) → ${path.basename(dstPath)}`;
}

// 메인
const args = process.argv.slice(2);
let suffix = '';
let dryRun = false;
const files = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--suffix') {
    suffix = args[++i];
  } else if (args[i] === '--dry-run') {
    dryRun = true;
  } else {
    files.push(args[i]);
  }
}

if (files.length === 0) {
  console.error('사용법: node convert_speaking_csv.cjs [--suffix _v2] [--dry-run] <csv_files...>');
  process.exit(1);
}

// 와일드카드 확장 (Windows에서는 쉘이 자동 확장하지 않으므로)
const glob = require('glob');
const expandedFiles = [];
for (const f of files) {
  if (f.includes('*') || f.includes('?')) {
    const matches = glob.sync(f);
    expandedFiles.push(...matches);
  } else {
    expandedFiles.push(f);
  }
}

const results = [];
for (const f of expandedFiles) {
  if (!fs.existsSync(f)) {
    console.log(`${f}: NOT FOUND`);
    results.push([f, 'NOT_FOUND']);
    continue;
  }
  try {
    const msg = convertFile(f, suffix, dryRun);
    console.log(msg);
    results.push([f, msg]);
  } catch (e) {
    console.log(`${f}: ERROR — ${e.message}`);
    results.push([f, `ERROR: ${e.message}`]);
  }
}

// 요약
const ok = results.filter(([, m]) => m.includes('OK')).length;
const skip = results.filter(([, m]) => m.includes('unchanged') || m.includes('skipped')).length;
const err = results.filter(([, m]) => m.includes('ERROR') || m.includes('NOT_FOUND')).length;
console.log(`\n요약: ${ok} 변환, ${skip} 스킵, ${err} 에러 (총 ${results.length} 파일)`);
