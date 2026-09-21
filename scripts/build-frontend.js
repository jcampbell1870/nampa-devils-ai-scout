const fs = require('fs');
const path = require('path');
const { prospects } = require('../src/data/prospects');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'frontend');
const destination = path.join(root, 'dist');
const generatedProspectsPath = path.join(destination, 'data', 'prospects.js');

fs.rmSync(destination, { recursive: true, force: true });
fs.cpSync(source, destination, { recursive: true });
fs.mkdirSync(path.dirname(generatedProspectsPath), { recursive: true });
fs.writeFileSync(
  generatedProspectsPath,
  `window.NAMPA_DEVILS_SEEDED_PROSPECTS = ${JSON.stringify(prospects, null, 2)};\n`
);

console.log('Frontend build complete: dist/');
