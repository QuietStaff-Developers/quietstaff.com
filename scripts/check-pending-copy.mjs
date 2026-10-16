// Publish gate for unfinished legal and page copy (UI-SPEC 9.4, D-07).
//
// Fails (exit 1) while any html file under the root still carries a pending marker:
//   1. a class attribute containing the token "pending-copy"
//   2. the text "data-pending="
//   3. the text "[pending:" (case-insensitive)
// Exit 0 means a clean tree. Exit 2 means the root is missing or holds no html (fail closed).
// There is deliberately no allow-list and no bypass flag.
//
// Usage: node scripts/check-pending-copy.mjs [--root <dir>] [--self-test]
import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scripts']);

const CLASS_ATTR = /\bclass\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

export function findPending(text) {
  const findings = [];
  const lines = String(text).split(/\r\n|\r|\n/);
  lines.forEach((lineText, i) => {
    const line = i + 1;
    let m;
    CLASS_ATTR.lastIndex = 0;
    while ((m = CLASS_ATTR.exec(lineText)) !== null) {
      const tokens = (m[1] ?? m[2] ?? '').split(/\s+/);
      if (tokens.includes('pending-copy')) {
        findings.push({line, kind: 'class', message: 'class="pending-copy" placeholder is still present'});
      }
    }
    if (lineText.includes('data-pending=')) {
      findings.push({line, kind: 'data-pending', message: 'data-pending= attribute is still present'});
    }
    if (lineText.toLowerCase().includes('[pending:')) {
      findings.push({line, kind: 'marker', message: '[pending: ...] marker is still present'});
    }
  });
  return findings;
}

function walk(dir, root, out) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name) && path.relative(root, full).split(path.sep).includes(name)) continue;
      walk(full, root, out);
    } else if (st.isFile() && name.endsWith('.html')) {
      out.push(full);
    }
  }
}

export function scanTree(root) {
  const abs = path.resolve(root);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) return {files: [], findings: [], missing: true};
  const files = [];
  walk(abs, abs, files);
  files.sort();
  const findings = [];
  for (const file of files) {
    for (const f of findPending(readFileSync(file, 'utf8'))) {
      findings.push({file: path.relative(abs, file).split(path.sep).join('/'), ...f});
    }
  }
  return {files, findings, missing: false};
}

function selfTest() {
  const failures = [];
  const check = (ok, name) => { if (!ok) failures.push(name); };
  const fixture = readFileSync(path.join(here, 'fixtures', 'pending-copy-sample.html'), 'utf8');
  const kinds = new Set(findPending(fixture).map(f => f.kind));
  check(kinds.has('class'), 'fixture must trigger the class="pending-copy" marker');
  check(kinds.has('data-pending'), 'fixture must trigger the data-pending= marker');
  check(kinds.has('marker'), 'fixture must trigger the [pending: marker');
  check(findPending('<!doctype html><html><body><p class="lead">Clean page.</p></body></html>').length === 0,
    'clean in-memory string must return zero findings');
  check(findPending('<p class="a pending-copy b">x</p>').length === 1, 'class token inside a longer class list must match');
  const tree = scanTree(path.join(here, 'fixtures'));
  check(tree.findings.length >= 3, 'scanTree on fixtures must return at least three findings');
  if (failures.length) {
    for (const f of failures) console.error('check-pending-copy self-test FAILED: ' + f);
    return 1;
  }
  console.log('check-pending-copy self-test: ok');
  return 0;
}

function main(argv) {
  if (argv.includes('--self-test')) return selfTest();
  let root = path.resolve(here, '..');
  const i = argv.indexOf('--root');
  if (i !== -1) {
    if (!argv[i + 1]) { console.error('check-pending-copy: --root needs a directory'); return 2; }
    root = path.resolve(process.cwd(), argv[i + 1]);
  }
  const {files, findings, missing} = scanTree(root);
  if (missing) { console.error(`check-pending-copy: root not found: ${root}`); return 2; }
  if (files.length === 0) { console.error(`check-pending-copy: no html files under ${root}, refusing to pass an empty scan`); return 2; }
  for (const f of findings) console.log(`${f.file}:${f.line}: ${f.message}`);
  if (findings.length) {
    const n = new Set(findings.map(f => f.file)).size;
    console.log(`check-pending-copy: FAIL, ${findings.length} pending marker(s) in ${n} file(s) (${files.length} html files scanned)`);
    return 1;
  }
  console.log(`check-pending-copy: ok (${files.length} html files scanned)`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
