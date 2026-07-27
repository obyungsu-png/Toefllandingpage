import { TPOTest } from '../components/ContentManagement';

/**
 * "2026년 6월 1회 TPO" 형태의 표시용 라벨을 만든다.
 *
 * - 내부 testNumber는 식별자(ID)로 그대로 두고, 화면 제목만 연·월·회차로 표시한다.
 * - 회차(N회)는 같은 testType + 같은 year + 같은 month 안에서 testNumber 오름차순 순번으로 자동 계산한다.
 * - year/month가 없으면 계산할 수 없으므로 fallbackLabel(예: "TPO 5")을 그대로 반환한다.
 */
export function formatTestLabel(
  testData: TPOTest | undefined,
  allTests: TPOTest[],
  fallbackLabel: string
): string {
  if (!testData || !testData.year || !testData.month) {
    return fallbackLabel;
  }

  const { year, month, testType } = testData;

  // 회차(N회)는 testNumber가 아니라 실제 시행 순서(day)를 기준으로 매긴다.
  // day가 없는 항목은 같은 year/month 안에서 먼저 시행된 것으로 간주해 앞에 두고,
  // day가 같거나 둘 다 없으면 testNumber로 안정적인 순서를 만든다.
  const sameMonth = allTests
    .filter(t => t.testType === testType && t.year === year && t.month === month)
    .sort((a, b) => {
      if (a.day === undefined && b.day !== undefined) return -1;
      if (a.day !== undefined && b.day === undefined) return 1;
      if (a.day !== undefined && b.day !== undefined && a.day !== b.day) return a.day - b.day;
      return a.testNumber - b.testNumber;
    });

  const round = sameMonth.findIndex(t => t.testNumber === testData.testNumber) + 1;
  if (round < 1) return fallbackLabel;

  const typeSuffix =
    testType === 'TPO' ? 'TPO' : testType === 'Test' ? 'Test' : testType;

  return `${year}년 ${month}월 ${round}회 ${typeSuffix}`;
}

/**
 * 카드에 표시되는 "TPO N" / "Test N" 번호를 실제 시행 순서(연·월·일)에 맞게
 * 자동으로 재배정한다. 내부 식별자(testNumber, 진행상황 저장 키, 문제 데이터 등)는
 * 절대 건드리지 않고, 화면에 보여줄 번호만 별도로 계산한다.
 *
 * - Year → Month → Day 오름차순으로 가장 먼저 시행된 세트가 1번이 된다.
 * - 날짜가 전혀 설정되지 않은 세트는 항상 맨 앞으로 보내(=1번부터) 배정한다.
 * - 날짜까지 완전히 같거나 여러 개가 미설정이면 기존 testNumber 오름차순으로
 *   동점을 처리해 순서가 매번 흔들리지 않게 한다.
 *
 * 반환값은 실제 testNumber → 화면 표시 번호(1부터) 매핑.
 *
 * TestPage.tsx처럼 ContentManagement의 TPOTest를 그대로 import하지 않고
 * 자체 축약형 인터페이스를 쓰는 화면에서도 그대로 재사용할 수 있도록
 * 필요한 필드(testType/testNumber/year/month/day)만 요구하는 제네릭으로 작성한다.
 */
export interface ChronoSortableTest {
  testType: 'TPO' | 'Test' | 'Training';
  testNumber: number;
  year?: number;
  month?: number;
  day?: number;
}

export function computeChronoDisplayNumbers<T extends ChronoSortableTest>(
  allTests: T[],
  testType: T['testType']
): Map<number, number> {
  const sorted = allTests
    .filter(t => t.testType === testType)
    .sort((a, b) => {
      if (a.year === undefined && b.year !== undefined) return -1;
      if (a.year !== undefined && b.year === undefined) return 1;
      if (a.year !== undefined && b.year !== undefined && a.year !== b.year) return a.year - b.year;

      if (a.month === undefined && b.month !== undefined) return -1;
      if (a.month !== undefined && b.month === undefined) return 1;
      if (a.month !== undefined && b.month !== undefined && a.month !== b.month) return a.month - b.month;

      if (a.day === undefined && b.day !== undefined) return -1;
      if (a.day !== undefined && b.day === undefined) return 1;
      if (a.day !== undefined && b.day !== undefined && a.day !== b.day) return a.day - b.day;

      return a.testNumber - b.testNumber;
    });

  const map = new Map<number, number>();
  sorted.forEach((t, idx) => map.set(t.testNumber, idx + 1));
  return map;
}
