import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const finance = await readFile(new URL('../src/FinancePages.tsx', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

test('finance landing introduces donations before account instructions and transaction links', () => {
  const start = finance.indexOf('export function FinanceLanding');
  const end = finance.indexOf('function BackToFinance', start);
  const landing = finance.slice(start, end);
  const indexes = [
    '여러분의 응원이 모여',
    '후원 계좌 안내',
    '후원 및 회계 내역',
    '후원 내역 확인',
    '회비 집행 내역 확인',
  ].map(phrase => landing.indexOf(phrase));
  assert.ok(indexes.every(index => index >= 0));
  assert.ok(indexes.every((index, pos) => pos === 0 || indexes[pos - 1] < index));
  assert.match(landing, /onClick=\{onDonations\}/);
  assert.match(landing, /onClick=\{onExpenses\}/);
});
test('account is explicitly unconfigured and never advertises an invented payable account', () => {
  assert.doesNotMatch(finance, /계좌 정보 등록 예정|finance-bank-pending/);
  assert.match(finance, /<span>은행<\/span><strong>등록 예정<\/strong>/);
  assert.match(finance, /<span>계좌번호<\/span><strong>등록 예정<\/strong>/);
  assert.match(finance, /<span>예금주<\/span><strong>등록 예정<\/strong>/);
  assert.match(styles, /\.finance-privacy-note\s*\{[^}]*margin-top:\s*24px;/s);
  assert.doesNotMatch(styles, /\.finance-bank-pending\s*\{/);
  assert.doesNotMatch(finance, /후원 계좌가 아직 등록되지 않았습니다|입금 전 운영진에게 계좌 정보를 확인해 주세요/);
  assert.ok(!/\b\d{2,4}-\d{2,6}-\d{3,9}\b/.test(finance));
});
test('bank fields have no bottom padding at desktop and mobile widths', () => {
  assert.match(styles, /\.finance-bank-fields\s*\{[^}]*padding:\s*28px 0 0;/s);
  assert.match(styles, /@media \(max-width:\s*680px\)[\s\S]*?\.finance-bank-fields\s*\{[^}]*padding:\s*20px 0 0;/);
});

test('donations load sanitized public and student-specific histories and restrict staff manager button', () => {
  assert.match(finance, /getPublicDonations\(\)/);
  assert.match(finance, /getOwnDonations\(\)/);
  assert.match(finance, /canManageDonations&&<div className="finance-manager-entry">/);
  assert.match(finance, /onClick=\{onManage\}/);
  assert.match(finance, /finance-personal-columns"><span>후원일<\/span><span>후원 금액<\/span>/);
  assert.doesNotMatch(finance, /<span>후원 내역<\/span>/);
  assert.match(finance, /row\.donorName/);
  assert.match(finance, /row\.amount/);
  assert.match(finance, /authPending\?/);
  assert.match(finance, /loggedIn\?<div className="finance-record-table">/);
  assert.match(finance, /onClick=\{onLogin\}/);
});
test('finance management uses separate protected route, not the public list', () => {
  assert.match(app, /\| 'finance' \| 'donations' \| 'donation-manage' \| 'expenses'/);
  assert.match(app, /page === 'donation-manage' \? '\/finance\/donations\/manage'/);
  assert.match(app, /return 'donation-manage'/);
  assert.match(app, /canManageDonations=currentLevel==='staff'\|\|currentLevel==='president'/);
  assert.match(app, /<DonationManagement onBack=\{\(\)=>navigate\('donations'\)\}/);
  assert.match(app, /window\.addEventListener\('popstate',onPop\)/);
  assert.match(app, /<FinanceLanding onDonations=\{\(\) => navigate\('donations'\)\} onExpenses=\{\(\) => navigate\('expenses'\)\}\/>/);
  assert.match(app, /<ExpenseHistory onBack=\{\(\) => navigate\('finance'\)\}\/>/);
  assert.match(app, /후원회계 초기화/);
  assert.match(app, /void resetDonationFinance\(\)/);
});
test('server-only sensitive ledger operations and accessible manager actions remain distinct', async () => {
  const manager=await readFile(new URL('../src/DonationManagement.tsx',import.meta.url),'utf8');
  const api=await readFile(new URL('../src/donationApi.ts',import.meta.url),'utf8');
  const publicRoute=await readFile(new URL('../functions/api/donations/public.js',import.meta.url),'utf8');
  const mineRoute=await readFile(new URL('../functions/api/donations/mine.js',import.meta.url),'utf8');
  const managementRoute=await readFile(new URL('../functions/api/donations/manage.js',import.meta.url),'utf8');
  for(const phrase of ['개별 추가','CSV 파일 선택','전체 CSV 다운로드','익명자 명단 관리','익명자 명단 저장','수정','실무단 이상']){
    assert.ok(manager.includes(phrase),phrase);
  }
  assert.match(api,/auth.currentUser\?\.getIdToken\(\)/);
  assert.match(publicRoute,/publicDonation\(record,registry.people\)/);
  assert.match(mineRoute,/record.studentId === studentId/);
  assert.match(managementRoute,/assertAccess\(request,env,'staff'\)/);
  assert.doesNotMatch(finance,/getDocs\(|collection\(/);
  assert.match(finance,/회비 집행 기록 연결 예정/);
});
test('three finance pages retain mobile-friendly layouts', () => {
  assert.match(styles, /\.finance-entry-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(styles, /@media \(max-width:\s*680px\)\s*\{[\s\S]*?\.finance-entry-grid\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(styles, /\.finance-bank-fields\s*\{/);
  assert.match(styles, /\.finance-login-gate\s*\{/);
});

test('footer copyright and nonclickable contacts share the same lower area', () => {
  const footer = app.slice(app.indexOf('<footer className="site-footer">'));
  const navStart = footer.indexOf('<nav className="footer-nav"');
  const navEnd = footer.indexOf('</nav>');
  const lower = footer.indexOf('<div className="container footer-lower">');
  const copyright = footer.indexOf('<div className="footer-bottom">');
  const contacts = footer.indexOf('<div className="footer-contact-section">');
  assert.ok(navStart >= 0 && navEnd > navStart && lower > navEnd && copyright > lower && contacts > copyright);
  assert.match(footer, /© MYROCK · 성균관대학교 중앙 밴드동아리/);
  assert.match(footer, /<span>회장 김서연 · 010-6350-7007<\/span>/);
  assert.match(footer, /<span>부회장 신희수 · 010-7684-4336<\/span>/);
  assert.match(footer, /<span className="footer-bug-report">/);
  assert.match(footer, /오류 보고 · naa3000@naver.com/);
  assert.doesNotMatch(footer, /href="(?:tel:|mailto:)|기능 개발 중|운영진 연락처 등록 예정/);
});
test('footer copyright is top-left and contacts top-right with mobile stacking', () => {
  assert.match(styles, /\.site-footer \.footer-lower\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) max-content;[^}]*align-items:\s*start;[^}]*border-top:\s*1px solid var\(--border\);/s);
  assert.match(styles, /\.site-footer \.footer-bottom\s*\{[^}]*grid-column:\s*1;[^}]*grid-row:\s*1;[^}]*padding:\s*2px 0 0;/s);
  assert.match(styles, /\.site-footer \.footer-contact-section\s*\{[^}]*grid-column:\s*2;[^}]*grid-row:\s*1;[^}]*justify-self:\s*end;/s);
  assert.match(styles, /@media \(max-width:\s*620px\)[\s\S]*?\.site-footer \.footer-bottom\s*\{\s*grid-column:\s*1;\s*grid-row:\s*1;/);
  assert.match(styles, /@media \(max-width:\s*620px\)[\s\S]*?\.site-footer \.footer-contact-section\s*\{\s*grid-column:\s*1;\s*grid-row:\s*2;/);
});
