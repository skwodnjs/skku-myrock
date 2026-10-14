import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const stylesheet = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

test('club introduction lists all eight current officers in the requested order', () => {
  const block = app.match(/const currentOfficers = \[([\s\S]*?)\] as const;/)?.[1];
  assert.ok(block, 'current officers data must exist');
  const entries = [...block.matchAll(/name: '([^']+)', positions: '([^']+)'/g)]
    .map(([, name, positions]) => [name, positions]);
  assert.deepEqual(entries, [
    ['김서연', '회장, 보컬파트장'],
    ['신희수', '부회장'],
    ['배은성', '공연부장, 기타파트장'],
    ['허지원', '총무'],
    ['정해준', '홍보부장'],
    ['김하은', '베이트파트장'],
    ['추서현', '드럼파트장'],
    ['김민현', '키보드파트장'],
  ]);
});
test('officers have photo placeholders with consistent portrait ratio', () => {
  assert.match(app, /currentOfficers\.map\(officer/);
  assert.match(app, /<Placeholder label=\{\x60\$\{officer\.name\} 증명사진\x60\} className="leader-photo"\s*\/>/);
  assert.match(stylesheet, /\.leader-item \.leader-photo\s*\{[^}]*aspect-ratio:\s*3\s*\/\s*4/s);
});
test('club history contains just the two given milestones', () => {
  const history = app.match(/<SectionHeading title="연혁"([\s\S]*?)<\/section>/)?.[1] ?? '';
  assert.match(history, /199x년/);
  assert.match(history, /모여락 창단/);
  assert.match(history, /2023년/);
  assert.match(history, /중앙동아리 승격/);
  assert.equal((history.match(/<div><span>/g) ?? []).length, 2);
});
test('social links open the requested official accounts', () => {
  assert.match(app, /href="https:\/\/www\.instagram\.com\/skku_m\.y\.rock\/"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(app, /href="https:\/\/www\.youtube\.com\/@SKKUMYRock"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(app, /<small>@skku_m\.y\.rock<\/small>/);
  assert.match(app, /<small>@SKKUMYRock<\/small>/);
});
