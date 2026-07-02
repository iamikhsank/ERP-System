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

// 3. Safe line-splitter for index.html (Limit max 300 characters per line)
function splitLineSafely(line, maxLen = 300) {
  if (line.length <= maxLen) return [line];
  
  const chunks = [];
  let remaining = line;
  
  while (remaining.length > maxLen) {
    let splitIdx = -1;
    
    const commaIdx = remaining.lastIndexOf(',', maxLen);
    const semiIdx = remaining.lastIndexOf(';', maxLen);
    const gtIdx = remaining.lastIndexOf('>', maxLen);
    const spaceIdx = remaining.lastIndexOf(' ', maxLen);
    const braceIdx = remaining.lastIndexOf('}', maxLen);
    const parenIdx = remaining.lastIndexOf(')', maxLen);
    
    // Prioritize split index close to maxLen but not too early (above 40% of maxLen)
    const minThreshold = maxLen * 0.4;
    const candidates = [commaIdx, semiIdx, gtIdx, spaceIdx, braceIdx, parenIdx]
      .filter(idx => idx > minThreshold && idx <= maxLen);
      
    if (candidates.length > 0) {
      splitIdx = Math.max(...candidates) + 1; // Split right after the candidate character
    }
    
    if (splitIdx === -1) {
      splitIdx = maxLen;
    }
    
    chunks.push(remaining.substring(0, splitIdx));
    remaining = remaining.substring(splitIdx);
  }
  
  if (remaining.length > 0) {
    chunks.push(remaining);
  }
  
  return chunks;
}

const htmlSrc = path.join(DIST_DIR, 'index.html');
const destHtml = path.resolve(__dirname, '../Dashboard-for-Spreadsheet.html');
const destTxt = path.resolve(__dirname, '../Dashboard-for-Spreadsheet.txt');

if (fs.existsSync(htmlSrc)) {
  const rawHtml = fs.readFileSync(htmlSrc, 'utf8');
  const lines = rawHtml.split('\n');
  const processedLines = [];
  
  for (const line of lines) {
    if (line.length > 300) {
      const splitChunks = splitLineSafely(line, 300);
      processedLines.push(...splitChunks);
    } else {
      processedLines.push(line);
    }
  }
  
  const finalHtml = processedLines.join('\n');
  
  // Save to all destinations
  fs.writeFileSync(htmlSrc, finalHtml, 'utf8');
  fs.writeFileSync(destHtml, finalHtml, 'utf8');
  fs.writeFileSync(destTxt, finalHtml, 'utf8');
  console.log('Successfully formatted index.html and synced to GAS dashboard files (max 300 chars per line)');
}

