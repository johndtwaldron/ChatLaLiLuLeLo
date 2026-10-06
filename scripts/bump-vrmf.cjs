const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '..', 'version.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const component = process.argv[2]?.toUpperCase();
const index = ['V', 'R', 'M', 'F'].indexOf(component);
if (index < 0 || process.argv.length !== 3 || !/^\d+\.\d+\.\d+\.\d+$/.test(data.version)) {
  console.error('Usage: npm run version:vrmf -- V|R|M|F');
  process.exit(1);
}
const parts = data.version.split('.').map(Number);
parts[index] += 1;
parts.fill(0, index + 1);
data.version = parts.join('.');
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
const root = path.join(__dirname, '..');
const packagingVersion = parts.slice(0, 3).join('.');
for (const name of ['package.json', 'apps/mobile/package.json', 'apps/edge/package.json', 'apps/mobile/app.json', 'package-lock.json']) {
  const target = path.join(root, name);
  const manifest = JSON.parse(fs.readFileSync(target, 'utf8'));
  if (name === 'apps/mobile/app.json') manifest.expo.version = packagingVersion;
  else manifest.version = packagingVersion;
  if (name === 'package-lock.json') {
    for (const key of ['', 'apps/mobile', 'apps/edge']) manifest.packages[key].version = packagingVersion;
  }
  fs.writeFileSync(target, JSON.stringify(manifest, null, 2) + '\n');
}
console.log(data.version);
