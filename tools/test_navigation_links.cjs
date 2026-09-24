/* Verify design-specific link columns, document popups, and record context. */
const assert = require('node:assert/strict');
const { open } = require('./test_conditional_ui.cjs');
const fs = require('node:fs');
let checks = 0;
function check(condition, message) { checks++; assert.ok(condition, message); }
const norm = value => value.replace(/\s/g, '');
function findTable(document, heading) {
  return [...document.querySelectorAll('main table')].find(t => [...t.querySelectorAll('thead th')].some(h => norm(h.textContent) === norm(heading)));
}
function cells(table, heading) {
  const index = [...table.querySelectorAll('thead th')].findIndex(h => norm(h.textContent) === norm(heading));
  assert.ok(index >= 0, heading);
  return [...table.querySelectorAll('tbody tr')].filter(r => r.cells.length > index).map(r => r.cells[index]);
}
(async () => {
  const rules = [
    ['SRMPartnerPreQuote.html', '견적요청번호', '견적요청명'],
    ['SRMPreQuoteRequest.html', '견적요청번호', '견적요청명'],
    ['SRMPreQuoteStatus.html', '견적요청번호', '견적요청명'],
    ['SRMOrderContractRequest.html', '발주계약 요청번호', '건명'],
    ['SRMOrderPlanRegister.html', '발주계약 품의번호', '품의 건명'],
    ['SRMSoleSourcePlan.html', '공고 번호', '수의계약 건명'],
    ['SRMContractStatus.html', '계약 번호', '계약명'],
    ['SRMPartnerContract.html', '계약 번호', '계약명'],
    ['SRMCommonItemManage.html', '품목코드', '품목명'],
    ['SRMPartnerApproval.html', '업체명', '사업자번호'],
    ...fs.readdirSync('modules/07-2_입찰관리').filter(f => /^StepWorkflow.*\.html$/.test(f)).map(f => [f, '공고 번호', '입찰 건명']),
    ...['SRMSoleSourceStatus.html', 'SRMSoleSourceStatusPlan.html', 'SRMSoleSourceStatusQuote.html', 'SRMSoleSourceStatusContract.html'].map(f => [f, '공고 번호', '수의계약 건명'])
  ];
  for (const [name, plain, linked] of rules) {
    const a = await open(name), t = findTable(a.w.document, plain);
    check(cells(t, plain).every(c => !c.querySelector('a, [data-open-modal], [data-href]')), name + ': identifier is plain text');
    check(cells(t, linked).every(c => c.querySelector('a')), name + ': designed field is linked');
    a.close();
  }
  const split = [
    ['SRMOrderContractStatus.html', '발주계약 요청번호', '건명', 'ocReqDocModal', 'SRMOrderContractStatusDetail.html'],
    ['SRMOrderPlanIntake.html', '발주계약 요청번호', '건명', 'opReqDocModal', 'SRMOrderPlanIntakeDetail.html'],
    ['SRMPartnerBidNotice.html', '공고번호', '입찰 건명', 'bidNoticeDocModal', 'SRMPartnerBidNoticeDetail.html'],
    ['SRMPartnerBidJoin.html', '공고번호', '입찰 건명', 'bidNoticeDocModal', 'SRMPartnerBidJoinDetail.html'],
    ...fs.readdirSync('modules/07-2_입찰관리').filter(f => /^SRMDetail.*\.html$/.test(f)).map(f => [f, '공고 번호', '입찰 건명', 'bidNoticeDocModal', 'SRMDetailOrderPlan.html'])
  ];
  for (const [name, number, title, modalId, destination] of split) {
    const a = await open(name, {}, '', '#list'), t = findTable(a.w.document, number);
    for (const c of cells(t, number)) check(c.querySelector('a')?.dataset.openModal === modalId, name + ': number opens document');
    for (const c of cells(t, title)) check(new URL(c.querySelector('a').href).pathname.endsWith(destination), name + ': title opens detail');
    const row = t.querySelectorAll('tbody tr')[1], numberCell = cells(t, number)[1];
    numberCell.querySelector('a').click();
    check(a.q('#' + modalId).classList.contains('show'), name + ': popup shown');
    if (a.q('[data-detail-view]')) check(a.q('[data-detail-view]').hidden, name + ': document preview keeps list');
    check(!a.errors.length, name + ': no popup errors');
    a.close();
  }
  for (const [name, id] of [['SRMSoleSourceStatusQuote.html','ssQuoteSheetModal'],['SRMDetailNegotiation.html','bidQuoteSheetModal'],['SRMDetailOpening.html','bidQuoteSheetModal']]) {
    const a=await open(name,{opened:'true'},'general-lowest-planned');
    const link=a.q('[data-quote-preview]'); link.click();
    check(a.q('#'+id).classList.contains('show'),name+': quotation popup');
    check(a.q('#'+id+' [data-nav-value="quoteRound"]').textContent.includes(link.textContent),name+': selected quotation number');
    a.close();
  }
  {
    const a=await open('SRMDetailOpening.html',{opened:'false'},'general-lowest-planned');
    a.q('[data-quote-preview]').click();
    check(!a.q('#bidQuoteSheetModal').classList.contains('show'),'quotation is unavailable before opening');a.close();
  }
  for (const [name, id] of [['SRMCommonDocManage.html','cdFormModal'], ['SRMSourcingGroupManage.html','sgManageModal'], ['SRMCodeManage.html','codeManageModal']]) {
    const a=await open(name), link=a.q('[data-nav-edit]'); link.click();
    check(a.q('#'+id).classList.contains('show'),name+': name opens designed edit popup');
    check([...a.q('#'+id).querySelectorAll('input')].some(input=>input.value===link.textContent.trim()),name+': selected name is populated');
    a.close();
  }
  {
    const a=await open('SRMDetailNegotiation.html',{},'designated-simultaneous-planned');
    const links=[...a.w.document.querySelectorAll('a[href*="SRMDetailNegoQuoteInfo.html"]')];
    for (const link of links) {
      const url=new URL(link.href);
      check(url.searchParams.get('record')==='designated-simultaneous-planned','negotiation detail preserves record');
      check(!!url.searchParams.get('quote') && !!url.searchParams.get('round'),'negotiation detail preserves quotation round');
    }
    a.close();
  }
  console.log(`PASS: ${checks} navigation assertions`);
})().catch(error => { console.error(error.stack); process.exitCode=1; });
