import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import type { MemberRole, Session } from './firebase';

export type NewMember = {
  studentId: string;
  name: string;
  generation: string;
  sessions: Session[];
  positions: string[];
};
export type MemberRecord = NewMember & {
  uid: string;
  role: MemberRole;
  handoverAccess: boolean;
  protected: boolean;
};
export type ImportResult = {
  studentId: string;
  name: string;
  status: 'created' | 'existing' | 'error';
  initialPassword?: string;
  message?: string;
};
type MemberPage = { members: MemberRecord[]; nextCursor: string | null };
const fetchMembers = httpsCallable<{ cursor: string | null }, MemberPage>(functions, 'listMembers');
const register = httpsCallable<{ members: NewMember[] }, { results: ImportResult[] }>(functions, 'registerMembers');
const update = httpsCallable<
  { uid: string; role: MemberRole; handoverAccess: boolean; positions: string[] },
  { success: boolean }
>(functions, 'updateMemberPermissions');

export async function loadMembers(cursor: string | null = null) {
  return (await fetchMembers({ cursor })).data;
}
export async function registerMembers(members: NewMember[]) {
  return (await register({ members })).data.results;
}
export async function saveMemberPermissions(member: MemberRecord) {
  await update({
    uid: member.uid,
    role: member.role,
    handoverAccess: member.handoverAccess,
    positions: member.positions,
  });
}

const allowedSessions: Session[] = ['보컬', '기타', '베이스', '드럼', '키보드'];
const aliases: Record<string, string[]> = {
  studentId: ['studentId', '학번'],
  name: ['name', '이름'],
  generation: ['generation', '기수'],
  sessions: ['sessions', '세션'],
  positions: ['positions', '직책'],
};

// CSV parser supporting UTF-8 BOM, CRLF, commas/newlines inside quoted fields,
// and escaped quotes (""). Do not evaluate spreadsheet cells.
function readCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;
  const input = text.replace(/^\uFEFF/, '');
  function cell() { row.push(field); field = ''; closedQuote = false; }
  function line() { cell(); if (row.some(value => value.trim())) rows.push(row); row = []; }
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closedQuote = true; }
      } else field += c;
    } else if (c === '"' && field === '' && !closedQuote) {
      quoted = true;
    } else if (c === ',' || c === '\n' || c === '\r') {
      if (c === ',') cell();
      else { if (c === '\r' && input[i + 1] === '\n') i++; line(); }
    } else if (closedQuote && (c === ' ' || c === '\t')) {
      // Ignore padding after a closing quote.
    } else if (c === '"' || closedQuote) {
      throw new Error(`CSV 인용부호 형식을 확인해 주세요. (${rows.length + 1}행)`);
    } else field += c;
  }
  if (quoted) throw new Error('CSV의 큰따옴표가 닫히지 않았습니다.');
  if (field || row.length || closedQuote) line();
  return rows;
}

function multi(value: string): string[] {
  return value.split(/[|;,]/).map(item => item.trim()).filter(Boolean);
}
export function parseMembersCsv(text: string): NewMember[] {
  const rows = readCsv(text);
  if (rows.length < 2) throw new Error('헤더와 회원 데이터가 있는 CSV 파일을 선택해 주세요.');
  const headers = rows.shift()!.map(value => value.trim().toLowerCase());
  const indices = Object.fromEntries(Object.entries(aliases).map(([name, names]) => [
    name, headers.findIndex(header => names.some(item => item.toLowerCase() === header)),
  ])) as Record<keyof NewMember, number>;
  if (['studentId', 'name', 'generation', 'sessions'].some(key => indices[key as keyof NewMember] < 0)) {
    throw new Error('CSV에 학번, 이름, 기수, 세션 열이 필요합니다. (영문 헤더도 지원)');
  }
  if (rows.length > 60) throw new Error('한 번에 최대 60명까지 등록할 수 있습니다.');
  const used = new Set<string>();
  return rows.map((row, index) => {
    const value = (field: keyof NewMember) => indices[field] < 0 ? '' : (row[indices[field]] ?? '').trim();
    const studentId = value('studentId');
    const name = value('name');
    const generation = value('generation');
    const selected = multi(value('sessions'));
    const positions = multi(value('positions'));
    const location = index + 2;
    if (!/^\d{10}$/.test(studentId)) throw new Error(`${location}행: 학번은 10자리 숫자여야 합니다.`);
    if (used.has(studentId)) throw new Error(`${location}행: 파일 안에 학번이 중복되었습니다.`);
    used.add(studentId);
    if (!name || name.length > 60 || !generation || generation.length > 20) throw new Error(`${location}행: 이름 또는 기수를 확인해 주세요.`);
    if (!selected.length || selected.some(s => !allowedSessions.includes(s as Session)) || new Set(selected).size !== selected.length) {
      throw new Error(`${location}행: 세션을 확인해 주세요. 여러 세션은 | 문자로 구분합니다.`);
    }
    if (positions.length > 8 || positions.some(p => p.length > 40)) throw new Error(`${location}행: 직책은 8개, 각 40자 이하여야 합니다.`);
    return { studentId, name, generation, sessions: selected as Session[], positions };
  });
}

function quoted(value: unknown) {
  const raw = String(value ?? '');
  // Prevent CSV formula execution in spreadsheet viewers.
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
function downloadCsv(filename: string, rows: unknown[][]) {
  const contents = '\uFEFF' + rows.map(row => row.map(quoted).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8' }));
  const element = document.createElement('a');
  element.href = url;
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  element.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export function downloadExampleCsv() {
  downloadCsv('myrock-members-template.csv', [
    ['학번', '이름', '기수', '세션', '직책'],
    ['2026300001', '예시회원', '29', '기타|베이스', ''],
  ]);
}
export function downloadCredentials(results: ImportResult[]) {
  downloadCsv('myrock-initial-credentials.csv', [
    ['학번', '이름', '상태', '초기비밀번호', '비고'],
    ...results.map(result => [
      result.studentId, result.name,
      result.status === 'created' ? '생성' : result.status === 'existing' ? '기존 계정' : '오류',
      result.initialPassword ?? '', result.message ?? '',
    ]),
  ]);
}

export function callError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  if (code === 'functions/unauthenticated') return '로그인이 필요합니다. 다시 로그인해 주세요.';
  if (code === 'functions/permission-denied') return '회원 관리 권한이 없습니다.';
  if (code === 'functions/unavailable' || code === 'functions/not-found') return '서버 기능이 배포되지 않았거나 연결할 수 없습니다. Firebase Functions 배포를 확인해 주세요.';
  const detail = (error as { message?: string })?.message;
  return detail && detail.length < 220 ? detail : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
