const fs = require('fs');
const c = fs.readFileSync('src/App.tsx', 'utf8');
const lines = c.split('\n');
let brace = 0, paren = 0;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  for (const ch of l) {
    if (ch === '{') brace++;
    if (ch === '}') brace--;
    if (ch === '(') paren++;
    if (ch === ')') paren--;
  }
  if (brace < 0 || paren < 0) {
    console.log('Line ' + (i+1) + ': UNBALANCED! brace=' + brace + ' paren=' + paren);
    console.log('  Content: ' + l.trim().substring(0, 100));
  }
  if ((i+1) % 500 === 0) {
    console.log('Line ' + (i+1) + ': brace=' + brace + ' paren=' + paren);
  }
}
console.log('FINAL: brace=' + brace + ' paren=' + paren);
console.log('Total lines: ' + lines.length);
