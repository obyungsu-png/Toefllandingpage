const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function main() {
  const buf = fs.readFileSync('C:/Users/matan/Desktop/4.28/428答案.pdf');
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  console.log('=== 총 페이지:', result.total, '===');
  for (const page of result.pages) {
    console.log(`\n===== PAGE ${page.num} =====`);
    console.log(page.text);
  }
  await parser.destroy();
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
