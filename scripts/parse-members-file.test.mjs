import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMembersCsv, validateMembers } from './parse-members-file.mjs';

test('Korean CSV headers, BOM, CRLF and multiple sessions', () => {
  const csv = '\uFEFF학번,이름,기수,세션,직책\r\n2026300001,테스트회원,27.5,보컬|기타,보컬파트장|공연부장\r\n';
  const rows = validateMembers(parseMembersCsv(csv));
  assert.deepEqual(rows, [{
    studentId: '2026300001',
    name: '테스트회원',
    generation: '27.5',
    sessions: ['보컬', '기타'],
    positions: ['보컬파트장', '공연부장'],
  }]);
});
test('English headers, quoted comma and escaped double quotes', () => {
  const csv = 'studentId,name,generation,sessions,positions\n2026300002,"테스트,""두번째""",29,"드럼,키보드","총무,홍보부장"\n';
  const rows = validateMembers(parseMembersCsv(csv));
  assert.equal(rows[0].name, '테스트,"두번째"');
  assert.deepEqual(rows[0].sessions, ['드럼', '키보드']);
  assert.deepEqual(rows[0].positions, ['총무', '홍보부장']);
});
test('duplicate student IDs are rejected before a registration request', () => {
  const csv = '학번,이름,기수,세션\n2026300001,예시1,29,기타\n2026300001,예시2,29,베이스\n';
  assert.throws(() => validateMembers(parseMembersCsv(csv)), /학번 중복/);
});
test('invalid sessions are rejected', () => {
  assert.throws(() => validateMembers(parseMembersCsv('학번,이름,기수,세션\n2026300001,예시,29,색소폰')), /세션/);
});
test('malformed quotes and mismatched column counts are rejected', () => {
  assert.throws(() => parseMembersCsv('학번,이름,기수,세션\n2026300001,"예시,29,드럼'), /큰따옴표/);
  assert.throws(() => parseMembersCsv('학번,이름,기수,세션\n2026300001,예시,29,드럼,추가'), /열 개수/);
});
test('maximum batch size is 60', () => {
  const ids = Array.from({ length: 61 }, (_, i) => '20263' + String(i).padStart(5, '0'));
  assert.throws(() => parseMembersCsv('학번,이름,기수,세션\n' + ids.map(id => id + ',예시,29,기타').join('\n')), /60명/);
});
