import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const headerNames = {
  studentId: ['studentId', '학번'],
  name: ['name', '이름'],
  generation: ['generation', '기수'],
  sessions: ['sessions', '세션'],
  positions: ['positions', '직책'],
};

function parseCsvRows(input) {
  const source = input.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  let closed = false;
  let rowNumber = 1;

  function addCell() { row.push(cell); cell = ''; closed = false; }
  function addRow() {
    addCell();
    if (row.some(value => value.trim() !== '')) rows.push({ row, rowNumber });
    row = [];
  }

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') { cell += '"'; i += 1; }
        else { quoted = false; closed = true; }
      } else {
        cell += char;
        if (char === '\n') rowNumber += 1;
      }
    } else if (char === '"' && cell === '' && !closed) {
      quoted = true;
    } else if (char === ',' || char === '\r' || char === '\n') {
      if (char === ',') addCell();
      else {
        addRow();
        rowNumber += 1;
        if (char === '\r' && source[i + 1] === '\n') i += 1;
      }
    } else if (closed && (char === ' ' || char === '\t')) {
      // Whitespace after a closing quoted cell is ignored.
    } else if (closed || char === '"') {
      throw new Error('CSV 인용부호 형식 오류입니다. (행 ' + rowNumber + ')');
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error('CSV 큰따옴표가 닫히지 않았습니다.');
  if (cell || row.length || closed) addRow();
  return rows;
}
function values(value) {
  return value.split(/[|;,]/).map(part => part.trim()).filter(Boolean);
}
export function parseMembersCsv(source) {
  const rows = parseCsvRows(source);
  if (rows.length < 2) throw new Error('CSV 파일에 헤더와 회원 데이터가 필요합니다.');
  const headers = rows[0].row.map(value => value.trim().toLowerCase());
  const columns = Object.fromEntries(Object.entries(headerNames).map(([name, accepted]) => [
    name, headers.findIndex(header => accepted.some(label => label.toLowerCase() === header)),
  ]));
  for (const key of ['studentId', 'name', 'generation', 'sessions']) {
    if (columns[key] < 0) throw new Error('CSV에 학번, 이름, 기수, 세션 열이 필요합니다.');
  }
  const usedIndices = Object.values(columns).filter(index => index >= 0);
  if (usedIndices.length !== new Set(usedIndices).size) {
    throw new Error('CSV 헤더가 중복되었습니다.');
  }
  if (rows.length - 1 > 60) {
    throw new Error('CSV 등록은 한 번에 최대 60명까지 지원합니다. 파일을 나눠 주세요.');
  }
  return rows.slice(1).map(({ row, rowNumber }) => {
    if (row.length !== headers.length) {
      throw new Error('CSV ' + rowNumber + '행 열 개수가 헤더와 다릅니다.');
    }
    const get = name => columns[name] < 0 ? '' : row[columns[name]].trim();
    return {
      studentId: get('studentId'),
      name: get('name'),
      generation: get('generation'),
      sessions: values(get('sessions')),
      positions: values(get('positions')),
    };
  });
}
export function parseMembersFile(filename) {
  const raw = readFileSync(filename, 'utf8');
  if (extname(filename).toLowerCase() === '.csv') return parseMembersCsv(raw);
  if (extname(filename).toLowerCase() === '.json') return JSON.parse(raw);
  throw new Error('회원 명단 파일은 .json 또는 .csv 형식이어야 합니다.');
}
export function validateMembers(members) {
  if (!Array.isArray(members) || members.length < 1) throw new Error('회원 명단이 비어 있습니다.');
  const allowed = new Set(['보컬', '기타', '베이스', '드럼', '키보드']);
  const seen = new Set();
  members.forEach((member, index) => {
    const line = index + 1;
    if (!member || typeof member !== 'object' || Array.isArray(member)) throw new Error(line + '번째 회원 형식 오류');
    if (typeof member.studentId !== 'string' || !/^\d{10}$/.test(member.studentId)) throw new Error(line + '번째 회원 학번은 숫자 10자리여야 합니다.');
    if (seen.has(member.studentId)) throw new Error('학번 중복: ' + member.studentId);
    seen.add(member.studentId);
    if (typeof member.name !== 'string' || member.name.trim().length < 1 || member.name.trim().length > 60) {
      throw new Error(member.studentId + ': 이름은 1~60자여야 합니다.');
    }
    if (typeof member.generation !== 'string' || member.generation.trim().length < 1 || member.generation.trim().length > 20) {
      throw new Error(member.studentId + ': 기수 형식 오류');
    }
    if (!Array.isArray(member.sessions) || member.sessions.length < 1 || member.sessions.length > 5 ||
        member.sessions.some(value => typeof value !== 'string' || !allowed.has(value)) ||
        new Set(member.sessions).size !== member.sessions.length) {
      throw new Error(member.studentId + ': 세션 형식 오류');
    }
    if (!Array.isArray(member.positions) || member.positions.length > 8 ||
        member.positions.some(value => typeof value !== 'string' || !value.trim() || value.trim().length > 40)) {
      throw new Error(member.studentId + ': 직책 형식 오류');
    }
  });
  return members;
}
