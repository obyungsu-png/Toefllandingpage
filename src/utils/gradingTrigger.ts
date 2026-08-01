/**
 * gradingTrigger.ts — AI 채점 허용 여부 판정 유틸리티
 * -----------------------------------------------------------------------------
 * 채점 트리거 조건:
 *   • Reading / Listening → 전체 문항의 50% 이상 응답 시 채점 허용
 *   • Speaking / Writing  → 전체 문항 100% 완료 시에만 채점 허용
 *
 * 목적: 무응답 상태에서 부정확한 AI/자동 채점이 노출되는 것을 방지.
 */

export type SectionType = 'Reading' | 'Listening' | 'Speaking' | 'Writing';

export interface TriggerInput {
  /** 해당 섹션의 전체 문항 수 */
  totalQuestions: number;
  /** 학생이 응답(또는 녹음/작성)을 완료한 문항 수 */
  answeredQuestions: number;
}

export interface TriggerResult {
  /** 채점 허용 여부 */
  canGrade: boolean;
  /** 완료율 (0~1) */
  completionRatio: number;
  /** 채점에 필요한 최소 완료율 */
  requiredRatio: number;
  /** 거절 사유 (canGrade=false 일 때) */
  reason?: string;
  /** 사용자에게 보여줄 안내 메시지 */
  message: string;
}

/**
 * 섹션별 채점 트리거 검사
 * - Reading/Listening: 50% 이상 응답 → 채점 허용
 * - Speaking/Writing:  100% 완료 → 채점 허용
 */
export function checkGradingTrigger(
  section: SectionType,
  input: TriggerInput
): TriggerResult {
  const { totalQuestions, answeredQuestions } = input;
  const safeTotal = Math.max(totalQuestions, 1);
  const completionRatio = Math.min(answeredQuestions / safeTotal, 1);

  // Speaking/Writing: 전체 완료 필수
  if (section === 'Speaking' || section === 'Writing') {
    const requiredRatio = 1.0;
    const canGrade = completionRatio >= requiredRatio && answeredQuestions >= safeTotal;
    if (canGrade) {
      return {
        canGrade: true,
        completionRatio,
        requiredRatio,
        message: `${section} 전체 문항(${totalQuestions}개) 완료 — AI 채점이 활성화되었습니다.`,
      };
    }
    const remaining = totalQuestions - answeredQuestions;
    return {
      canGrade: false,
      completionRatio,
      requiredRatio,
      reason: 'incomplete',
      message: `${section}은(는) 모든 문항을 완료해야 채점할 수 있습니다. 남은 문항: ${remaining}개 (현재 ${answeredQuestions}/${totalQuestions}).`,
    };
  }

  // Reading/Listening: 50% 이상 응답
  const requiredRatio = 0.5;
  const canGrade = completionRatio >= requiredRatio;
  if (canGrade) {
    return {
      canGrade: true,
      completionRatio,
      requiredRatio,
      message: `${section} 응답률 ${Math.round(completionRatio * 100)}% — 채점이 활성화되었습니다.`,
    };
  }
  const needed = Math.ceil(requiredRatio * safeTotal) - answeredQuestions;
  return {
    canGrade: false,
    completionRatio,
    requiredRatio,
    reason: 'below_threshold',
    message: `${section}은(는) 50% 이상 응답해야 채점할 수 있습니다. ${needed}문항 더 응답 필요 (현재 ${answeredQuestions}/${totalQuestions}).`,
  };
}
