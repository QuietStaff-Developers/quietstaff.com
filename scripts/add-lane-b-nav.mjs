// Adds the Lane B routes to the site chrome (site revamp, 2026-11-01, D2):
//   header nav: "Our approach" and "Labs" become "Consulting" and "Partners" on every page that
//   carries the shared nav; /partners/delivery/ keeps its page-only nav (M5MB-109).
//   footer: "AI consulting" and "Technical partner" follow "QuietDesk" in .footer-links on every page.
// Plain string replacement at exact anchors, so the inline theme script and everything else stay
// byte-identical. Idempotent: a second run changes 0 files.
//
// Usage: node scripts/add-lane-b-nav.mjs [--check]
//   --check writes nothing and exits 1 if any file would change.
import {readFileSync, writeFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scripts', '_includes']);
// partners/index.html is a redirect stub with no chrome.
const SKIP_FILES = new Set(['partners/index.html']);
const PAGE_ONLY_NAV = new Set(['partners/delivery/index.html']);

const NAV_OPEN = '<nav class="main-nav" id="main-nav" aria-label="Primary">';
const NAV_OLD = '<a href="/#how">Our approach</a><a href="/labs/">Labs</a>';
const NAV_NEW = '<a href="/consulting/">Consulting</a><a href="/partners/delivery/">Partners</a>';
const FOOTER_AFTER = '<a href="/quietdesk/">QuietDesk</a>';
const FOOTER_NEW = '<a href="/consulting/">AI consulting</a><a href="/partners/delivery/">Technical partner</a>';

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

  // 1. Header nav.
  if (!PAGE_ONLY_NAV.has(rel)) {
    const navStart = out.indexOf(NAV_OPEN);
    if (navStart === -1) throw new Error(`${rel}: header nav opening tag not found`);
    const navEnd = out.indexOf('</nav>', navStart);
    const nav = out.slice(navStart, navEnd);
    if (!nav.includes('href="/consulting/"')) {
      if (!nav.includes(NAV_OLD)) throw new Error(`${rel}: nav anchor "Our approach · Labs" not found`);
      out = out.slice(0, navStart) + nav.replace(NAV_OLD, NAV_NEW) + out.slice(navEnd);
    }
  }

  // 2. Footer links.
  const fStart = out.indexOf('<footer class="site-footer">');
  const fEnd = out.indexOf('</footer>', fStart);
  if (fStart === -1 || fEnd === -1) throw new Error(`${rel}: footer not found`);
  let footer = out.slice(fStart, fEnd);
  const linksStart = footer.indexOf('<div class="footer-links">');
  const bottomStart = footer.indexOf('<div class="footer-bottom">');
  if (linksStart === -1 || bottomStart === -1) throw new Error(`${rel}: footer-links or footer-bottom not found`);
  if (!footer.slice(linksStart, bottomStart).includes('href="/consulting/"')) {
    const at = footer.indexOf(FOOTER_AFTER, linksStart);
    if (at === -1 || at > bottomStart) throw new Error(`${rel}: footer anchor "QuietDesk" not found`);
    footer = footer.slice(0, at + FOOTER_AFTER.length) + FOOTER_NEW + footer.slice(at + FOOTER_AFTER.length);
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
    console.error('add-lane-b-nav: ' + err.message);
    return 1;
  }
  for (const rel of changed) console.log((check ? 'would change ' : 'changed ') + rel);
  console.log(`${check ? 'would change' : 'changed'} ${changed.length} files (of ${files.length})`);
  return check && changed.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
