/**
 * 단어 번역 유틸리티 — Claude API 프록시 사용
 * /api/claude/chat/completions 엔드포인트 사용
 */

export interface WordTranslation {
  koreanMeaning: string;
  partOfSpeech: string;
  englishExplanation: string;
}

/**
 * 단어의 한국어 뜻을 조회합니다.
 * @param word 조회할 단어
 * @param context 지문 내 문맥 (선택)
 * @returns 한국어 뜻, 품사, 영어 설명
 */
export async function translateWord(word: string, context?: string): Promise<WordTranslation | null> {
  const cleaned = word.trim().replace(/[^a-zA-Z'\-\s]/g, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;

  const isPhrase = cleaned.includes(' ');
  const label = isPhrase ? 'phrase' : 'word';

  const prompt = context
    ? `Translate the English ${label} "${cleaned}" as used in this context: "${context.slice(0, 200)}". 
Return ONLY a JSON object with these fields:
- koreanMeaning: the Korean translation of the ${label} (brief, 1-6 words)
- partOfSpeech: the part of speech in English (noun, verb, adjective, etc. — or "phrase" if not a single word)
- englishExplanation: a brief English explanation (1 sentence, max 20 words)

No markdown, no code blocks, just the JSON object.`
    : `Translate the English ${label} "${cleaned}".
Return ONLY a JSON object with these fields:
- koreanMeaning: the Korean translation of the ${label} (brief, 1-6 words)
- partOfSpeech: the part of speech in English (noun, verb, adjective, etc. — or "phrase" if not a single word)
- englishExplanation: a brief English explanation (1 sentence, max 20 words)

No markdown, no code blocks, just the JSON object.`;

  try {
    const response = await fetch('/api/claude/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
    
    // JSON 추출 (코드 블록이 있는 경우 제거)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      koreanMeaning: parsed.koreanMeaning || '',
      partOfSpeech: parsed.partOfSpeech || '',
      englishExplanation: parsed.englishExplanation || '',
    };
  } catch (err) {
    console.warn('[wordTranslate] Error translating word:', err);
    return null;
  }
}
