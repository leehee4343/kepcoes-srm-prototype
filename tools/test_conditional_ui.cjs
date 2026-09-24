/* npm install --prefix /tmp/srm-ui-test jsdom@26.1.0
 * NODE_PATH=/tmp/srm-ui-test/node_modules node tools/test_conditional_ui.cjs
 * Pure DOM tests. Does not launch or control a browser, network or backend.
 */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/scripts/dashboard.js'), 'utf8');
const files = fs.readdirSync(path.join(root, 'modules')).flatMap(module => fs.readdirSync(path.join(root, 'modules', module)).filter(name => name.endsWith('.html')).map(name => path.join(root, 'modules', module, name)));
let checks = 0;
function check(value, message) { checks++; assert.ok(value, message); }
async function open(name, state = {}, record = '', fragment = '') {
  const file = files.find(file => path.basename(file) === name);
  assert.ok(file, name);
  const errors = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'), { url: `file://${file}?ui=${encodeURIComponent(JSON.stringify(state))}&record=${encodeURIComponent(record)}${fragment}`, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window; await new Promise(resolve => w.addEventListener('load', resolve));
  const bundle = path.join(path.dirname(file), 'popups/popup-bundle.js'); if (fs.existsSync(bundle)) w.eval(fs.readFileSync(bundle, 'utf8'));
  let boot;
  const add = w.document.addEventListener.bind(w.document);
  w.document.addEventListener = (type, fn, ...rest) => type === 'DOMContentLoaded' ? boot = fn : add(type, fn, ...rest);
  w.eval(source); w.document.addEventListener = add; w.scrollTo = () => {};
  await boot();
  const q = selector => w.document.querySelector(selector);
  const pick = (field, value, scope = 'main') => {
    const el = q(`${scope} [data-ui-field="${field}"][value="${value}"]`);
    check(el && !el.disabled, `${name}: selectable ${field}=${value}`);
    el.click(); return el;
  };
  return { w, q, pick, errors, close: () => w.close() };
}
if (require.main === module) (async () => {
  for (const file of files) {
    const app = await open(path.basename(file));
    check(app.errors.length === 0, `${file}: ${app.errors.join('\n')}`);
    const controls=Array.from(app.w.document.querySelectorAll('[data-ui-field], [data-ui-show], [data-ui-enable]'));
    check(controls.every(el=>el.closest('[data-ui-scope]')), `${file}: UI controls remain inside their scope`);
    const triggers=Array.from(app.w.document.querySelectorAll('[data-open-modal]'));
    check(triggers.every(el=>app.w.document.getElementById(el.dataset.openModal)), `${file}: popup targets resolve`);
    // Every completed-step popup must suppress attachment editing, including
    // the separate browse button, and restore it when registration is reopened.
    for (const view of triggers.filter(el => el.dataset.uiView === 'read')) {
      const modal = app.w.document.getElementById(view.dataset.openModal);
      const pickers = Array.from(modal.querySelectorAll('button, a')).filter(el => /찾아보기|파일\s*선택|업로드/.test(el.textContent));
      const previous = pickers.map(el => el.hidden);
      // Exercise the view handler even when this fixture's step is not yet complete.
      view.dispatchEvent(new app.w.MouseEvent('click', { bubbles: true }));
      check(pickers.every(el => el.hidden), `${file}: ${modal.id} completed attachments are read-only`);
      check(Array.from(modal.querySelectorAll('.file-dropzone')).every(el => el.hidden), `${file}: ${modal.id} hides dropzones`);
      check(Array.from(modal.querySelectorAll('input[type="file"]')).every(el => el.hidden), `${file}: ${modal.id} hides native uploads`);
      const edit = triggers.find(el => el.dataset.openModal === modal.id && el.dataset.uiView !== 'read');
      if (edit) {
        edit.dispatchEvent(new app.w.MouseEvent('click', { bubbles: true }));
        check(pickers.every((el, i) => el.hidden === previous[i]), `${file}: ${modal.id} restores attachment editing`);
        check(Array.from(modal.querySelectorAll('.file-dropzone')).every(el => !el.hidden), `${file}: ${modal.id} restores dropzones`);
      }
    }
    app.close();
  }
  for (const name of ['SRMOrderContractRequestManageChecklist.html', 'SRMOrderPlanRegisterManageChecklist.html']) {
    const app = await open(name); const { q, pick } = app;
    pick('method', 'sole');
    check(q('[data-ui-field="award"][value="lowest"]').checked, 'sole selects lowest');
    for (const value of ['restricted', 'simultaneous', 'separate', 'qualification']) check(q(`[data-ui-field="award"][value="${value}"]`).disabled, 'sole disables '+value);
    check(!q('[data-ui-show="method=sole"]').hidden, 'sole fields shown');
    for (const method of ['general', 'limited', 'designated']) {
      pick('method', method);
      check(q('[data-ui-show="method=sole"]').hidden, 'sole fields hidden');
      for (const award of ['lowest', 'restricted', 'simultaneous', 'separate', 'qualification']) {
        pick('award', award);
        const price = q('[data-ui-field="price"]');
        if (price) {
          const expected = ['restricted', 'qualification'].includes(award) ? 'reserve' : 'planned';
          check(q(`[data-ui-field="price"][value="${expected}"]`).checked, method+'/'+award+' price');
          check(q('[data-ui-field="price"][value="estimated"]').disabled, 'estimate only for sole');
        }
      }
    }
    if (q('[data-ui-field="price"]')) {
      pick('method', 'sole'); pick('price', 'estimated');
      check(q('[data-ui-required="price=planned|reserve"] .required').hidden, 'estimated: decider optional');
      check(q('[data-ui-required="method=general|limited|designated"] .required').hidden, 'sole: bid bond optional');
      pick('price', 'planned'); check(!q('[data-ui-required="price=planned|reserve"] .required').hidden, 'planned: decider required');
    }
    app.close();
  }
  for (const award of ['lowest','restricted','simultaneous','separate','qualification']) {
    const app = await open('StepWorkflowBidPlan.html', { method:'designated', award });const {q,pick}=app;
    check(!q('[data-ui-show="method=designated"]').hidden,'designated vendors shown');
    check(q('[data-ui-show="award=simultaneous"]').hidden === (award!=='simultaneous'),'combined ratio');
    check(q('[data-ui-field="tie"][value="price"]').disabled === (award!=='simultaneous'),'tie restriction');
    check(q('[data-ui-enable="briefing=yes"] input').disabled,'briefing disabled');pick('briefing','yes');check(!q('[data-ui-enable="briefing=yes"] input').disabled,'briefing enabled');
    if(award==='simultaneous') {pick('negotiated','yes');pick('presentation','yes');check(!q('[data-ui-enable="negotiated=yes;presentation=yes"] input').disabled,'presentation enabled');pick('negotiated','no');check(q('[data-ui-field="presentation"][value="no"]').checked,'presentation reset');}
    app.close();
  }
  for(const name of ['SRMDetailContract.html','SRMSoleSourceStatusContract.html']) {
    const app=await open(name);const {q,pick}=app;
    for(const mode of ['all','other','split']) {pick('payment',mode);for(const other of ['all','other','split'])check(q(`[data-ui-show="payment=${other}"]`).hidden===(mode!==other),'payment branch '+mode+'/'+other);}
    for(const bond of ['bond1','bond2','bond3']) {pick(bond,'no');check(q(`[data-ui-show="${bond}=yes"]`).hidden,'bond hidden');pick(bond,'yes');check(!q(`[data-ui-show="${bond}=yes"] input`).disabled,'bond input shown');}
    app.close();
  }
  {
    const app=await open('SRMContractStatus.html');const {q,pick}=app;pick('change','period','#ctChangeFormModal');check(q('#ctChangeFormModal [data-ui-show="change=amount"]').hidden,'contract amount hidden');check(!q('#ctChangeFormModal [data-ui-show="change=period"]').hidden,'contract period shown');pick('change','amount','#ctChangeFormModal');check(q('#ctChangeFormModal [data-ui-show="change=period"] input')?.disabled ?? true,'hidden contract field disabled');app.close();
  }
  {
    const app=await open('SRMLoginStats.html');check(!app.q('[data-ui-show="basis=month"]').hidden,'monthly default');app.pick('basis','day');check(app.q('[data-ui-show="basis=month"]').hidden,'monthly hidden');check(!app.q('[data-ui-show="basis=day"]').hidden,'daily shown');app.close();
  }
  {
    const app=await open('SRMDetailOpening.html');const {q}=app;check(q('table[aria-label="개찰 결과"] tbody tr').cells[4].textContent==='********','before opening price masked');check(q('table[aria-label="개찰 결과"] [data-open-modal]').disabled,'before opening files disabled');q('#bidOpenConfirmModal .btn-critical-primary').click();check(q('table[aria-label="개찰 결과"] tbody tr').cells[4].textContent==='157,000,000','after opening price visible');app.close();
  }
  for(const award of ['lowest','restricted','simultaneous','separate','qualification']) {
    const app=await open('SRMDetailWinner.html',{award,opened:'true'});
    const visible=Array.from(app.w.document.querySelectorAll('[data-ui-winner-table]')).filter(t=>!t.closest('[hidden]'));check(visible.length===1,'one winner table per award');check(visible[0].querySelector('input[type=radio]'),'single winner selection');app.close();
  }
  {
    const app=await open('SRMPartnerQna.html');const {q,w}=app;
    const links=w.document.querySelectorAll('main [data-open-modal="partnerQnaDetailView"]');
    const heading=Array.from(w.document.querySelectorAll('#partnerQnaDetailView h2')).find(el=>el.textContent==='답변 내용').closest('.srm-section-heading');
    links[0].click();check(heading.hidden,'unanswered Q&A hides answer');
    check(!Array.from(q('#partnerQnaDetailView').querySelectorAll('button')).find(el=>el.textContent==='수정').hidden,'unanswered Q&A editable');
    links[1].click();check(!heading.hidden,'answered Q&A shows answer');
    check(Array.from(q('#partnerQnaDetailView').querySelectorAll('button')).find(el=>el.textContent==='수정').hidden,'answered Q&A locks edits');app.close();
  }
  {
    const app=await open('SRMMailSend.html');const {q,pick,w}=app;
    pick('channel','sms');check(q('[data-ui-show="channel=both|email"]').hidden,'SMS hides email');
    pick('channel','email');check(q('[data-ui-show="channel=both|sms"]').hidden,'email hides SMS');
    const table=q('table[aria-label="대상 확정 목록"]');const count=table.tBodies[0].rows.length;
    const modal=q('#msStaffPickModal');modal.querySelector('tbody input').checked=true;
    Array.from(modal.querySelectorAll('button')).find(el=>el.textContent.trim()==='선택 추가').click();
    check(table.tBodies[0].rows.length===count+1,'recipient picker appends selected row');app.close();
  }
  {
    const app=await open('SRMSoleSourcePlanManageDocuments.html');const {q}=app;
    const checkbox=q('[data-ui-field="documents"]');check(q('[data-ui-show="documents=true"]').hidden,'optional sole documents hidden');
    checkbox.click();check(!q('[data-ui-show="documents=true"]').hidden,'optional sole documents shown');
    checkbox.click();check(q('[data-ui-show="documents=true"]').hidden,'optional sole documents hidden again');app.close();
  }
  {
    const app=await open('SRMDetailOpening.html',{award:'simultaneous'});const {q,w}=app;
    q('#bidOpenConfirmModal .btn-critical-primary').click();
    const complete=Array.from(w.document.querySelectorAll('main button')).find(el=>el.textContent==='가격점수 입력하기(개찰완료 처리)');
    check(!complete.hidden && complete.disabled,'simultaneous opening requires price scores');
    w.document.querySelectorAll('[data-ui-price-score]').forEach(input=>{input.value='20';input.dispatchEvent(new w.Event('input',{bubbles:true}));});
    check(!complete.disabled,'all eligible price scores enable completion');complete.click();
    check(complete.hidden,'opening completion hides score action');check(q('[data-ui-price-score]').disabled,'completed price scores readonly');app.close();
  }
  for(const name of ['SRMMailContentForm.html','SRMMailContentDetail.html']) {
    const app=await open(name);check(!app.q('[data-ui-show="channel=both|email"]').hidden,'mail template initially visible');
    app.pick('channel','sms');check(app.q('[data-ui-show="channel=both|email"]').hidden,'mail template follows channel');app.close();
  }
  for(const items of ['unit','custom']) {
    const app=await open('SRMPreQuoteRequestManageItems.html',{items});
    check(app.q('[data-ui-show="items=unit"]').hidden===(items!=='unit'),'common items button condition');
    check(app.q('#pqItemFormModal [data-ui-show="items=custom"]').hidden===(items!=='custom'),'item modal inherits parent selection');app.close();
  }
  {
    const app=await open('StepWorkflow.html');const {q,w}=app;
    const view=w.document.querySelector('[data-ui-view="read"][data-open-modal="bidPriceRegisterModal"]');
    check(view,'completed price step has view trigger');view.click();
    const modal=q('#bidPriceRegisterModal');check(modal.querySelector('input').hidden,'completed price popup text-only');
    check(Array.from(modal.querySelectorAll('button')).filter(el=>/저장|등록/.test(el.textContent)).every(el=>el.hidden),'completed price popup hides save');
    const edit=w.document.querySelector('[data-open-modal="bidPriceRegisterModal"]:not([data-ui-view])');edit.click();
    check(!modal.querySelector('input').hidden,'price edit mode restored');app.close();
  }
  console.log(`PASS: ${files.length} pages initialized; ${checks} assertions`);
})().catch(error => { console.error(error.stack); process.exitCode=1; });

module.exports = { open };
