// Adds the QuietDesk header and footer links and the DPA footer link to every page except
// quietdesk/index.html (which carries its own nav). Plain string insertion at three exact
// anchors, so the inline theme script and everything else stay byte-identical.
// Idempotent: a second run changes 0 files.
//
// Usage: node scripts/add-quietdesk-nav.mjs [--check]
//   --check writes nothing and exits 1 if any file would change.
//
// The footer constants are aligned to the footer of quietdesk/index.html (08-07):
// QuietDesk follows "Quiet Staff Labs" in .footer-links, and DPA follows "Terms" in .footer-bottom.
import {readFileSync, writeFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scripts', '_includes']);
const SKIP_FILES = new Set(['quietdesk/index.html']);

const NAV_OPEN = '<nav class="main-nav" id="main-nav" aria-label="Primary">';
const NAV_LINK = '<a href="/quietdesk/">QuietDesk</a>';
const FOOTER_AFTER = '<a href="/labs/">Quiet Staff Labs</a>';
const FOOTER_LINK = '<a href="/quietdesk/">QuietDesk</a>';
const TERMS_LINK = '<a href="/terms/">Terms</a>';
const DPA_LINK = '<a href="/dpa/">DPA</a>';

function collect(dir, out) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(root, full).split(path.sep).join('/');
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) collect(full, out);
    } else if (name === 'index.html' || (name === '404.html' && dir === root)) {
      if (!SKIP_FILES.has(rel)) out.push(rel);
    }
  }
}

/** Returns the new html, or throws if an anchor is missing. */
export function transform(html, rel) {
  let out = html;

  // 1. Header nav: QuietDesk first.
  const navStart = out.indexOf(NAV_OPEN);
  if (navStart === -1) throw new Error(`${rel}: header nav opening tag not found`);
  const navEnd = out.indexOf('</nav>', navStart);
  if (!out.slice(navStart, navEnd).includes('href="/quietdesk/"')) {
    out = out.slice(0, navStart + NAV_OPEN.length) + NAV_LINK + out.slice(navStart + NAV_OPEN.length);
  }

  // 2 and 3. Footer.
  const fStart = out.indexOf('<footer class="site-footer">');
  const fEnd = out.indexOf('</footer>', fStart);
  if (fStart === -1 || fEnd === -1) throw new Error(`${rel}: footer not found`);
  let footer = out.slice(fStart, fEnd);
  const linksStart = footer.indexOf('<div class="footer-links">');
  const bottomStart = footer.indexOf('<div class="footer-bottom">');
  if (linksStart === -1 || bottomStart === -1) throw new Error(`${rel}: footer-links or footer-bottom not found`);

  if (!footer.slice(linksStart, bottomStart).includes('href="/quietdesk/"')) {
    const at = footer.indexOf(FOOTER_AFTER, linksStart);
    if (at === -1 || at > bottomStart) throw new Error(`${rel}: footer anchor "Quiet Staff Labs" not found`);
    footer = footer.slice(0, at + FOOTER_AFTER.length) + FOOTER_LINK + footer.slice(at + FOOTER_AFTER.length);
  }
  const bottom = footer.indexOf('<div class="footer-bottom">');
  if (!footer.slice(bottom).includes('href="/dpa/"')) {
    const at = footer.indexOf(TERMS_LINK, bottom);
    if (at === -1) throw new Error(`${rel}: footer anchor "Terms" not found`);
    footer = footer.slice(0, at + TERMS_LINK.length) + DPA_LINK + footer.slice(at + TERMS_LINK.length);
  }
  return out.slice(0, fStart) + footer + out.slice(fEnd);
}

function main(argv) {
  const check = argv.includes('--check');
  const files = [];
  collect(root, files);
  files.sort();
  const changed = [];
  try {
    for (const rel of files) {
      const full = path.join(root, rel);
      const before = readFileSync(full, 'utf8');
      const after = transform(before, rel);
      if (after !== before) {
        changed.push(rel);
        if (!check) writeFileSync(full, after);
      }
    }
  } catch (err) {
    console.error('add-quietdesk-nav: ' + err.message);
    return 1;
  }
  for (const rel of changed) console.log((check ? 'would change ' : 'changed ') + rel);
  console.log(`${check ? 'would change' : 'changed'} ${changed.length} files`);
  return check && changed.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
