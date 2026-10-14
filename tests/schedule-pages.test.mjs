import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const schedules = await readFile(new URL('../src/SchedulePages.tsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

const ast = ts.createSourceFile('SchedulePages.tsx', schedules, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
const declarations = ast.statements
  .filter(ts.isVariableStatement)
  .flatMap(statement => Array.from(statement.declarationList.declarations));
const examplesDeclaration = declarations.find(declaration => declaration.name.getText(ast) === 'scheduleExamples');
if (!examplesDeclaration || !ts.isArrayLiteralExpression(examplesDeclaration.initializer)) {
  throw new Error('Schedule example fixture not found');
}
const examples = examplesDeclaration.initializer.elements.map(element => {
  assert.ok(ts.isObjectLiteralExpression(element));
  const value = Object.fromEntries(element.properties.map(property => {
    assert.ok(ts.isPropertyAssignment(property));
    const key = property.name.getText(ast);
    const val = property.initializer;
    assert.ok(ts.isStringLiteral(val) || ts.isNumericLiteral(val));
    return [key, ts.isNumericLiteral(val) ? Number(val.text) : val.text];
  }));
  return value;
});

test('only four clearly labeled example schedules are listed, each with its own detail id', () => {
  assert.equal(examples.length, 4);
  assert.deepEqual(examples.map(example => example.id), ['regular-a', 'regular-b', 'collab', 'free-jam']);
  assert.deepEqual(examples.map(example => example.title), [
    '정기공연 A팀 합주',
    '정기공연 B팀 합주',
    '연합공연 합주',
    '자율 합주',
  ]);
  assert.equal(new Set(examples.map(example => example.id)).size, 4);
  assert.equal(new Set(examples.map(example => example.seed)).size, 4);
  assert.ok(examples.every(example => typeof example.description === 'string' && example.description.length > 0));
  assert.match(schedules, /scheduleExamples\.map\(schedule =>/);
  assert.match(schedules, /현재는 화면 확인을 위한 예시 시간표 4개가 표시됩니다/);
  assert.match(schedules, /총 \{scheduleExamples\.length\}개/);
});

test('schedule landing shows creation placeholder and four-item list, not the calendar', () => {
  const start = schedules.indexOf('export function ScheduleLanding');
  const end = schedules.indexOf('const days =', start);
  const landing = schedules.slice(start, end);
  assert.match(landing, /시간표 만들기/);
  assert.match(landing, /내가 참여한 시간표/);
  assert.match(landing, /onClick=\{onCreate\}/);
  assert.match(landing, /기능 준비 중/);
  assert.match(landing, /onClick=\{\(\) => onOpen\(schedule\.id\)\}/);
  assert.match(landing, /시간표 열기/);
  assert.doesNotMatch(landing, /calendar-grid|calendar-cell|주간 시간 조율 현황/);
});

test('team creation only appears for an authenticated account with an existing management role', () => {
  assert.match(schedules, /\{canCreateTeam && <button/);
  assert.match(schedules, /onClick=\{onCreateTeam\}/);
  assert.match(schedules, /구성팀 시간표 만들기/);
  assert.match(app, /canCreateTeam=\{Boolean\(user && !authPending && currentLevel\)\}/);
  assert.match(app, /const currentLevel=managementLevel\(profile,hasSystemClaim\)/);
  assert.match(app, /profile\.role === 'part_leader' \|\| profile\.role === 'staff' \|\| profile\.role === 'president'/);
  assert.match(app, /onCreate=\{\(\) => notify\('시간표 만들기 기능은 추후 연결할 예정입니다\.'\)\}/);
  assert.match(app, /onCreateTeam=\{\(\) => notify\('구성팀 시간표 만들기 기능은 추후 연결할 예정입니다\.'\)\}/);
});

test('schedule detail opens the selected fixture in a read-only weekly calendar', () => {
  const detail = schedules.slice(schedules.indexOf('export function ScheduleDetail'));
  assert.match(detail, /title=\{schedule\.title\}/);
  assert.match(detail, /시간표 목록으로/);
  assert.match(detail, /onClick=\{onBack\}/);
  assert.match(detail, /if \(!schedule\)/);
  assert.match(detail, /주간 시간 조율 현황/);
  assert.match(detail, /schedule\.seed/);
  assert.match(detail, /days\.map/);
  assert.match(detail, /hours\.map/);
  assert.match(detail, /calendar-grid/);
  assert.match(detail, /level-\$\{level\}/);
  assert.match(detail, /role="img" aria-label=/);
  assert.match(detail, /예시 시간표만 보여줍니다/);
  assert.doesNotMatch(schedules, /firebase|firestore|fetch\(|setDoc\(|addDoc\(/i);
});

test('schedule deep links, back navigation, refresh and browser history are wired', () => {
  assert.match(app, /page === 'schedule-detail' \? '\/schedule'/);
  assert.match(app, /const scheduleIdFromPath =/);
  assert.match(app, /match\(\/\^\\\/schedule\\\/\(\[a-z0-9-\]\+\)\\\/\?\$\/\)/);
  assert.match(app, /if \(scheduleIdFromPath\(\)\) return 'schedule-detail';/);
  assert.match(app, /setActiveScheduleId\(scheduleIdFromPath\(\)\)/);
  assert.match(app, /window\.history\.pushState\(null, '', path\)/);
  assert.match(app, /window\.addEventListener\('popstate',onPop\)/);
  assert.match(app, /page==='schedule'&&<ScheduleLanding/);
  assert.match(app, /page==='schedule-detail'&&<ScheduleDetail schedule=\{findSchedule\(activeScheduleId \?\? ''\)\} onBack=\{\(\) => navigate\('schedule'\)\}/);
});

test('responsive list remains separate from horizontally scrollable timetable detail', () => {
  assert.match(styles, /\.schedule-action-grid\s*\{/);
  assert.match(styles, /\.schedule-list-item\s*\{/);
  assert.match(styles, /\.schedule-calendar \.calendar-grid\s*\{/);
  assert.match(styles, /@media \(max-width:\s*520px\)\s*\{[\s\S]*?\.schedule-list-item\s*\{\s*display:\s*grid;/);
  assert.match(styles, /\.calendar-scroll\{overflow-x:auto\}/);
});
