const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function extract(pdfPath, outName) {
  const buf = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  const lines = [];
  for (const page of result.pages) {
    lines.push(`\n===== PAGE ${page.num} =====`);
    lines.push(page.text);
  }
  fs.writeFileSync(outName, lines.join('\n'), 'utf-8');
  console.log(`${outName}: ${result.total}페이지 추출 완료`);
  await parser.destroy();
}

async function main() {
  const dir = 'C:/Users/matan/Desktop/4.1新托福真题';
  await extract(`${dir}/4.1阅读.pdf`, 'p41_reading.txt');
  await extract(`${dir}/4.1答案.pdf`, 'p41_answers.txt');
  await extract(`${dir}/4.1写作.pdf`, 'p41_writing.txt');
  try {
    await extract(`${dir}/4.1听力.pdf`, 'p41_listening.txt');
  } catch (e) {
    console.log('listening 추출 실패:', e.message);
  }
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
