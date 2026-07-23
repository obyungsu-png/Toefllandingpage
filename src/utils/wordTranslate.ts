/**
 * 단어 번역 유틸리티 — 무료 MyMemory Translation API 사용
 * 한글/영어 모두 지원, Claude API 불필요 (빠른 응답, 토큰 소모 없음)
 * https://mymemory.translated.net/doc/spec.php
 */

export interface WordTranslation {
  koreanMeaning: string;
  partOfSpeech: string;
  englishExplanation: string;
}

/** 텍스트가 한글을 포함하는지 판별 */
function isKorean(text: string): boolean {
  return /[가-힣]/.test(text);
}

/** 텍스트가 영어만 포함하는지 판별 */
function isEnglish(text: string): boolean {
  return /^[a-zA-Z'\-\s]+$/.test(text.trim());
}

/**
 * MyMemory Translation API로 번역
 * 무료, API 키 불필요, CORS 지원, 하루 5000자
 */
async function translateWithMyMemory(text: string, sourceLang: string, targetLang: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    if (!translated || translated === text) return null;

    // MyMemory가 반환하는 상태 코드 확인 (200 = 성공)
    const status = data?.responseStatus;
    if (status && status !== 200) return null;

    return translated;
  } catch (err) {
    console.warn('[wordTranslate] MyMemory API error:', err);
    return null;
  }
}

/**
 * 단어/구문의 번역을 조회합니다.
 * 한글 단어 → 영어 번역 + 한국어 의미
 * 영어 단어 → 한국어 번역 + 영어 설명
 * @param word 조회할 단어
 * @param context 지문 내 문맥 (선택)
 * @returns 한국어 뜻, 품사, 영어 설명
 */
export async function translateWord(word: string, context?: string): Promise<WordTranslation | null> {
  const cleaned = word.trim();
  if (!cleaned) return null;

  const isPhrase = cleaned.includes(' ');
  const korean = isKorean(cleaned);

  try {
    let koreanMeaning = '';
    let englishExplanation = '';
    let partOfSpeech = isPhrase ? 'phrase' : 'word';

    if (korean) {
      // 한글 → 영어 번역
      const enTranslation = await translateWithMyMemory(cleaned, 'ko', 'en');
      if (enTranslation) {
        englishExplanation = enTranslation;
        koreanMeaning = cleaned; // 원본 한글 단어가 곧 한국어 의미
      } else {
        return null;
      }
    } else {
      // 영어 → 한국어 번역
      const koTranslation = await translateWithMyMemory(cleaned, 'en', 'ko');
      if (koTranslation) {
        koreanMeaning = koTranslation;
        englishExplanation = cleaned; // 원본 영어 단어가 곧 영어 설명
      } else {
        return null;
      }

      // 품사 추정 (간단한 휴리스틱)
      const lower = cleaned.toLowerCase();
      if (lower.endsWith('ly')) partOfSpeech = 'adverb';
      else if (lower.endsWith('ing') || lower.endsWith('ed')) partOfSpeech = 'verb';
      else if (lower.endsWith('tion') || lower.endsWith('ness') || lower.endsWith('ment')) partOfSpeech = 'noun';
      else if (lower.endsWith('ful') || lower.endsWith('ous') || lower.endsWith('ive') || lower.endsWith('able')) partOfSpeech = 'adjective';
    }

    return {
      koreanMeaning,
      partOfSpeech,
      englishExplanation,
    };
  } catch (err) {
    console.warn('[wordTranslate] Error translating word:', err);
    return null;
  }
}
