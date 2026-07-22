const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

(async () => {
  const dir = path.join(__dirname, 'p330_imgs');
  const outDir = __dirname;

  const targets = [
    { prefix: 'reading', count: 12, out: 'p330_reading_ocr.txt' },
    { prefix: 'listening', count: 29, out: 'p330_listening_ocr.txt' },
    { prefix: 'writing', count: 6, out: 'p330_writing_ocr.txt' },
    { prefix: 'answers', count: 1, out: 'p330_answers_ocr.txt' },
  ];

  const worker = await createWorker('eng');

  for (const t of targets) {
    let fullText = '';
    for (let i = 1; i <= t.count; i++) {
      const fileName = `${t.prefix}_p${String(i).padStart(2, '0')}.png`;
      const filePath = path.join(dir, fileName);
      if (!fs.existsSync(filePath)) {
        console.log(`Missing: ${fileName}`);
        continue;
      }
      console.log(`OCR processing: ${fileName} ...`);
      const { data: { text } } = await worker.recognize(filePath);
      fullText += `\n===== PAGE ${i} =====\n${text}\n`;
    }
    fs.writeFileSync(path.join(outDir, t.out), fullText, 'utf-8');
    console.log(`Saved: ${t.out}`);
  }

  await worker.terminate();
  console.log('All OCR done.');
})();
