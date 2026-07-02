import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAS_SRC_DIR = path.resolve(__dirname, '../gas-src');
const DIST_GAS_DIR = path.resolve(__dirname, '../dist-gas');
const DIST_DIR = path.resolve(__dirname, '../dist');

// Ensure dist-gas directory exists
if (!fs.existsSync(DIST_GAS_DIR)) {
  fs.mkdirSync(DIST_GAS_DIR, { recursive: true });
}

// 1. Copy setup.gs
const setupSrc = path.join(GAS_SRC_DIR, '00-setup.gs');
const setupDest = path.join(DIST_GAS_DIR, 'setup.gs');
if (fs.existsSync(setupSrc)) {
  fs.copyFileSync(setupSrc, setupDest);
  console.log('Copied setup.gs');
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
for (const file of codeFiles) {
  const filePath = path.join(GAS_SRC_DIR, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    codeContent += `// ==== ${file} ====\n${content}\n\n`;
  }
}

fs.writeFileSync(path.join(DIST_GAS_DIR, 'code.gs'), codeContent);
console.log('Generated code.gs');

// 3. Copy index.html to Google Apps Script dashboard files
// Note: Minification (via Vite terser) ensures valid JavaScript output
// We don't split lines as it can break JavaScript syntax
function formatHtmlForGas(html) {
  // Remove extra whitespace between elements but preserve script integrity
  return html.replace(/>\s+</g, '><').trim();
}

const htmlSrc = path.join(DIST_DIR, 'index.html');
const destHtml = path.resolve(__dirname, '../Dashboard-for-Spreadsheet.html');
const destTxt = path.resolve(__dirname, '../Dashboard-for-Spreadsheet.txt');

if (fs.existsSync(htmlSrc)) {
  let rawHtml = fs.readFileSync(htmlSrc, 'utf8');
  const finalHtml = formatHtmlForGas(rawHtml);
  
  // Save to all destinations
  fs.writeFileSync(htmlSrc, finalHtml, 'utf8');
  fs.writeFileSync(destHtml, finalHtml, 'utf8');
  fs.writeFileSync(destTxt, finalHtml, 'utf8');
  console.log('Synced index.html to GAS dashboard files (with terser minification)');
}

