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

  const sameMonth = allTests
    .filter(t => t.testType === testType && t.year === year && t.month === month)
    .sort((a, b) => a.testNumber - b.testNumber);

  const round = sameMonth.findIndex(t => t.testNumber === testData.testNumber) + 1;
  if (round < 1) return fallbackLabel;

  const typeSuffix =
    testType === 'TPO' ? 'TPO' : testType === 'Test' ? 'Test' : testType;

  return `${year}년 ${month}월 ${round}회 ${typeSuffix}`;
}
