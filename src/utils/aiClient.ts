/**
 * aiClient.ts — 공용 AI 호출 클라이언트 (GLM / Claude)
 * -----------------------------------------------------------------------------
 * 두 모델 모두 Vercel 서버리스 프록시 경유 — 클라이언트에 API 키 노출 없음.
 *   • GLM   → /api/glm/chat/completions   (서버 env GLM_API_KEY 사용)
 *   • Claude → /api/claude/chat/completions (서버 env CLAUDE_API_KEY 사용)
 *
 * Electron 환경에서는 상대 경로가 작동하지 않으므로
 * VITE_CLAUDE_PROXY_URL / VITE_GLM_PROXY_URL 로 절대 URL 지정.
 */

const isElectron =
  typeof window !== 'undefined' && (window as any).electronAPI?.isElectron === true;

// ── GLM 설정 ─────────────────────────────────────────────────────────────
const GLM_PROXY_ENDPOINT = isElectron
  ? (import.meta.env.VITE_GLM_PROXY_URL as string | undefined) ||
    'https://toefl-allmyexam.vercel.app/api/glm/chat/completions'
  : '/api/glm/chat/completions';
const GLM_MODEL = 'glm-4-flash';

// ── Claude 설정 ──────────────────────────────────────────────────────────
const CLAUDE_PROXY_ENDPOINT = isElectron
  ? (import.meta.env.VITE_CLAUDE_PROXY_URL as string | undefined) ||
    'https://toefl-allmyexam.vercel.app/api/claude/chat/completions'
  : '/api/claude/chat/completions';
const CLAUDE_MODEL = 'claude-sonnet-5';

export const AI_ENDPOINTS = {
  GLM: GLM_PROXY_ENDPOINT,
  CLAUDE: CLAUDE_PROXY_ENDPOINT,
};
export const AI_MODELS = { GLM: GLM_MODEL, CLAUDE: CLAUDE_MODEL };

export type AiProvider = 'glm' | 'claude';

/**
 * 공용 AI 호출 (GLM/Claude 공통 인터페이스, 둘 다 프록시 경유)
 */
export async function callAi(
  systemPrompt: string,
  userPrompt: string,
  provider: AiProvider = 'glm',
  maxTokens: number = 2000,
  temperature: number = 0.4,
): Promise<string> {
  const useClaude = provider === 'claude';
  const endpoint = useClaude ? CLAUDE_PROXY_ENDPOINT : GLM_PROXY_ENDPOINT;
  const modelId = useClaude ? CLAUDE_MODEL : GLM_MODEL;

  // 두 프록시 모두 서버에서 키 주입 — 클라이언트 헤더 없음.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'OBS',
  };

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
    throw new Error(`AI 분석 오류 (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * JSON 안전 파싱 — 코드펜스/잡음 제거 후 parse.
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

/**
 * 사용자가 선택한 AI 모델 저장/불러오기 — 우측 AI 튜터 + 드래그 AI 공통.
 */
const AI_MODEL_STORAGE_KEY = 'toefl_ai_model_pref';
export function readPreferredAiModel(): AiProvider {
  try {
    const v = localStorage.getItem(AI_MODEL_STORAGE_KEY);
    return v === 'claude' ? 'claude' : 'glm';
  } catch {
    return 'glm';
  }
}
export function writePreferredAiModel(model: AiProvider): void {
  try {
    localStorage.setItem(AI_MODEL_STORAGE_KEY, model);
  } catch { /* noop */ }
}
