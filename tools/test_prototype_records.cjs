/* NODE_PATH=/tmp/srm-ui-test/node_modules node tools/test_prototype_records.cjs */
const { open } = require('./test_conditional_ui.cjs');
const assert = require('node:assert/strict');
let checks = 0;
const check = (value, message) => { checks++; assert.ok(value, message); };
(async () => {
  const lists = {
    'SRMOrderContractRequest.html': 17, 'SRMOrderContractStatus.html': 17,
    'SRMOrderPlanIntake.html': 17, 'SRMOrderPlanRegister.html': 17,
    'SRMSoleSourcePlan.html': 2, 'SRMSoleSourceStatus.html': 2,
    'StepWorkflow.html': 15, 'SRMDetail.html': 15,
    'SRMContractStatus.html': 17, 'SRMPartnerBidNotice.html': 15,
    'SRMPartnerBidJoin.html': 15, 'SRMPartnerNegoRequest.html': 2,
    'SRMPartnerContract.html': 17
  };
  for (const [name, count] of Object.entries(lists)) {
    const app = await open(name);
    const rows = [...app.w.document.querySelectorAll('table[data-prototype-list] tbody tr')];
    check(rows.length === count, `${name}: ${count} sample records`);
    check(new Set(rows.map(row => row.dataset.prototypeRecord)).size === count, `${name}: unique records`);
    check(app.errors.length === 0, `${name}: no errors`);
    for (const row of rows) for (const a of row.querySelectorAll('a[href]:not([href^="#"])')) {
      const url = new URL(a.href);
      check(url.searchParams.get('record') === row.dataset.prototypeRecord, `${name}: link carries row record`);
    }
    const filter = app.q('[data-ui-scope="filter"]');
    const method = filter?.querySelector('[data-ui-field="method"]');
    const award = filter?.querySelector('[data-ui-field="award"]');
    if (method && award && count !== 2) {
      method.value = 'designated'; method.dispatchEvent(new app.w.Event('change', { bubbles: true }));
      award.value = 'qualification'; award.dispatchEvent(new app.w.Event('change', { bubbles: true }));
      filter.dispatchEvent(new app.w.Event('submit', { bubbles: true, cancelable: true }));
      const matched = rows.filter(row => row.dataset.filteredOut !== 'true');
      check(matched.length === 1 && matched[0].dataset.prototypeRecord === 'designated-qualification-reserve', `${name}: combined search`);
      filter.querySelector('.btn-filter-reset, .btn-reset-main').click();
      check(rows.every(row => row.dataset.filteredOut === 'false'), `${name}: reset restores all`);
    }
    app.close();
  }
  const catalogApp = await open('SRMContractStatus.html');
  const records = JSON.parse(JSON.stringify(catalogApp.w.srmPrototypeRecords)); catalogApp.close();
  for (const record of records) {
    for (const name of ['SRMContractStatusDetail.html', 'SRMContractStatusDetailRequest.html', 'SRMContractStatusDetailBidPlan.html', ...(record.state.method === 'sole' ? ['SRMSoleSourceStatusPlan.html'] : ['SRMPartnerBidNoticeDetail.html', 'SRMDetail.html', 'SRMDetailWinner.html'])]) {
      const app = await open(name, {}, record.id);
      check(app.errors.length === 0, `${name}/${record.id}: no errors`);
      const method = app.q('main [data-ui-text="method"]');
      const award = app.q('main [data-ui-text="award"]');
      if (method) check([...app.w.document.querySelectorAll('main [data-ui-text="method"]')].every(el => el.textContent === record.methodLabel), `${name}/${record.id}: summary and detail methods`);
      if (award) check(award.textContent === record.awardLabel, `${name}/${record.id}: award`);
      const table = app.q(`[data-ui-winner-table="${record.state.award}"]`);
      if (table) check(!table.hidden && !table.closest('[hidden]'), `${record.id}: winner table`);
      for (const a of app.w.document.querySelectorAll('.detail-tabs-bar a[href]')) check(new URL(a.href).searchParams.get('record') === record.id, `${name}: tabs preserve identity`);
      if (name === 'SRMContractStatusDetailBidPlan.html') {
        check(app.q('section[data-ui-show="method=sole"]').hidden === (record.state.method !== 'sole'), `${record.id}: correct contract plan`);
        const rate = [...app.w.document.querySelectorAll('.srm-kv-row')].find(row => row.querySelector('dt')?.textContent === '종합평가 비율');
        check(rate.hidden === (record.state.award !== 'simultaneous'), `${record.id}: ratio conditional`);
      }
      app.close();
    }
  }
  {
    const app = await open('SRMSoleSourceStatus.html');
    for (const id of ['sole-lowest-planned', 'sole-lowest-estimated']) {
      app.q(`[data-prototype-record="${id}"] a`).click();
      const record = records.find(record => record.id === id);
      check(app.q('main [data-ui-text="method"]').textContent === record.methodLabel, 'switching selected row changes detail');
      check(app.q('main [data-ui-text="award"]').textContent === record.awardLabel, 'switching selected row resets award');
      check((new URLSearchParams(app.w.location.hash.slice(1)).get('record') || new URL(app.w.location.href).searchParams.get('record')) === id, 'same-page selection survives refresh');
    }
    app.close();
  }
  {
    const app = await open('SRMLogin.html');
    check(app.w.document.querySelectorAll('.bidding-slide').length === 15, 'public carousel covers competitive matrix');
    app.q('[data-prototype-record="designated-simultaneous-planned"] .bidding-project-name').click();
    check(app.q('#modalBiddingDetail [data-ui-text="method"]').textContent === '경쟁입찰(지명)', 'public modal method');
    check(app.q('#modalBiddingDetail [data-ui-text="award"]').textContent.includes('동시'), 'public modal award');
    const title = [...app.w.document.querySelectorAll('#modalBiddingDetail th')].find(el => el.textContent === '입찰건명').nextElementSibling;
    check(title.textContent.includes('경쟁입찰(지명)'), 'public modal identity');
    check(app.errors.length === 0, 'public selection no errors'); app.close();
  }
  {
    const app = await open('SRMDetail.html', { method: 'designated', award: 'simultaneous' }, 'designated-simultaneous-planned', '#record=limited-lowest-planned');
    check(app.q('main [data-ui-text="method"]').textContent === '경쟁입찰(제한)', 'file fragment selection overrides previous query after reload');
    check(app.q('main [data-ui-text="award"]').textContent === '최저가', 'file reload does not restore previous award');
    app.close();
  }
  console.log(`PASS: ${checks} record/list/detail assertions`);
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
