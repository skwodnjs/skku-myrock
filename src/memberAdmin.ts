import { auth } from './firebase';
import type { MemberRole, Session } from './firebase';
import { exampleMemberCsvRows, serializeMembersCsv } from './memberCsv';
export { parseMembersCsv, splitMemberValues, formatMemberValues } from './memberCsv';

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
  message?: string;
};
type MemberPage = { members: MemberRecord[]; nextCursor: string | null };

async function api<T>(path: string, body?: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인 상태가 아닙니다. 다시 로그인해 주세요.');
  const token = await user.getIdToken();
  const response = await fetch('/api/members/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      authorization: 'Bearer ' + token,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    credentials: 'same-origin',
  });
  let data: Record<string, unknown>;
  try { data = await response.json(); }
  catch { throw new Error('Cloudflare API에 연결할 수 없습니다. Pages Functions 배포와 비밀키 설정을 확인해 주세요.'); }
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'API 요청에 실패했습니다.');
  return data as T;
}
export async function loadMembers(cursor: string | null = null) {
  return api<MemberPage>('list' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''));
}
export type PreviewResult = { studentId: string; status: 'new' | 'existing' };
export async function previewMembers(members: NewMember[]): Promise<PreviewResult[]> {
  const found: PreviewResult[] = [];
  for (let index = 0; index < members.length; index += 5) {
    const chunk = members.slice(index, index + 5);
    const page = await api<{ results: PreviewResult[] }>('preview', { members: chunk });
    if (!Array.isArray(page.results) || page.results.length !== chunk.length) {
      throw new Error('미리보기 결과의 일부가 누락되었습니다.');
    }
    found.push(...page.results);
  }
  return found;
}
export async function registerMembers(
  members: NewMember[],
  onProgress?: (completed: number, results: ImportResult[]) => void,
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  for (let index = 0; index < members.length; index += 5) {
    const chunk = members.slice(index, index + 5);
    try {
      const page = await api<{ results: ImportResult[] }>('register', { members: chunk });
      if (!Array.isArray(page.results) || page.results.length !== chunk.length) {
        throw new Error('서버 응답에 일부 회원의 등록 결과가 누락되었습니다.');
      }
      results.push(...page.results);
    } catch (error) {
      const message = error instanceof Error ? error.message : '연결 오류';
      // A previous request may have succeeded even if the browser lost the response.
      results.push(...chunk.map(member => ({
        studentId: member.studentId,
        name: member.name,
        status: 'error' as const,
        message: '결과를 확인할 수 없습니다. 자동 재시도하지 말고 계정 존재 여부를 확인해 주세요. ' + message,
      })));
      onProgress?.(results.length, [...results]);
      // Do not silently continue after a connection error.
      return results;
    }
    onProgress?.(results.length, [...results]);
  }
  return results;
}
export async function saveMemberPermissions(member: MemberRecord) {
  await api<{ success: boolean }>('permissions', {
    uid: member.uid,
    role: member.role,
    handoverAccess: member.handoverAccess,
    positions: member.positions,
  });
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const contents = serializeMembersCsv(rows);
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
    ...exampleMemberCsvRows,
  ]);
}
export function callError(error: unknown): string {
  const message = (error as { message?: string })?.message;
  return message && message.length < 260 ? message : '요청을 처리하지 못했습니다. Cloudflare 설정과 연결을 확인해 주세요.';
}
