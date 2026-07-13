/**
 * Free Dictionary API — 영어 단어 정의 조회
 * https://api.dictionaryapi.dev/api/v2/entries/en/{word}
 */

export interface WordDefinition {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
}

/**
 * 영어 단어의 정의를 조회합니다.
 * @param word 조회할 단어
 * @returns 정의 배열 (빈 배열이면 단어를 찾지 못함)
 */
export async function getWordDefinitions(word: string): Promise<WordDefinition[]> {
  const cleaned = word.trim().toLowerCase().replace(/[^a-z'-]/g, '');
  if (!cleaned) return [];

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleaned)}`);
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const results: WordDefinition[] = [];
    for (const entry of data) {
      const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text;
      if (entry.meanings && Array.isArray(entry.meanings)) {
        for (const meaning of entry.meanings) {
          const partOfSpeech = meaning.partOfSpeech || '';
          if (meaning.definitions && Array.isArray(meaning.definitions)) {
            for (const def of meaning.definitions) {
              results.push({
                word: entry.word || cleaned,
                phonetic,
                partOfSpeech,
                definition: def.definition || '',
                example: def.example,
              });
              // 각 품사당 최대 2개 정의만
              if (results.filter(r => r.partOfSpeech === partOfSpeech).length >= 2) break;
            }
          }
        }
      }
    }

    // 최대 5개까지만 반환
    return results.slice(0, 5);
  } catch (err) {
    console.warn('[dictionaryApi] Error fetching definition:', err);
    return [];
  }
}
