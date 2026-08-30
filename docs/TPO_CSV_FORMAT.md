# TPO CSV Format (Reading · Listening)

TPO7 리스닝/리딩에서 정착된 정본 포맷입니다. 새 TPO를 만들 때는 반드시 아래 규칙을 따르고, `docs/tpo_csv_template_reading.csv` · `docs/tpo_csv_template_listening.csv` 를 복제해서 채우세요.

## 공통 헤더 (열 순서 고정)

```
questionNumber,questionType,difficulty,module,passageTitle,passageText,scriptText,dictationBlanks,organization,organizationBlanks,questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation,vocabularyNote,audioFileName,imageFileName
```

- `module` 은 `Module 1` / `Module 2` 문자열 그대로. TPO7 이전 CSV의 `level`, `day` 컬럼은 파서가 무시하므로 사용 금지.
- `difficulty` 는 `쉬움` / `보통` / `어려움` 세 값만 허용 (다른 값은 업로드 실패).

## Reading

| 유형 | questionType | questionNumber | 지문/스크립트 위치 |
| --- | --- | --- | --- |
| 빈칸 넣기 | `Complete Words` | `1-10`, `11-20` (범위) | `passageText` 안 `[answer]` 또는 `[answer:length]` |
| 일상 지문 | `Read in Daily Life` | 개별 번호 | `passageText` 에 JSON (아래 참고) |
| 학술 지문 | `Read an Academic Passage` | 개별 번호 | `passageText` 에 평문 |

### Daily Life 지문 JSON (필수 스키마)

```
{"structure":"notice","color":"teal","fields":{"title":"...","body":"..."}}
{"structure":"flyer","color":"orange","fields":{"title":"...","body":"..."}}
```

- 반드시 `structure` + `fields` 키를 사용합니다. `type` / top-level `title,body` 만 있는 구식 JSON 은 렌더러가 정상화하긴 하지만 신규 CSV 에서는 쓰지 마세요.
- 색상 기본값: `notice` → `teal`, `flyer` → `orange`.
- 본문 줄바꿈은 `\n`, 문단 사이는 `\n\n`.

### Complete Words 빈칸 표기

- 대괄호 안이 정답 글자. 뒤에 `:숫자` 를 붙이면 입력창 폭을 강제.
- 예: `sust[ained]`, `la[nd:4]`.

## Listening

| 유형 | questionType | 스크립트 위치 |
| --- | --- | --- |
| 짧은 응답 | `Listen and Response` | `scriptText` 에 오디오 프롬프트 한 문장 |
| 대화 | `Short Conversation` | `scriptText` 에 전체 대사 (화자 라벨 유지) |
| 공지 | `Announcements` | `scriptText` 에 스피커 전문 |
| 강연 | `Academic Talk` | `scriptText` 에 강연 전문 |

- 같은 대화/강연으로 여러 문제를 만들 때는 **행마다 `scriptText` 를 그대로 반복**해서 넣습니다 (현재 파서는 상속 로직이 없음).
- `passageTitle` 은 CMS 그룹 표시에 사용됩니다. 관례: `Conversation: <제목>`, `Announcement: <제목>`, `Talk: <제목>`.

## 채점 규칙 (매우 중요)

- `correctAnswer` 는 **`optionA`~`optionD` 중 하나의 전체 텍스트와 정확히 일치**해야 합니다. 단일 문자(A/B/C/D)만 넣으면 채점이 실패합니다.
- CMS 에서 옵션 텍스트를 편집한 경우 **정답 드롭다운을 반드시 다시 선택**해서 `correctAnswer` 를 새 옵션 텍스트로 갱신하세요.
- `Complete Words` 는 `blanks` 배열로 자동 채점되므로 `correctAnswer` 열은 비워둡니다.
- 자유 응답 계열(`Write an Email`, `Academic Discussion`, `Take an Interview`, 스피킹 자유 응답) 은 `correctAnswer` 없이 업로드 가능.

## Dictation

- Listening 문제의 받아쓰기 훈련은 `scriptText` 를 기반으로 자동 생성됩니다.
- `scriptText` 가 비어 있으면 훈련 탭이 안내 배너로 대체되므로, 리스닝 문제는 **반드시 `scriptText` 를 채워야** 합니다.
- `Narrator:` 로 시작하는 안내 문장은 자동 제외되어 dictation 대상에서 빠집니다.

## Key Vocabulary (`vocabularyNote`)

- Dictation Training / 리뷰 패널의 **KEY VOCABULARY** 사이드에 노출되는 단어장.
- 한 줄에 `단어=뜻` 형식, 여러 줄이면 줄바꿈으로 구분 (`\n`).
  ```
  reservation=예약
  alumni=졸업생
  private room=개별 룸
  ```
- 관례: 리딩은 지문당 6~10개, 리스닝 대화/강연은 그룹당 4~8개, Listen and Response 단문은 2~3개.
- 같은 지문/스크립트를 공유하는 행은 vocab 도 동일하게 반복해서 넣습니다.

## 참고 파일

- 실제 사용 중인 예시: `csv_tpo7_reading_module1.csv`, `csv_tpo7_reading_module2.csv`, `csv_tpo7_listening_module1.csv`, `csv_tpo7_listening_module2.csv`
- 빈 템플릿: `docs/tpo_csv_template_reading.csv`, `docs/tpo_csv_template_listening.csv`
