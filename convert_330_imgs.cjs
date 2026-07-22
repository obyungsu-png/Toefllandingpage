const { pdf } = require('pdf-to-img');
const fs = require('fs');
const path = require('path');

async function convert(pdfPath, outDir, prefix) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  let count = 0;
  const doc = await pdf(pdfPath, { scale: 2.0 });
  for await (const page of doc) {
    count++;
    const out = path.join(outDir, `${prefix}_p${String(count).padStart(2, '0')}.png`);
    fs.writeFileSync(out, page);
  }
  console.log(`${prefix}: ${count}페이지 변환 완료`);
  return count;
}

async function main() {
  const dir = 'C:/Users/matan/Desktop/1.21新托福真题C卷/3.30新托福真题';
  const out = 'C:/Users/matan/Desktop/seojun/Toefllandingpage/p330_imgs';
  const counts = {};
  counts.reading = await convert(`${dir}/3.30阅读.pdf`, out, 'reading');
  counts.listening = await convert(`${dir}/3.30听力.pdf`, out, 'listening');
  counts.writing = await convert(`${dir}/3.30写作.pdf`, out, 'writing');
  counts.answers = await convert(`${dir}/3.30答案.pdf`, out, 'answers');
  fs.writeFileSync(path.join(__dirname, 'p330_counts.json'), JSON.stringify(counts, null, 2));
  console.log('All conversions done:', counts);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
