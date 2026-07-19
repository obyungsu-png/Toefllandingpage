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
}

async function main() {
  const dir = 'C:/Users/matan/Desktop/4.1新托福真题';
  const out = 'C:/Users/matan/Desktop/seojun/Toefllandingpage/p41_imgs';
  await convert(`${dir}/4.1阅读.pdf`, out, 'reading');
  await convert(`${dir}/4.1听力.pdf`, out, 'listening');
  await convert(`${dir}/4.1写作.pdf`, out, 'writing');
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
