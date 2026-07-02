import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAS_SRC_DIR = path.resolve(__dirname, '../gas-src');
const DIST_GAS_DIR = path.resolve(__dirname, '../dist-gas');

// Ensure dist-gas directory exists
if (!fs.existsSync(DIST_GAS_DIR)) {
  fs.mkdirSync(DIST_GAS_DIR, { recursive: true });
}

console.log('--- Memulai Build Backend GAS (.gs) ---');

// 1. Copy setup.gs
const setupSrc = path.join(GAS_SRC_DIR, '00-setup.gs');
const setupDest = path.join(DIST_GAS_DIR, 'setup.gs');
if (fs.existsSync(setupSrc)) {
  fs.copyFileSync(setupSrc, setupDest);
  console.log('✓ setup.gs berhasil disalin ke dist-gas/setup.gs');
} else {
  console.warn('⚠ File gas-src/00-setup.gs tidak ditemukan!');
}

// 2. Concat code.gs
const codeFiles = [
  '01-main.gs',
  '02-auth.gs',
  'modules/10-dashboard.gs',
  'modules/11-inventory.gs',
  'modules/12-finance.gs',
  'modules/13-hr.gs',
  'modules/14-procurement.gs',
  'modules/15-sales.gs',
  'modules/16-reporting.gs',
  'modules/17-settings.gs',
  '99-utils.gs'
];

let codeContent = '';
let successfullyMerged = 0;

for (const file of codeFiles) {
  const filePath = path.join(GAS_SRC_DIR, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    codeContent += `// ==== ${file} ====\n${content}\n\n`;
    successfullyMerged++;
  } else {
    console.warn(`⚠ File modul ${file} tidak ditemukan di gas-src/`);
  }
}

fs.writeFileSync(path.join(DIST_GAS_DIR, 'code.gs'), codeContent);
console.log(`✓ code.gs berhasil dibuat (${successfullyMerged}/${codeFiles.length} modul digabungkan)`);
console.log('--- Build Backend GAS Selesai ---');
