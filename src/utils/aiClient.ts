/**
 * aiClient.ts — 공용 AI 호출 클라이언트 (GLM / Claude)
 * -----------------------------------------------------------------------------
 * WritingReviewAiTutor 의 callAi 패턴을 추출하여 Speaking 채점에서도 재사용.
 *
 * 보안:
 *   - Claude 는 Vercel 서버리스 프록시 경유 (서버 env CLAUDE_API_KEY 사용) — 클라이언트 키 노출 없음.
 *   - GLM 만 클라이언트에서 직접 호출 (CORS 허용, VITE_GLM_API_KEY 환경변수).
 */

// ── GLM 설정 ─────────────────────────────────────────────────────────────
const GLM_API_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_API_KEY = import.meta.env.VITE_GLM_API_KEY || '';
const GLM_MODEL = 'glm-4-flash';

// ── Claude 설정 (Vercel 프록시 경유) ──────────────────────────────────────
const isElectron =
  typeof window !== 'undefined' && (window as any).electronAPI?.isElectron === true;
const CLAUDE_PROXY_ENDPOINT = isElectron
  ? (import.meta.env.VITE_CLAUDE_PROXY_URL as string | undefined) ||
    'https://toefl-allmyexam.vercel.app/api/claude/chat/completions'
  : '/api/claude/chat/completions';
const CLAUDE_MODEL = 'claude-sonnet-5';

export type AiProvider = 'glm' | 'claude';

/**
 * 공용 AI 호출 (GLM/Claude 공통 인터페이스)
 * @param systemPrompt 시스템 프롬프트
 * @param userPrompt 사용자 프롬프트
 * @param provider 'glm'(기본, 빠름) | 'claude'(고품질)
 * @param maxTokens 최대 토큰
 * @param temperature 온도
 * @returns AI 응답 텍스트
 */
export async function callAi(
  systemPrompt: string,
  userPrompt: string,
  provider: AiProvider = 'glm',
  maxTokens: number = 2000,
  temperature: number = 0.4,
): Promise<string> {
  const useClaude = provider === 'claude';
  const endpoint = useClaude ? CLAUDE_PROXY_ENDPOINT : GLM_API_ENDPOINT;
  const modelId = useClaude ? CLAUDE_MODEL : GLM_MODEL;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'OBS',
  };
  // Claude 는 서버 프록시가 키를 주입하므로 클라이언트 헤더 없음.
  // GLM 만 클라이언트에서 직접 호출.
  if (!useClaude) {
    headers['Authorization'] = `Bearer ${GLM_API_KEY}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI 분석 오류 (${response.status}): ${errText.slice(0, 150)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * JSON 안전 파싱 — 코드펜스/잡음 제거 후 parse.
 * AI 응답이 마크다운 코드블록에 싸여 있을 때 대응.
 */
export function safeJsonParse(text: string): any | null {
  if (!text) return null;
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
