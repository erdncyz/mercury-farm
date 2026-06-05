const fs = require('fs');
const trFile = '/Users/erdincyilmaz/Desktop/mercury-farm/ui/public/locales/tr/translation.json';
const json = JSON.parse(fs.readFileSync(trFile, 'utf8'));

let untranslated = 0;
let total = Object.keys(json).length;

for (const [key, value] of Object.entries(json)) {
  if (key === value) {
    untranslated++;
    console.log(`Untranslated: "${key}"`);
  }
}

console.log(`\nTotal keys: ${total}`);
console.log(`Untranslated keys: ${untranslated}`);
console.log(`Translated keys: ${total - untranslated}`);
