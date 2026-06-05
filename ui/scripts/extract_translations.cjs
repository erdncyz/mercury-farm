const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const enFile = path.join(__dirname, '../public/locales/en/translation.json');
const trFile = path.join(__dirname, '../public/locales/tr/translation.json');

const walkSync = function(dir, filelist) {
  var files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync(srcDir);

const keys = new Set();
const regex = /t\(\s*['"`](.*?)['"`]\s*\)/g;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }
});

const enTranslations = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const trTranslations = JSON.parse(fs.readFileSync(trFile, 'utf8'));

const missingEn = [];
const missingTr = [];

console.log('Total keys found:', keys.size);

keys.forEach(key => {
  if (enTranslations[key] === undefined) missingEn.push(key);
  if (trTranslations[key] === undefined) missingTr.push(key);
});

console.log('Missing in EN:', missingEn);
console.log('Missing in TR:', missingTr);

const newEnTranslations = { ...enTranslations };
const newTrTranslations = { ...trTranslations };

missingEn.forEach(key => {
    newEnTranslations[key] = key;
});
missingTr.forEach(key => {
    newTrTranslations[key] = key; // leave untranslated, just use English
});

fs.writeFileSync(enFile, JSON.stringify(newEnTranslations, null, 2));
fs.writeFileSync(trFile, JSON.stringify(newTrTranslations, null, 2));

console.log('Updated JSON files');
