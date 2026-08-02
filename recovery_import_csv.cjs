/**
 * CSV 파일에서 TPO 데이터를 복구하여 rpx kv_store_e46cd33a에 가져오는 스크립트
 *
 * 사용법: node recovery_import_csv.cjs
 *
 * CSV 파일 그룹:
 * - 3.30 TPO: reading_tpo + listening_tpo + writing → tpo:1
 * - 4.1 TPO: reading_tpo + listening_tpo + writing → tpo:2
 * - 4.28 TPO: reading_tpo + listening_tpo + writing + speaking → tpo:3
 * - 4.28 TPO Module2: reading_module2_tpo + listening_module2_tpo → tpo:4
 * - 4.28 Test: reading + listening + writing + speaking → test:1 (일반 테스트)
 * - 4.28 Test Module2: reading_module2 + listening_module2 → test:2
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://rpxmiyieukfuyhldqdto.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJweG1peWlldWtmdXlobGRxZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzkxMTksImV4cCI6MjA3MjYxNTExOX0.H3lyRcpK6d3z24Y_ZgOOCoZ5n6U3WiZF1qZY3LNlYjA';
const TABLE = 'kv_store_e46cd33a';
const CSV_DIR = path.join(__dirname);

// ============================================================
// CSV 파서 (따옴표, 줄바꿈, 쉼표 처리)
// ============================================================
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentLine += '""';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  // 헤더 파싱
  const headers = parseCSVLine(lines[0]);

  // 데이터 행 파싱
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// ============================================================
// CSV 행을 TPO 섹션/질문으로 변환
// ============================================================
function rowsToSection(rows, sectionType, sectionId) {
  const questions = [];
  const passages = [];

  for (const row of rows) {
    if (!row.questionText && row.passageTitle) {
      // 지문 전용 행 (passage-only row)
      passages.push({
        title: row.passageTitle,
        text: row.passageText,
        script: row.scriptText || '',
        module: row.module || 'Module 1',
      });
      continue;
    }

    // 질문 행
    const question = {
      id: `${sectionId}-q${questions.length + 1}`,
      questionNumber: parseInt(row.questionNumber) || row.questionNumber,
      questionText: row.questionText || '',
      questionType: row.questionType || 'Multiple Choice',
      difficulty: row.difficulty || '보통',
      module: row.module || 'Module 1',
    };

    // 객관식 옵션
    if (row.optionA || row.optionB || row.optionC || row.optionD) {
      question.options = [row.optionA, row.optionB, row.optionC, row.optionD].filter(o => o);
      question.correctAnswer = row.correctAnswer || '';
    }

    // 지문 참조
    if (row.passageTitle) {
      question.passageTitle = row.passageTitle;
    }
    if (row.passageText) {
      question.passageText = row.passageText;
    }
    if (row.scriptText) {
      question.scriptText = row.scriptText;
    }

    // 설명
    if (row.explanation) {
      question.explanation = row.explanation;
    }

    // 오디오/이미지 파일
    if (row.audioFileName) {
      question.audioFileName = row.audioFileName;
    }
    if (row.imageFileName) {
      question.imageFileName = row.imageFileName;
    }

    // 빈칸 채우기 (dictation)
    if (row.dictationBlanks) {
      question.dictationBlanks = row.dictationBlanks;
    }
    if (row.organization) {
      question.organization = row.organization;
    }
    if (row.organizationBlanks) {
      question.organizationBlanks = row.organizationBlanks;
    }

    questions.push(question);
  }

  const totalTime = {
    'Reading': 3600,
    'Listening': 2400,
    'Writing': 1800,
    'Speaking': 1200,
  }[sectionType] || 3600;

  return {
    id: sectionId,
    sectionType,
    instructions: getSectionInstructions(sectionType),
    totalTime,
    questions,
    passages: passages.length > 0 ? passages : undefined,
  };
}

function getSectionInstructions(sectionType) {
  const instructions = {
    'Reading': 'Read the passage and answer the questions.',
    'Listening': 'Listen to the audio and answer the questions.',
    'Writing': 'Write your essay response.',
    'Speaking': 'Speak your response.',
  };
  return instructions[sectionType] || '';
}

// ============================================================
// TPO 객체 생성
// ============================================================
function createTPO(testNumber, testType, year, month, dateMemo, sections) {
  const now = new Date().toISOString();
  return {
    id: `${testType.toLowerCase()}-${testNumber}`,
    testNumber,
    testType,
    year,
    month,
    isOfficial: testType === 'TPO',
    dateMemo,
    sections,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================
// Supabase REST API로 kv_store에 데이터 삽입
// ============================================================
async function upsertKV(key, value) {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}`;
  const headers = {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation,resolution=merge-duplicates',
  };

  const body = JSON.stringify({ key, value });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`  ❌ Failed to upsert key "${key}":`, error.message);
    throw error;
  }
}

// ============================================================
// 메인 복구 로직
// ============================================================
async function main() {
  console.log('🚀 TPO 데이터 복구 시작\n');

  // CSV 파일 존재 확인
  const csvFiles = {
    '3.30': {
      reading: 'csv_3.30_reading_tpo.csv',
      listening: 'csv_3.30_listening_tpo.csv',
      writing: 'csv_3.30_writing.csv',
    },
    '4.1': {
      reading: 'csv_4.1_reading_tpo.csv',
      listening: 'csv_4.1_listening_tpo.csv',
      writing: 'csv_4.1_writing.csv',
    },
    '4.28_tpo': {
      reading: 'csv_4.28_reading_tpo.csv',
      listening: 'csv_4.28_listening_tpo.csv',
      writing: 'csv_4.28_writing.csv',
      speaking: 'csv_4.28_speaking.csv',
    },
    '4.28_tpo_module2': {
      reading: 'csv_4.28_reading_module2_tpo.csv',
      listening: 'csv_4.28_listening_module2_tpo.csv',
    },
    '4.28_test': {
      reading: 'csv_4.28_reading.csv',
      listening: 'csv_4.28_listening.csv',
      writing: 'csv_4.28_writing.csv',
      speaking: 'csv_4.28_speaking.csv',
    },
    '4.28_test_module2': {
      reading: 'csv_4.28_reading_module2.csv',
      listening: 'csv_4.28_listening_module2.csv',
    },
  };

  // TPO 그룹 정의
  const tpoGroups = [
    {
      key: 'tpo:1',
      testNumber: 1,
      testType: 'TPO',
      year: 2024, month: 3,
      dateMemo: '3월 30일 TPO',
      sections: ['3.30', 'reading', 'listening', 'writing'],
    },
    {
      key: 'tpo:2',
      testNumber: 2,
      testType: 'TPO',
      year: 2024, month: 4,
      dateMemo: '4월 1일 TPO',
      sections: ['4.1', 'reading', 'listening', 'writing'],
    },
    {
      key: 'tpo:3',
      testNumber: 3,
      testType: 'TPO',
      year: 2024, month: 4,
      dateMemo: '4월 28일 TPO',
      sections: ['4.28_tpo', 'reading', 'listening', 'writing', 'speaking'],
    },
    {
      key: 'tpo:4',
      testNumber: 4,
      testType: 'TPO',
      year: 2024, month: 4,
      dateMemo: '4월 28일 TPO Module 2',
      sections: ['4.28_tpo_module2', 'reading', 'listening'],
    },
    {
      key: 'test:1',
      testNumber: 1,
      testType: 'Test',
      year: 2024, month: 4,
      dateMemo: '4월 28일 실제 테스트',
      sections: ['4.28_test', 'reading', 'listening', 'writing', 'speaking'],
    },
    {
      key: 'test:2',
      testNumber: 2,
      testType: 'Test',
      year: 2024, month: 4,
      dateMemo: '4월 28일 실제 테스트 Module 2',
      sections: ['4.28_test_module2', 'reading', 'listening'],
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const group of tpoGroups) {
    console.log(`\n📦 처리 중: ${group.key} (${group.dateMemo})`);

    const [dateKey, ...sectionTypes] = group.sections;
    const dateFiles = csvFiles[dateKey];
    if (!dateFiles) {
      console.log(`  ⚠️  날짜 그룹 "${dateKey}"를 찾을 수 없음, 건너뜀`);
      failCount++;
      continue;
    }

    const sections = [];
    for (const sectionType of sectionTypes) {
      const fileName = dateFiles[sectionType];
      if (!fileName) {
        console.log(`  ⚠️  ${sectionType} 섹션 파일 없음, 건너뜀`);
        continue;
      }

      const filePath = path.join(CSV_DIR, fileName);
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  파일 없음: ${fileName}, 건너뜀`);
        continue;
      }

      try {
        const rows = parseCSV(filePath);
        const sectionId = `${sectionType.toLowerCase()}-${group.testNumber}`;
        const section = rowsToSection(rows, sectionType, sectionId);
        console.log(`  📄 ${sectionType}: ${section.questions.length}개 질문`);
        sections.push(section);
      } catch (error) {
        console.error(`  ❌ ${sectionType} 파싱 실패: ${error.message}`);
      }
    }

    if (sections.length === 0) {
      console.log(`  ⚠️  섹션이 없음, 건너뜀`);
      failCount++;
      continue;
    }

    const tpo = createTPO(
      group.testNumber,
      group.testType,
      group.year,
      group.month,
      group.dateMemo,
      sections
    );

    console.log(`  💾 저장 중: ${group.key} (${sections.length}개 섹션)...`);

    try {
      await upsertKV(group.key, tpo);
      console.log(`  ✅ 저장 성공: ${group.key}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ 저장 실패: ${group.key}`);
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 복구 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
  console.log(`${'='.repeat(60)}`);

  // 요약
  console.log(`\n📋 복구된 데이터:`);
  console.log(`  - TPO 1 (3월 30일)`);
  console.log(`  - TPO 2 (4월 1일)`);
  console.log(`  - TPO 3 (4월 28일)`);
  console.log(`  - TPO 4 (4월 28일 Module 2)`);
  console.log(`  - Test 1 (4월 28일 일반)`);
  console.log(`  - Test 2 (4월 28일 Module 2 일반)`);
  console.log(`\n⚠️  나머지 TPO 11개+는 xmdf 프로젝트에만 존재했으며,`);
  console.log(`   Supabase 지원팀의 xmdf 프로젝트 복구가 필요합니다.`);
}

main().catch(console.error);
