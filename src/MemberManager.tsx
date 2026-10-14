import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ArrowRight, Check, Download, FileSpreadsheet, Plus, RefreshCw, Search, ShieldCheck, Upload, Users } from 'lucide-react';
import type { MemberRole, Session } from './firebase';
import {
  callError, downloadCredentials, downloadExampleCsv, loadMembers,
  parseMembersCsv, registerMembers, saveMemberPermissions,
} from './memberAdmin';
import type { ImportResult, MemberRecord, NewMember } from './memberAdmin';

const sessionList: Session[] = ['보컬', '기타', '베이스', '드럼', '키보드'];
const roleNames: Record<MemberRole, string> = {
  member: '일반부원', part_leader: '파트장', staff: '실무단', president: '회장단',
};
const blankMember: NewMember = { studentId: '', name: '', generation: '', sessions: ['보컬'], positions: [] };
type Tab = 'list' | 'add' | 'roles';

export default function MemberManager({ currentUid }: { currentUid: string }) {
  const [tab, setTab] = useState<Tab>('list');
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<NewMember[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [individual, setIndividual] = useState<NewMember>(blankMember);
  const [selectedUid, setSelectedUid] = useState('');
  const [editing, setEditing] = useState<MemberRecord | null>(null);
  const [positionText, setPositionText] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const page = await loadMembers();
      setMembers(page.members);
      setCursor(page.nextCursor);
    } catch (err) { setError(callError(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function more() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const page = await loadMembers(cursor);
      setMembers(previous => [...previous, ...page.members]);
      setCursor(page.nextCursor);
    } catch (err) { setError(callError(err)); }
    finally { setLoading(false); }
  }

  async function selectCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setResults([]); setPreview([]); setError(''); setMessage('');
    if (!file) return;
    if (file.size > 500_000) { setError('CSV 파일은 500KB 이하여야 합니다.'); return; }
    try {
      const parsed = parseMembersCsv(await file.text());
      setFileName(file.name);
      setPreview(parsed);
      setMessage(`${parsed.length}명의 회원을 읽었습니다. 내용을 확인한 뒤 등록해 주세요.`);
    } catch (err) { setFileName(''); setError(err instanceof Error ? err.message : '파일을 읽지 못했습니다.'); }
  }

  async function submit(membersToCreate: NewMember[]) {
    if (busy) return;
    setBusy(true); setError(''); setMessage(''); setResults([]);
    try {
      const incoming = await registerMembers(membersToCreate);
      setResults(incoming);
      const created = incoming.filter(item => item.status === 'created').length;
      const skipped = incoming.filter(item => item.status === 'existing').length;
      const failed = incoming.filter(item => item.status === 'error').length;
      setMessage(`등록 결과: 신규 ${created}명, 기존 계정 ${skipped}명, 실패 ${failed}명. 신규 회원의 초기 비밀번호 파일을 반드시 저장해 주세요.`);
      await refresh();
    } catch (err) { setError(callError(err)); }
    finally { setBusy(false); }
  }

  function startEdit(member: MemberRecord) {
    setSelectedUid(member.uid);
    setEditing({ ...member });
    setPositionText(member.positions.join(' | '));
    setError(''); setMessage('');
    setTab('roles');
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const updated = {
        ...editing,
        positions: positionText.split('|').map(text => text.trim()).filter(Boolean),
      };
      await saveMemberPermissions(updated);
      setEditing(updated);
      setMessage(`${editing.name} 회원의 권한과 직책을 변경했습니다.`);
      await refresh();
    } catch (err) { setError(callError(err)); }
    finally { setBusy(false); }
  }

  const filtered = members.filter(member => [member.studentId, member.name, member.generation, ...member.sessions, ...member.positions]
    .some(value => String(value).toLowerCase().includes(query.trim().toLowerCase())));
  const locked = (member: MemberRecord) => member.uid === currentUid || member.protected;
  const hasPasswords = results.some(item => item.status === 'created');

  return <section className="container section-block">
    <div className="admin-notice"><ShieldCheck size={19}/><span>회원 등록과 권한 변경은 Firebase 서버에서 로그인 및 회장단 권한을 검증한 뒤 처리합니다. 기수로 권한이 자동 변경되지는 않습니다.</span></div>
    <div className="member-layout">
      <nav className="member-tabs" aria-label="회원 관리 기능">
        <button type="button" className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>회원 명단</button>
        <button type="button" className={tab === 'add' ? 'active' : ''} onClick={() => setTab('add')}>신입부원 등록</button>
        <button type="button" className={tab === 'roles' ? 'active' : ''} onClick={() => setTab('roles')}>권한 관리</button>
      </nav>
      <div className="member-panel">
        {error && <p className="form-error member-feedback" role="alert">{error}</p>}
        {message && <p className="member-success member-feedback" role="status">{message}</p>}

        {tab === 'list' && <>
          <div className="member-panel-top"><div><h2>회원 명단</h2><p>등록된 회원의 기본 정보와 현재 권한을 확인합니다.</p></div>
            <button type="button" className="button button-primary" onClick={() => setTab('add')}><Plus size={16}/> 회원 등록</button></div>
          <div className="member-toolbar">
            <label className="input-search member-search"><Search size={16}/><input placeholder="학번, 이름, 기수, 세션 검색" aria-label="회원 검색" value={query} onChange={event => setQuery(event.target.value)}/></label>
            <button type="button" className="outline-action" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15}/> 새로고침</button>
          </div>
          <div className="member-live-list">
            <div className="member-live-head"><span>회원</span><span>기수 · 세션</span><span>직책 · 권한</span><span>관리</span></div>
            {filtered.map(member => <div className="member-live-row" key={member.uid}>
              <div><strong>{member.name}</strong><small>{member.studentId}</small></div>
              <div><span>{member.generation}기</span><small>{member.sessions.join(', ')}</small></div>
              <div><span>{member.positions.join(', ') || '일반부원'}</span><small>{roleNames[member.role]}{member.handoverAccess ? ' · 인수인계' : ''}{member.protected ? ' · 시스템 관리자' : ''}</small></div>
              <button type="button" className="outline-action" disabled={locked(member)} onClick={() => startEdit(member)}>{locked(member) ? '보호됨' : '권한 수정'}</button>
            </div>)}
            {!loading && filtered.length === 0 && <div className="member-empty"><Users size={19}/> {members.length ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}</div>}
            {loading && <div className="member-empty">회원 정보를 불러오는 중입니다...</div>}
          </div>
          {cursor && <button type="button" className="outline-action member-loadmore" onClick={() => void more()} disabled={loading}>회원 더 보기 <ArrowRight size={15}/></button>}
          <p className="form-hint">본인과 최고관리자 계정은 안전을 위해 이 화면에서 권한을 변경할 수 없습니다.</p>
        </>}

        {tab === 'add' && <>
          <div className="member-panel-top"><div><h2>신입부원 등록</h2><p>새로 등록하는 회원은 모두 일반부원이며, 별도 권한 부여는 권한 관리 탭에서 진행합니다.</p></div></div>
          <div className="member-registration">
            <div className="member-upload">
              <div className="member-upload-title"><FileSpreadsheet size={22}/><div><strong>CSV 일괄 등록</strong><p>UTF-8 CSV · 1회 최대 60명 · 헤더: 학번, 이름, 기수, 세션, 직책(선택)</p></div></div>
              <div className="member-upload-actions">
                <label className="button button-primary member-file-picker"><Upload size={15}/> CSV 파일 선택<input type="file" accept=".csv,text/csv" onChange={event => void selectCsv(event)} /></label>
                <button type="button" className="outline-action" onClick={downloadExampleCsv}><Download size={15}/> 양식 내려받기</button>
              </div>
              {fileName && <p className="form-hint">선택한 파일: {fileName}</p>}
              {preview.length > 0 && <div className="member-preview">
                <h3>등록 전 확인 · {preview.length}명</h3>
                <div className="member-preview-scroll"><table><thead><tr><th>학번</th><th>이름</th><th>기수</th><th>세션</th><th>직책</th></tr></thead>
                  <tbody>{preview.map(member => <tr key={member.studentId}><td>{member.studentId}</td><td>{member.name}</td><td>{member.generation}</td><td>{member.sessions.join(', ')}</td><td>{member.positions.join(', ') || '—'}</td></tr>)}</tbody>
                </table></div>
                <button type="button" className="button button-primary" disabled={busy} onClick={() => void submit(preview)}>{busy ? '등록 중...' : `${preview.length}명 등록`} <ArrowRight size={15}/></button>
              </div>}
            </div>
            <div className="member-single"><h3>한 명씩 등록</h3>
              <form onSubmit={event => { event.preventDefault(); void submit([individual]); }} className="member-form">
                <div className="form-grid">
                  <label>학번<input inputMode="numeric" maxLength={10} value={individual.studentId} placeholder="학번 10자리" onChange={event => setIndividual(previous => ({...previous, studentId: event.target.value.replace(/\D/g, '')}))} required /></label>
                  <label>이름<input value={individual.name} placeholder="이름" onChange={event => setIndividual(previous => ({...previous, name: event.target.value}))} required /></label>
                  <label>기수<input value={individual.generation} placeholder="예: 29 또는 27.5" onChange={event => setIndividual(previous => ({...previous, generation: event.target.value}))} required /></label>
                  <label>직책 (선택)<input value={individual.positions.join(' | ')} placeholder="여러 직책은 |로 구분" onChange={event => setIndividual(previous => ({...previous, positions: event.target.value.split('|').map(p => p.trim()).filter(Boolean)}))}/></label>
                </div>
                <div className="member-session-editor"><strong>세션</strong><div>{sessionList.map(session => <label key={session}><input type="checkbox" checked={individual.sessions.includes(session)} onChange={() => setIndividual(previous => ({...previous, sessions: previous.sessions.includes(session) ? previous.sessions.filter(item => item !== session) : [...previous.sessions, session]}))}/>{session}</label>)}</div></div>
                <button type="submit" className="button button-primary" disabled={busy || individual.studentId.length !== 10 || individual.sessions.length === 0}>{busy ? '등록 중...' : '회원 등록'} <ArrowRight size={15}/></button>
              </form>
            </div>
          </div>
          {results.length > 0 && <div className="member-result">
            <h3>등록 결과</h3>
            <p>새로 생성된 계정의 임시 비밀번호는 이 화면을 벗어나면 다시 표시할 수 없습니다. 즉시 내려받아 각 회원에게 개별 전달해 주세요.</p>
            <div className="member-result-list">{results.map((entry, i) => <div key={i}><span>{entry.name} · {entry.studentId}</span><strong>{entry.status === 'created' ? '생성됨' : entry.status === 'existing' ? '기존 계정' : '실패'}</strong></div>)}</div>
            {hasPasswords && <button type="button" className="button button-primary" onClick={() => downloadCredentials(results)}><Download size={15}/> 임시 비밀번호 CSV 내려받기</button>}
          </div>}
        </>}

        {tab === 'roles' && <>
          <div className="member-panel-top"><div><h2>권한 관리</h2><p>기수와 상관없이 관리자가 역할·직책·인수인계 접근을 수동으로 지정합니다.</p></div></div>
          <label className="member-role-pick">수정할 회원
            <select value={selectedUid} onChange={event => {
              const member = members.find(item => item.uid === event.target.value);
              if (member) startEdit(member); else { setSelectedUid(''); setEditing(null); }
            }}>
              <option value="">회원 선택</option>
              {members.filter(member => !locked(member)).map(member => <option key={member.uid} value={member.uid}>{member.name} · {member.studentId} ({member.generation}기)</option>)}
            </select>
          </label>
          {editing ? <form onSubmit={event => void saveEdit(event)} className="member-permission-form">
            <div className="member-selected"><strong>{editing.name}</strong><span>{editing.studentId} · {editing.generation}기</span></div>
            <label>운영 권한
              <select value={editing.role} onChange={event => setEditing(previous => previous ? {...previous, role: event.target.value as MemberRole} : previous)}>
                {Object.entries(roleNames).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
              </select>
            </label>
            <label>직책 (게시글 등에 표시)
              <input value={positionText} onChange={event => setPositionText(event.target.value)} placeholder="예: 보컬파트장 | 홍보부장"/>
            </label>
            <label className="member-handover-check"><input type="checkbox" checked={editing.handoverAccess} onChange={event => setEditing(previous => previous ? {...previous, handoverAccess: event.target.checked} : previous)}/>
              <span><strong>인수인계 접근 권한</strong><small>일반부원으로 변경한 OB 운영진에게도 별도로 부여할 수 있습니다.</small></span>
            </label>
            <p className="form-hint">최고관리자 권한 부여 기능은 제공하지 않습니다. 본인 및 기존 최고관리자의 권한 변경도 차단됩니다.</p>
            <button type="submit" className="button button-primary" disabled={busy}>{busy ? '저장 중...' : '권한 및 직책 저장'} <Check size={16}/></button>
          </form> : <div className="member-empty"><ShieldCheck size={20}/> 위에서 수정할 회원을 선택하거나 회원 명단의 권한 수정 버튼을 눌러 주세요.</div>}
          {cursor && <p className="form-hint">회원이 목록에 없다면 회원 명단에서 '회원 더 보기'를 눌러 불러온 뒤 선택해 주세요.</p>}
        </>}
      </div>
    </div>
  </section>;
}
