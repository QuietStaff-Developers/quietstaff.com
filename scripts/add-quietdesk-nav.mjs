// RETIRED (site redesign 2026-11-01). The header and footer are now synced from index.html by
// scripts/apply-chrome.mjs (run it after any chrome change; --check verifies). This script's
// old anchors ("Our approach · Labs", .footer-links as a flat list) no longer exist, so it does
// nothing and exits 0. Kept so older publish steps that call it with --check keep passing.
console.log('add-quietdesk-nav: retired, chrome is synced by scripts/apply-chrome.mjs');
