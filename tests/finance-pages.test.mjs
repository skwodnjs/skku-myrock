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
  assert.match(finance, /계좌 정보 등록 예정/);
  assert.match(finance, /입금 전 운영진에게 계좌 정보를 확인해 주세요/);
  assert.ok(!/\b\d{2,4}-\d{2,6}-\d{3,9}\b/.test(finance));
});
test('anonymous donors are public as 익명 and their own donations are user-private after login', () => {
  for (const phrase of [
    '홍길동(비공개)',
    '해당 후원 건의 익명 처리를 요청',
    '전체 후원 내역',
    '이름 대신 <b>익명</b>',
    '모든 내역</b>을 익명 처리',
    '익명 처리 여부와 관계없이',
    '로그인 후 <b>내 후원 내역</b>에서 확인할 수 있습니다',
  ]) assert.ok(finance.includes(phrase), 'missing privacy copy: ' + phrase);
  assert.doesNotMatch(finance, /모두에게 공개되는 <b>전체 후원 내역<\/b>/);
  assert.doesNotMatch(finance, /실제 입금 내역을 계정과 연결하는 기능은 추후/);
  const donation = finance.slice(finance.indexOf('export function DonationHistory'), finance.indexOf('export function ExpenseHistory'));
  assert.match(donation, /loggedIn: boolean;/);
  assert.match(donation, /authPending: boolean;/);
  assert.match(donation, /authPending\s*\?\s*<FinanceEmpty/);
  assert.match(donation, /loggedIn\s*\?\s*<div className="finance-record-table">/);
  assert.match(donation, /onClick=\{onLogin\}/);
  assert.match(donation, /로그인 후 확인할 수 있습니다/);
  assert.match(donation, /전체 후원 내역/);
  assert.match(donation, /내 후원 내역/);
});
test('finance pages are shells with no mocked donor/expense data or direct database access', () => {
  assert.doesNotMatch(finance, /firestore|firebase|collection\(|getDocs\(|fetch\(/i);
  assert.match(finance, /후원 기록 연결 예정/);
  assert.match(finance, /내 후원 내역 연결 예정/);
  assert.match(finance, /회비 집행 기록 연결 예정/);
  assert.match(finance, /집행일/);
  assert.match(finance, /사용 항목/);
  assert.match(finance, /금액/);
});
test('nested finance routes survive direct URLs, navigation, and browser back/forward', () => {
  assert.match(app, /\| 'finance' \| 'donations' \| 'expenses'/);
  assert.match(app, /page === 'donations' \|\| page === 'expenses' \? \x60\/finance\/\$\{page\}\x60/);
  assert.match(app, /\/\^\\\/finance\\\/donations\\\/\?\$\//);
  assert.match(app, /\/\^\\\/finance\\\/expenses\\\/\?\$\//);
  assert.match(app, /window\.addEventListener\('popstate',onPop\)/);
  assert.match(app, /<FinanceLanding onDonations=\{\(\) => navigate\('donations'\)\} onExpenses=\{\(\) => navigate\('expenses'\)\}\/>/);
  assert.match(app, /<DonationHistory onBack=\{\(\) => navigate\('finance'\)\} loggedIn=\{Boolean\(user\)\} authPending=\{authPending\} onLogin=\{showLogin\}\/>/);
  assert.match(app, /<ExpenseHistory onBack=\{\(\) => navigate\('finance'\)\}\/>/);
});
test('three finance pages retain mobile-friendly layouts', () => {
  assert.match(styles, /\.finance-entry-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(styles, /@media \(max-width:\s*680px\)\s*\{[\s\S]*?\.finance-entry-grid\s*\{\s*grid-template-columns:\s*1fr/);
  assert.match(styles, /\.finance-bank-fields\s*\{/);
  assert.match(styles, /\.finance-login-gate\s*\{/);
});
