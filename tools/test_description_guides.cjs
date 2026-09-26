/* npm install --prefix /tmp/srm-ui-test jsdom@26.1.0
 * NODE_PATH=/tmp/srm-ui-test/node_modules node tools/test_description_guides.cjs
 * Runtime checks for the 화면설계 Description drawer (DESIGN_GUIDE 5.15), after all page scripts ran:
 * - pages with a drawer have exactly one D button and one drawer, numbered 1..n without gaps;
 * - every target marker written in the page survives page scripts and shows a drawer number;
 * - markers in the page's popups show a drawer number or are hidden (not in this page's drawer);
 * - numbers are drawn from data-description-number, so table headers/buttons keep their own text;
 * - D opens the drawer (body.description-guide-open) and Esc closes it.
 * Pure DOM tests. Does not launch a browser.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { open } = require('./test_conditional_ui.cjs');

const root = path.resolve(__dirname, '..', 'modules');
let checks = 0;
function check(value, message) { checks++; assert.ok(value, message); }
// body.description-guide-open is synced by a MutationObserver (microtask).
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

(async () => {
  let pages = 0;
  for (const mod of fs.readdirSync(root).sort()) {
    for (const file of fs.readdirSync(path.join(root, mod)).filter(name => name.endsWith('.html')).sort()) {
      const html = fs.readFileSync(path.join(root, mod, file), 'utf8');
      const hasButton = html.includes('class="description-floating-button"');
      const ownRefs = [...html.matchAll(/class="description-target-marker[^"]*" data-description-ref="([^"]+)"/g)].map(m => m[1]);
      if (!hasButton) { check(ownRefs.length === 0, `${file}: markers without a drawer`); continue; }
      pages++;
      const app = await open(file);
      const d = app.w.document;
      check(app.errors.length === 0, `${file}: ${app.errors.join('\n')}`);
      check(d.querySelectorAll('.description-floating-button').length === 1, `${file}: one D button`);
      const guides = d.querySelectorAll('.description-guide-backdrop');
      check(guides.length === 1, `${file}: one drawer`);
      const numbers = [...guides[0].querySelectorAll('.description-mapping-number')].map(n => n.textContent.trim()).filter(Boolean);
      check(numbers.every((n, i) => n === String(i + 1)), `${file}: drawer numbers continue 1..n (${numbers.join(',')})`);
      const live = new Map();
      d.querySelectorAll('.description-target-marker[data-description-ref]').forEach(m => live.set(m.dataset.descriptionRef, m));
      for (const ref of new Set(ownRefs)) {
        const marker = live.get(ref);
        check(marker, `${file}: marker ${ref} removed by page scripts`);
        check(marker.dataset.descriptionNumber && numbers.includes(marker.dataset.descriptionNumber.replace(/[’']+$/, '')), `${file}: marker ${ref} has no drawer number`);
        check(marker.textContent === '', `${file}: marker ${ref} must not add text to the page`);
      }
      d.querySelectorAll('.modal-backdrop:not(.description-guide-backdrop) .description-target-marker[data-description-ref]').forEach(marker => {
        const number = marker.dataset.descriptionNumber;
        check(number ? numbers.includes(number.replace(/[’']+$/, '')) : marker.hidden, `${file}: popup marker ${marker.dataset.descriptionRef} is neither numbered nor hidden`);
      });
      // 고객 통보 코드(MSG-###) 미리보기: 원문 글자는 그대로 두고 코드만 버튼이 되며, 누르면 카탈로그 원문을 표시
      const catalog = app.w.SRM_MESSAGE_CATALOG;
      for (const code of d.querySelectorAll('.description-message-code')) {
        const item = code.closest('.description-mapping-item');
        check(item && item.querySelector('pre').textContent.includes(code.textContent), `${file}: message code outside Description text`);
        code.click();
        const message = catalog[code.dataset.messageCode];
        check(!d.querySelector('.message-preview').hidden, `${file}: ${code.textContent} opens the phone preview`);
        check(d.querySelector('.phone-bubble').textContent === message.smsBody && d.querySelector('.phone-mail-body').textContent === message.mailBody && d.querySelector('.phone-mail-subject').textContent === message.mailSubject, `${file}: ${code.textContent} preview differs from the xlsx`);
        d.querySelector('.message-preview-close').click();
        check(d.querySelector('.message-preview').hidden, `${file}: phone preview closes`);
      }
      d.querySelector('.description-floating-button').click();
      await tick();
      check(d.body.classList.contains('description-guide-open'), `${file}: D opens the drawer`);
      d.dispatchEvent(new app.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await tick();
      check(!d.body.classList.contains('description-guide-open'), `${file}: Esc closes the drawer`);
      app.close();
    }
  }
  console.log(`PASS: ${pages} pages with Description drawer; ${checks} assertions`);
})().catch(error => { console.error(error); process.exit(1); });
