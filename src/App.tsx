import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown,
  CircleHelp, ClipboardList, ExternalLink, FileText, Instagram,
  LockKeyhole, Mail, Menu, Plus, Search, ShieldCheck, Users, X,
} from 'lucide-react';
import logo from './logo-transparent.png';

type Page = 'home' | 'about' | 'news' | 'schedule' | 'gallery' | 'equipment' | 'finance' | 'handover' | 'members';
type Navigate = (page: Page) => void;
type Notify = (message?: string) => void;
type NavItem = { id: Page; label: string };

const primaryNav: NavItem[] = [
  { id: 'about', label: '동아리 소개' },
  { id: 'news', label: '공지사항' },
  { id: 'schedule', label: '합주 시간 조율' },
  { id: 'gallery', label: '포토존' },
  { id: 'equipment', label: '장비 대여' },
];
const secondaryNav: NavItem[] = [
  { id: 'finance', label: '후원 · 회계' },
  { id: 'handover', label: '인수인계' },
  { id: 'members', label: '회원 관리' },
];
const allNav = [...primaryNav, ...secondaryNav];
const pathFor = (page: Page) => page === 'home' ? '/' : `/${page}`;
const pathToPage = (): Page => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
  return allNav.some(item => item.id === path) ? path as Page : 'home';
};

const posts = [
  { id: 1, category: '공지', title: '동아리 공지사항이 이곳에 표시됩니다', description: '운영진이 등록한 안내가 표시될 예정입니다.', date: '—' },
  { id: 2, category: '공연', title: '공연 일정 및 참가 안내', description: '공연 일정과 관련 자료를 확인할 수 있습니다.', date: '—' },
  { id: 3, category: '행사', title: 'MT 및 동아리 행사 안내', description: '일정과 준비물 안내가 표시될 예정입니다.', date: '—' },
];
const sessions = ['보컬', '기타', '베이스', '드럼', '키보드'];

function Placeholder({ label, className = '' }: { label: string; className?: string }) {
  return <div role="img" aria-label={`${label} 자리표시자`} className={`placeholder ${className}`}>
    <span className="placeholder-symbol" aria-hidden="true">☒</span>
    <span className="placeholder-text">{label}</span>
  </div>;
}
function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" className="text-link" onClick={onClick}>{children}<ArrowUpRight size={15} aria-hidden="true" /></button>;
}
function PageHeading({ tag, title, description }: { tag: string; title: string; description: string }) {
  return <div className="page-heading container"><span className="eyebrow">{tag}</span><h1>{title}</h1><p>{description}</p></div>;
}
function SectionHeading({ title, aside, action, onAction }: { title: string; aside?: string; action?: string; onAction?: () => void }) {
  return <div className="section-heading"><div><h2>{title}</h2>{aside && <p>{aside}</p>}</div>{action && onAction && <TextLink onClick={onAction}>{action}</TextLink>}</div>;
}
function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description: string }) {
  return <div className="empty-state">{icon && <span className="empty-icon">{icon}</span>}<strong>{title}</strong><p>{description}</p></div>;
}

function Home({ navigate, notify }: { navigate: Navigate; notify: Notify }) {
  return <>
    <section className="hero container">
      <div className="hero-copy">
        <span className="eyebrow">SUNGKYUNKWAN UNIVERSITY BAND CLUB</span>
        <h1>여기로,<br /><span>모여락!</span></h1>
        <p>성균관대학교 밴드 동아리 모여락입니다.<br />우리의 음악과 이야기를 이곳에 담습니다.</p>
        <TextLink onClick={() => navigate('about')}>동아리 소개</TextLink>
      </div>
      <div className="hero-media"><Placeholder label="대표 공연 사진" /></div>
    </section>
    <section className="container home-updates">
      <SectionHeading title="공지사항" aside="모여락의 새로운 소식" action="전체 보기" onAction={() => navigate('news')} />
      <div className="simple-notice-list">
        {posts.slice(0, 3).map(post => <button type="button" className="simple-notice" key={post.id} onClick={() => notify()}>
          <span className="notice-category">{post.category}</span><span className="notice-title">{post.title}</span><span className="notice-date">{post.date}</span><ArrowUpRight size={16} aria-hidden="true" />
        </button>)}
      </div>
    </section>
    <section className="container home-bottom-links" aria-label="주요 서비스 바로가기">
      <button type="button" onClick={() => navigate('schedule')}><CalendarDays size={18} /><span><strong>합주 시간 조율</strong><small>함께할 시간을 찾아보세요</small></span><ArrowUpRight size={16} /></button>
      <button type="button" onClick={() => navigate('equipment')}><ClipboardList size={18} /><span><strong>장비 대여</strong><small>동아리 장비를 확인하세요</small></span><ArrowUpRight size={16} /></button>
    </section>
  </>;
}

function About({ navigate, notify }: { navigate: Navigate; notify: Notify }) {
  return <><PageHeading tag="ABOUT MYROCK" title="모여락 소개" description="함께 음악을 만들고 무대에 서는 사람들, 모여락을 소개합니다." />
    <section className="container about-intro section-block"><div className="about-description"><h2>음악을 좋아하는 사람들이<br />함께하는 공간</h2><p>보컬, 기타, 베이스, 드럼, 키보드. 서로 다른 소리로 모여 한 곡을 완성합니다. 이곳에는 동아리 소개와 활동 이야기가 정리될 예정입니다.</p><TextLink onClick={() => navigate('gallery')}>활동 사진 보러 가기</TextLink></div><Placeholder label="동아리 대표 사진" /></section>
    <section className="container section-block"><SectionHeading title="운영진" aside="현재 운영진 소개" /><div className="leadership-grid">{['회장단', '실무단', '파트장'].map((role, i) => <div className="leader-item" key={role}><Placeholder label="운영진 사진" /><div><span className="muted-number">0{i + 1}</span><strong>{role}</strong><p>운영진 정보가 등록될 자리입니다.</p></div></div>)}</div></section>
    <section className="container section-block"><SectionHeading title="연혁" aside="모여락의 활동 기록" /><div className="archive-timeline"><div><span>연혁</span><p>동아리의 주요 역사를 연도별로 정리합니다.</p></div><div><span>공연 기록</span><p>기억에 남는 무대와 행사를 기록합니다.</p></div></div></section>
    <section className="container section-block about-social"><SectionHeading title="모여락 채널" /><div className="plain-links"><button type="button" onClick={() => notify()}><Instagram size={19}/> 인스타그램 <ArrowUpRight size={16} /></button><button type="button" onClick={() => notify()}><ExternalLink size={19}/> 유튜브 <ArrowUpRight size={16} /></button></div></section>
  </>;
}

function News({ notify }: { notify: Notify }) {
  const [category, setCategory] = useState('전체');
  const [query, setQuery] = useState('');
  const filtered = posts.filter(post => (category === '전체' || post.category === category) && (post.title + post.description).includes(query));
  return <><PageHeading tag="NOTICE" title="공지사항" description="공연, 행사, 동아리 운영에 관한 소식을 확인하세요." />
    <section className="container section-block news-page"><div className="toolbar"><div className="tabs" aria-label="공지 분류">{['전체', '공지', '공연', '행사'].map(c => <button type="button" key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="toolbar-actions"><label className="input-search"><Search size={16}/><input aria-label="공지사항 검색" placeholder="제목 검색" value={query} onChange={e => setQuery(e.target.value)}/></label><button type="button" className="button button-primary" onClick={() => notify()}><Plus size={15}/> 글쓰기</button></div></div>
    <div className="table-shell"><div className="notice-table-head"><span>분류</span><span>제목</span><span>등록일</span></div>{filtered.map(post => <button type="button" key={post.id} className="notice-table-row" onClick={() => notify()}><span className="notice-category">{post.category}</span><span><strong>{post.title}</strong><small>{post.description}</small></span><span>{post.date}</span></button>)}{filtered.length === 0 && <EmptyState title="검색 결과가 없습니다" description="검색어 또는 분류를 변경해 보세요." />}</div>
    <div className="list-bottom"><span>미리보기용 예시 공지입니다</span><span className="page-count">01 <span>/</span> 01</span></div></section>
  </>;
}

function Schedule({ notify }: { notify: Notify }) {
  const [view, setView] = useState<'mine' | 'team'>('mine');
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const hours = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  return <><PageHeading tag="WHEN2MEET" title="합주 시간 조율" description="함께 가능한 시간을 찾고, 확정된 합주 일정을 관리할 수 있습니다." />
    <section className="container section-block"><div className="toolbar toolbar-bottom"><div className="tabs"><button type="button" className={view === 'mine' ? 'active' : ''} onClick={() => setView('mine')}>내 시간표</button><button type="button" className={view === 'team' ? 'active' : ''} onClick={() => setView('team')}>구성팀 시간표</button></div><button type="button" className="button button-primary" onClick={() => notify()}><Plus size={16}/> 시간표 만들기</button></div>
      <div className="schedule-overview"><div><span className="small-label">미리보기</span><h2>{view === 'mine' ? '내가 참여한 시간표' : '구성팀 시간표'}</h2><p>{view === 'mine' ? '초대받은 합주 시간표가 여기에 표시됩니다.' : '운영진이 구성팀을 위해 만든 시간표가 표시됩니다.'}</p></div><button type="button" className="outline-action" onClick={() => notify()}>시간표 열기 <ArrowUpRight size={16}/></button></div>
      <div className="section-heading schedule-heading"><div><h2>시간 조율 화면</h2><p>주간 시간표 배치 예시 · 실제 응답 데이터는 아직 없습니다</p></div><span className="preview-tag">PREVIEW</span></div>
      <div className="availability-layout"><div className="calendar-wrapper"><div className="availability-head"><span>17:00 — 23:00</span><span>월요일부터 일요일까지</span></div><div className="calendar-scroll"><div className="calendar-grid"><div className="calendar-corner">TIME</div>{days.map(d => <div key={d} className="calendar-day">{d}</div>)}{hours.map((hour, row) => <div className="calendar-row" key={hour}><div className="calendar-hour">{hour}</div>{days.map((day, col) => <div key={day} className={`calendar-cell level-${(row + col * 2 + (row * col) % 3) % 4}`} title="시간 선택 화면 예시" />)}</div>)}</div></div><div className="calendar-legend"><span><i className="legend-level-0"/> 가능 인원 적음</span><span><i className="legend-level-2"/> 일부 가능</span><span><i className="legend-level-3"/> 대부분 가능</span></div></div><aside className="calendar-guide"><h3>사용 방법</h3><ol><li>학번으로 참여자를 초대합니다.</li><li>각자 가능한 시간을 입력합니다.</li><li>본인이 합주 시간을 확정합니다.</li></ol><p>확정된 시간은 다른 시간표에서 자동으로 제외되도록 구현할 예정입니다.</p></aside></div>
    </section>
  </>;
}

function Gallery({ notify }: { notify: Notify }) {
  const [filter, setFilter] = useState('전체');
  const items = [
    { label:'공연 사진', category:'공연' }, { label:'무대 기록',category:'공연' },
    { label:'MT 사진',category:'행사' }, { label:'동아리 활동 사진',category:'일상' },
    { label:'합주 사진',category:'일상' }, { label:'행사 사진',category:'행사' },
  ];
  return <><PageHeading tag="PHOTO ARCHIVE" title="포토존" description="공연부터 일상까지, 모여락의 순간들을 모아두는 공간입니다." />
    <section className="container section-block"><div className="toolbar toolbar-bottom"><div className="tabs">{['전체','공연','행사','일상'].map(c => <button type="button" key={c} className={filter === c ? 'active' : ''} onClick={() => setFilter(c)}>{c}</button>)}</div><button type="button" className="button button-primary" onClick={() => notify()}><Plus size={16}/> 사진 등록</button></div><div className="photo-grid">{items.filter(item => filter === '전체' || item.category === filter).map((item,i) => <button type="button" className="photo-item" key={item.label} onClick={() => notify()}><Placeholder label={item.label} /><div><strong>{item.label}</strong><span>{item.category} · 미리보기</span><ArrowUpRight size={15} /></div></button>)}</div></section>
  </>;
}

function Equipment({ notify }: { notify: Notify }) {
  const gears = [{name:'기타 앰프', detail:'기타 연주 장비'},{name:'마이크',detail:'보컬 및 녹음용 장비'},{name:'DI 박스',detail:'악기 연결용 장비'},{name:'마이크 스탠드',detail:'공연 및 연습용 장비'}];
  return <><PageHeading tag="EQUIPMENT" title="장비 대여" description="동아리 장비 목록을 보고 대여를 신청하는 공간입니다." />
    <section className="container section-block"><div className="toolbar toolbar-bottom"><div><h2 className="plain-h2">장비 목록</h2><p className="toolbar-description">장비 정보 및 대여 상태 표시 예시</p></div><button type="button" className="button button-secondary" onClick={() => notify()}><ClipboardList size={16}/> 내 대여 내역</button></div><div className="equipment-list">{gears.map(g => <div className="equipment-row" key={g.name}><Placeholder label="장비 사진" /><div className="equipment-info"><h3>{g.name}</h3><p>{g.detail}</p><span>등록 정보 예시</span></div><button type="button" className="outline-action" onClick={() => notify()}>대여 신청 <ArrowRight size={15} /></button></div>)}</div><div className="process-note"><strong>대여 절차</strong><div>{['대여 신청','운영진 승인','장비 반납','반납 확인'].map((s,i) => <span key={s}>{i+1}. {s}</span>)}</div></div></section>
  </>;
}

function Finance({ notify }: { notify: Notify }) {
  return <><PageHeading tag="FINANCE & SUPPORT" title="후원 · 회계" description="후원 내역과 회비 집행 내역을 기록하고 확인하는 공간입니다." />
    <section className="container section-block"><SectionHeading title="회비 집행 내역" aside="운영진이 등록한 내역이 표시됩니다" /><div className="finance-table"><div className="finance-table-head"><span>항목</span><span>구분</span><span>날짜</span><span>금액</span></div><EmptyState title="등록된 내역이 없습니다" description="실제 데이터 연결 후 내역을 확인할 수 있습니다." /></div></section>
    <section className="container section-block"><SectionHeading title="후원 안내" /><div className="support-panel"><div><h3>모여락을 응원해 주세요.</h3><p>후원 계좌와 후원 관련 안내가 등록될 자리입니다.</p></div><button type="button" className="outline-action" onClick={() => notify()}>후원 안내 확인 <ArrowUpRight size={16}/></button></div></section>
  </>;
}

function Handover({ openLogin, notify }: { openLogin: () => void; notify: Notify }) {
  return <><PageHeading tag="HANDOVER" title="인수인계" description="운영진이 해마다 업무와 기록을 이어갈 수 있도록 마련한 공간입니다." />
    <section className="container section-block"><div className="handover-gate"><LockKeyhole size={23}/><div><h2>운영진 전용 공간</h2><p>직책별 인수인계 기록과 자료는 권한이 있는 운영진에게만 공개됩니다. 현재는 레이아웃 미리보기입니다.</p></div><button type="button" className="button button-primary" onClick={openLogin}>운영진 로그인 <ArrowRight size={16}/></button></div><div className="section-heading handover-heading"><div><h2>인수인계 자료</h2><p>자료 목록 구성 예시</p></div></div><div className="handover-items"><button type="button" onClick={() => notify()}><FileText size={21}/><span><strong>직책별 인수인계 노트</strong><small>회장단 · 실무단 · 파트장</small></span><ArrowUpRight size={17}/></button><button type="button" onClick={() => notify()}><ExternalLink size={21}/><span><strong>인수인계 드라이브</strong><small>문서 및 업무 파일 링크</small></span><ArrowUpRight size={17}/></button></div></section>
  </>;
}

function Members({ openLogin, notify }: { openLogin: () => void; notify: Notify }) {
  const [tab,setTab] = useState<'list'|'add'|'roles'>('list');
  const [search,setSearch] = useState('');
  return <><PageHeading tag="MEMBER MANAGEMENT" title="회원 관리" description="회원 명단, 세션, 기수와 운영진 권한을 관리합니다." />
    <section className="container section-block"><div className="admin-notice"><ShieldCheck size={19}/><span>현재는 관리자 화면의 미리보기입니다. 실제 데이터와 권한 기능은 아직 연결되지 않았습니다.</span><button type="button" onClick={openLogin}>로그인 <ArrowUpRight size={15}/></button></div><div className="member-layout"><nav className="member-tabs" aria-label="회원 관리 기능"><button type="button" className={tab==='list'?'active':''} onClick={()=>setTab('list')}>회원 명단</button><button type="button" className={tab==='add'?'active':''} onClick={()=>setTab('add')}>신입부원 등록</button><button type="button" className={tab==='roles'?'active':''} onClick={()=>setTab('roles')}>권한 관리</button></nav><div className="member-panel">
      {tab==='list' && <><div className="member-panel-top"><div><h2>회원 명단</h2><p>학번, 이름, 세션 등으로 회원을 검색합니다.</p></div><button type="button" className="button button-primary" onClick={()=>setTab('add')}><Plus size={16}/> 회원 등록</button></div><label className="input-search member-search"><Search size={16}/><input placeholder="학번 또는 이름 검색" aria-label="회원 검색" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="members-table-head"><span>학번</span><span>이름</span><span>기수</span><span>세션</span><span>직책</span></div><EmptyState icon={<Users size={23}/>} title="등록된 회원 정보가 표시됩니다" description="회원 데이터베이스 연결 후 실제 명단을 불러옵니다." /></>}
      {tab==='add' && <><div className="member-panel-top"><div><h2>신입부원 등록</h2><p>회장단이 신입부원 정보를 등록할 화면입니다.</p></div><span className="preview-tag">PREVIEW</span></div><form className="member-form" onSubmit={(e: FormEvent) => { e.preventDefault(); notify(); }}><div className="form-grid"><label>학번<input placeholder="학번 입력" inputMode="numeric" required /></label><label>이름<input placeholder="이름 입력" required /></label><label>기수<input placeholder="예: 30" required /></label><label>세션<select defaultValue=""><option value="" disabled>세션 선택</option>{sessions.map(s=><option key={s}>{s}</option>)}</select></label></div><button type="submit" className="button button-primary">회원 등록 <ArrowRight size={15}/></button><p className="form-hint">회원 일괄 등록(CSV)은 추후 연결 예정입니다.</p></form></>}
      {tab==='roles' && <><div className="member-panel-top"><div><h2>권한 관리</h2><p>운영진 교체 시 직책과 권한을 인계하는 화면입니다.</p></div><span className="preview-tag">PREVIEW</span></div><div className="roles-list">{[['일반부원','일반 회원 기능'],['파트장','게시글 작성 · 장비 대여 승인'],['실무단','동아리 소개 · 후원 및 회계 관리'],['회장단','회원 등록 · 권한 및 직책 변경']].map(([role, desc])=><div key={role}><strong>{role}</strong><span>{desc}</span><Check size={17}/></div>)}</div></>}
    </div></div></section>
  </>;
}

function LoginDialog({ close, notify }: { close: () => void; notify: Notify }) {
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if(e.key === 'Escape') close(); }; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[close]);
  return <div className="modal-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)close();}}><div className="login-dialog" role="dialog" aria-modal="true" aria-labelledby="login-heading"><button type="button" className="dialog-close" onClick={close} aria-label="닫기"><X size={20}/></button><div className="dialog-brand"><img src={logo} alt="" /> <span>모여락</span></div><h2 id="login-heading">회원 로그인</h2><p>학번과 비밀번호로 로그인하는 화면입니다.<br/>로그인 기능은 추후 연결할 예정입니다.</p><form onSubmit={e=>{e.preventDefault();notify('아직 로그인 기능이 연결되지 않았습니다.');close();}}><label>학번<input type="text" inputMode="numeric" autoComplete="username" placeholder="학번을 입력하세요" required /></label><label>비밀번호<input type="password" autoComplete="current-password" placeholder="비밀번호를 입력하세요" required /></label><button type="submit" className="button button-primary">로그인 <ArrowRight size={17}/></button></form><p className="login-note"><CircleHelp size={15}/> 비밀번호 문의는 운영진에게 연락해 주세요.</p></div></div>;
}

function App() {
  const [page,setPage] = useState<Page>(pathToPage);
  const [menuOpen,setMenuOpen] = useState(false);
  const [moreOpen,setMoreOpen] = useState(false);
  const [loginOpen,setLoginOpen] = useState(false);
  const [toast,setToast] = useState('');
  useEffect(()=>{const onPop=()=>setPage(pathToPage());window.addEventListener('popstate',onPop);return()=>window.removeEventListener('popstate',onPop);},[]);
  useEffect(()=>{document.title=`${page==='home'?'모여락':allNav.find(n=>n.id===page)?.label ?? '모여락'} | MYROCK`;},[page]);
  useEffect(()=>{document.body.style.overflow=loginOpen?'hidden':'';return()=>{document.body.style.overflow='';};},[loginOpen]);
  const navigate: Navigate = next => { if(window.location.pathname!==pathFor(next))window.history.pushState(null,'',pathFor(next));setPage(next);setMoreOpen(false);setMenuOpen(false);window.scrollTo({top:0,behavior:'instant'});};
  const notify: Notify = (message='아직 연결되지 않은 기능입니다. 현재는 화면 구성 미리보기입니다.') => {setToast(message);window.setTimeout(()=>setToast(''),3500);};
  const showLogin=()=>{setLoginOpen(true);setMenuOpen(false);};
  return <div className="site-root">
    <header className="site-header"><div className="container header-inner"><button type="button" className="brand" onClick={()=>navigate('home')} aria-label="모여락 홈으로 이동"><img src={logo} alt="모여락 로고"/><span><strong>모여락</strong><small>MYROCK</small></span></button><nav className="desktop-nav" aria-label="주 메뉴">{primaryNav.map(item=><button type="button" key={item.id} className={page===item.id?'active':''} onClick={()=>navigate(item.id)}>{item.label}</button>)}<div className="more-wrapper"><button type="button" className={secondaryNav.some(n=>n.id===page)?'active':''} aria-expanded={moreOpen} onClick={()=>setMoreOpen(!moreOpen)}>더보기 <ChevronDown size={14}/></button>{moreOpen&&<div className="more-menu">{secondaryNav.map(item=><button type="button" key={item.id} onClick={()=>navigate(item.id)}>{item.label}</button>)}</div>}</div></nav><div className="header-actions"><button type="button" className="login-button" onClick={showLogin}>로그인</button><button type="button" className="mobile-menu-button" onClick={()=>setMenuOpen(!menuOpen)} aria-label={menuOpen?'메뉴 닫기':'메뉴 열기'} aria-expanded={menuOpen}>{menuOpen?<X size={22}/>:<Menu size={22}/>}</button></div></div>{menuOpen&&<nav className="mobile-nav" aria-label="모바일 메뉴"><div className="container">{allNav.map(item=><button type="button" key={item.id} onClick={()=>navigate(item.id)}>{item.label}<ArrowRight size={16}/></button>)}<button type="button" onClick={showLogin}>로그인<ArrowRight size={16}/></button></div></nav>}</header>
    <main key={page}>
      {page==='home'&&<Home navigate={navigate} notify={notify}/>}
      {page==='about'&&<About navigate={navigate} notify={notify}/>}
      {page==='news'&&<News notify={notify}/>}
      {page==='schedule'&&<Schedule notify={notify}/>}
      {page==='gallery'&&<Gallery notify={notify}/>}
      {page==='equipment'&&<Equipment notify={notify}/>}
      {page==='finance'&&<Finance notify={notify}/>}
      {page==='handover'&&<Handover openLogin={showLogin} notify={notify}/>}
      {page==='members'&&<Members openLogin={showLogin} notify={notify}/>}
    </main>
    <footer className="site-footer"><div className="container footer-main"><div className="footer-brand"><span>모여락 <small>MYROCK</small></span><p>여기로, 모여락!</p></div><div className="footer-nav"><div><strong>동아리</strong>{primaryNav.slice(0,4).map(item=><button type="button" key={item.id} onClick={()=>navigate(item.id)}>{item.label}</button>)}</div><div><strong>회원 서비스</strong>{[primaryNav[4],...secondaryNav].map(item=><button type="button" key={item.id} onClick={()=>navigate(item.id)}>{item.label}</button>)}</div><div><strong>연락</strong><span><Mail size={14}/> 운영진 연락처 등록 예정</span><span>사이트 관리자 연락처 등록 예정</span></div></div></div><div className="container footer-bottom"><span>© MYROCK · 성균관대학교 밴드 동아리</span><span>UI PREVIEW — 기능 준비 중</span></div></footer>
    {loginOpen&&<LoginDialog close={()=>setLoginOpen(false)} notify={notify}/>}
    {toast&&<div className="toast" role="status"><CircleHelp size={17}/><span>{toast}</span><button type="button" aria-label="알림 닫기" onClick={()=>setToast('')}><X size={15}/></button></div>}
  </div>;
}
export default App;
