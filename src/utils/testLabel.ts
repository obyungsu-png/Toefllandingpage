import { TPOTest } from '../components/ContentManagement';

/**
 * "날짜 메모"(dateMemo) 자유 텍스트에서 일(day)을 추출한다.
 *
 * CMS에는 정식 Day 드롭다운(1~31) 외에, 예전부터 써오던 "날짜 메모" 자유
 * 입력란("4/6", "4/14 시험" 등)이 있다. Day 드롭다운을 아직 채우지 않은
 * 기존 데이터가 많기 때문에, 정렬 시 이 메모에서 "M/D" 형태의 날짜를
 * 최대한 읽어내 day처럼 사용한다. 형식이 맞지 않으면 undefined를 반환해
 * 정렬 로직이 안전하게 기존 testNumber 기준으로 폴백하도록 한다.
 */
export function extractDayFromDateMemo(dateMemo?: string): number | undefined {
  if (!dateMemo) return undefined;
  const match = dateMemo.trim().match(/^(\d{1,2})\s*[/\-.]\s*(\d{1,2})\b/);
  if (!match) return undefined;
  const day = parseInt(match[2], 10);
  if (day >= 1 && day <= 31) return day;
  return undefined;
}

/**
 * 정렬에 실제로 사용할 "유효 day" — 정식 Day 필드가 있으면 그것을 쓰고,
 * 없으면 dateMemo에서 추출을 시도한다.
 */
export function effectiveDay(t: { day?: number; dateMemo?: string } | undefined): number | undefined {
  if (!t) return undefined;
  return t.day ?? extractDayFromDateMemo(t.dateMemo);
}

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
      const aDay = effectiveDay(a);
      const bDay = effectiveDay(b);
      if (aDay === undefined && bDay !== undefined) return -1;
      if (aDay !== undefined && bDay === undefined) return 1;
      if (aDay !== undefined && bDay !== undefined && aDay !== bDay) return aDay - bDay;
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
 * - Day는 정식 Day 필드가 없으면 dateMemo("4/6" 등)에서 추출해 대신 사용한다.
 * - 날짜가 전혀 설정되지 않은 세트는 항상 맨 앞으로 보내(=1번부터) 배정한다.
 * - 날짜까지 완전히 같거나 여러 개가 미설정이면 기존 testNumber 오름차순으로
 *   동점을 처리해 순서가 매번 흔들리지 않게 한다.
 *
 * 반환값은 실제 testNumber → 화면 표시 번호(1부터) 매핑.
 *
 * TestPage.tsx처럼 ContentManagement의 TPOTest를 그대로 import하지 않고
 * 자체 축약형 인터페이스를 쓰는 화면에서도 그대로 재사용할 수 있도록
 * 필요한 필드(testType/testNumber/year/month/day/dateMemo)만 요구하는
 * 제네릭으로 작성한다.
 */
export interface ChronoSortableTest {
  testType: 'TPO' | 'Test' | 'Training';
  testNumber: number;
  year?: number;
  month?: number;
  day?: number;
  dateMemo?: string;
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

      const aDay = effectiveDay(a);
      const bDay = effectiveDay(b);
      if (aDay === undefined && bDay !== undefined) return -1;
      if (aDay !== undefined && bDay === undefined) return 1;
      if (aDay !== undefined && bDay !== undefined && aDay !== bDay) return aDay - bDay;

      return a.testNumber - b.testNumber;
    });

  const map = new Map<number, number>();
  sorted.forEach((t, idx) => map.set(t.testNumber, idx + 1));
  return map;
}
