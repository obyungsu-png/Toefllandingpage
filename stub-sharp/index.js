// stub-sharp/index.js
// -----------------------------------------------------------------------------
// sharp 의 스텁 대체품 — @xenova/transformers v2 가 ESM 'import sharp' 를 정적
// import 로 사용해 native binary 누락 시 크래시. 오디오(Whisper) 전용이므로
// 이미지 처리(sharp) 는 불필요 — 빈 객체를 반환하여 이미지 경로를 우회.
//
// npm overrides (package.json "overrides": { "sharp": "file:./stub-sharp" })
// 로 실제 sharp 패키지를 이 스텁으로 교체.
//
// ⚠️ 이미지 비전 모델(예: CLIP, ViT) 사용 시에는 실제 sharp 설치 필요:
//    npm install sharp (또는 overrides 제거 후 sharp 정상 설치)
module.exports = {};
