import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');

console.log('--- Memulai Pemrosesan Frontend HTML ---');

// Format and sync index.html
function formatHtmlForGas(html) {
  // Remove unnecessary whitespaces between HTML tags to optimize size
  return html.replace(/>\s+</g, '><').trim();
}

const htmlSrc = path.join(DIST_DIR, 'index.html');
const destHtml = path.resolve(__dirname, '../Dashboard-for-Spreadsheet.html');

if (fs.existsSync(htmlSrc)) {
  const rawHtml = fs.readFileSync(htmlSrc, 'utf8');
  const finalHtml = formatHtmlForGas(rawHtml);
  
  // Save to all destinations
  fs.writeFileSync(htmlSrc, finalHtml, 'utf8');
  fs.writeFileSync(destHtml, finalHtml, 'utf8');
  console.log('✓ index.html berhasil dikompresi (Terser-like whitespace optimization)');
  console.log('✓ Berhasil disinkronkan ke Dashboard-for-Spreadsheet.html');
  console.log('--- Pemrosesan Frontend HTML Selesai ---');
} else {
  console.error('❌ Error: File dist/index.html tidak ditemukan! Silakan jalankan vite build terlebih dahulu.');
  process.exit(1);
}
