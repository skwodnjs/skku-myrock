import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, CalendarDays, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList,
  ExternalLink, FileText, Guitar, Handshake,
  Instagram, LockKeyhole, Mail, Menu, Music2, Plus, Search, Settings2,
  ShieldCheck, Sparkles, Users, Wallet, X,
} from 'lucide-react';

type Page = 'home' | 'about' | 'schedule' | 'news' | 'gallery' | 'equipment' | 'finance' | 'handover' | 'members';
type Navigate = (page: Page) => void;
type Notify = (message?: string) => void;

type Item = { id: Page; label: string };
const nav: Item[] = [
  { id: 'about', label: '동아리 소개' }, { id: 'schedule', label: '합주 시간 조율' },
  { id: 'news', label: '공지사항' }, { id: 'gallery', label: '포토존' },
  { id: 'equipment', label: '장비 대여' },
];
const moreNav: Item[] = [
  { id: 'finance', label: '후원 · 회계' }, { id: 'handover', label: '인수인계' },
  { id: 'members', label: '회원 관리' },
];
const pathFor = (page: Page) => page === 'home' ? '/' : '/' + page;
const pageFromPath = (): Page => {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
  return (['about', 'schedule', 'news', 'gallery', 'equipment', 'finance', 'handover', 'members'].includes(slug) ? slug : 'home') as Page;
};

function Placeholder({ label, className = '' }: { label: string; className?: string }) {
  return <div className={'placeholder ' + className} aria-label={label} role="img">
    <span className="placeholder-mark" aria-hidden="true">☒</span>
    <span className="placeholder-label">{label}</span>
  </div>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow"><span className="eyebrow-dot" />{children}</span>;
}

function PageIntro({ number, eyebrow, title, description }: { number: string; eyebrow: string; title: string; description: string }) {
  return <section className="page-intro">
    <div className="page-intro-copy">
      <div className="page-meta"><span>{number} / MYROCK</span><span>{eyebrow}</span></div>
      <h1>{title}</h1><p>{description}</p>
    </div>
    <span className="page-intro-deco" aria-hidden="true">↗</span>
  </section>;
}

function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="section-heading">
    <div><Eyebrow>{eyebrow}</Eyebrow><h2>{title}</h2></div>
    {action && <button type="button" className="text-link" onClick={onAction}>{action}<ArrowUpRight size={17} /></button>}
  </div>;
}

const demoPosts = [
  { id: '01', category: '공지', title: '동아리 공지사항이 이곳에 표시됩니다', date: '게시일 미정', description: '운영진이 등록한 공지가 자동으로 노출될 예정입니다.' },
  { id: '02', category: '공연', title: '공연 일정 및 참가 안내 예시', date: '게시일 미정', description: '공연 포스터와 상세 안내를 게시할 수 있습니다.' },
  { id: '03', category: '행사', title: 'MT 및 동아리 행사 안내 예시', date: '게시일 미정', description: '일정, 장소, 준비물 등을 정리해 게시합니다.' },
];

function Home({ navigate, notify }: { navigate: Navigate; notify: Notify }) {
  return <>
    <section className="hero container">
      <div className="hero-copy">
        <div className="hero-topline"><Eyebrow>SUNGKYUNKWAN UNIVERSITY BAND CLUB</Eyebrow><span className="hero-index">01 — 09</span></div>
        <h1>소리를 모아,<br /><em>우리를</em> 잇다<span className="accent-period">.</span></h1>
        <p className="hero-desc">함께 연주하고, 무대를 만들고, 기억을 남기는 곳.<br />성균관대학교 밴드 동아리 <strong>모여락</strong>입니다.</p>
        <div className="hero-actions">
          <button type="button" className="btn btn-dark" onClick={() => navigate('about')}>모여락 알아보기 <ArrowUpRight size={18} /></button>
          <button type="button" className="btn btn-plain" onClick={() => navigate('schedule')}>합주 시간 조율 <ArrowRight size={18} /></button>
        </div>
        <div className="hero-bottom"><span className="tiny-line" /> MUSIC SOUNDS BETTER TOGETHER</div>
      </div>
      <div className="hero-visual">
        <Placeholder className="hero-image" label="메인 공연 사진 / 이미지 영역" />
        <span className="hero-image-caption">MYROCK / ON STAGE</span>
        <span className="hero-visual-stamp" aria-hidden="true">LIVE<br />LOUD<br />LOVE<span>↗</span></span>
      </div>
    </section>

    <section className="notice-strip">
      <div className="container notice-strip-inner"><span className="notice-tag">NOTICE</span><span className="notice-text">동아리의 새로운 소식은 공지사항에서 확인하세요.</span><button type="button" onClick={() => navigate('news')}>공지사항 보기 <ArrowRight size={16} /></button></div>
    </section>

    <section className="section container quick-section">
      <SectionHeading eyebrow="QUICK ACCESS" title="모여락에서 할 수 있는 것" />
      <div className="quick-grid">
        <button type="button" className="quick-card quick-card-dark" onClick={() => navigate('schedule')}>
          <span className="quick-number">01 / SCHEDULE</span><CalendarDays size={34} strokeWidth={1.45} /><span className="quick-card-bottom"><span><strong>합주 시간 조율</strong><small>서로 가능한 시간을 찾아요</small></span><ArrowUpRight size={23} /></span>
        </button>
        <button type="button" className="quick-card quick-card-lime" onClick={() => navigate('equipment')}>
          <span className="quick-number">02 / EQUIPMENT</span><Guitar size={34} strokeWidth={1.45} /><span className="quick-card-bottom"><span><strong>장비 대여</strong><small>필요한 장비를 신청해요</small></span><ArrowUpRight size={23} /></span>
        </button>
        <button type="button" className="quick-card quick-card-light" onClick={() => navigate('members')}>
          <span className="quick-number">03 / MEMBERS</span><Users size={34} strokeWidth={1.45} /><span className="quick-card-bottom"><span><strong>회원 관리</strong><small>부원 명단과 활동 정보를 확인해요</small></span><ArrowUpRight size={23} /></span>
        </button>
      </div>
    </section>

    <section className="section section-soft"><div className="container">
      <SectionHeading eyebrow="LATEST UPDATES" title="모여락의 새로운 소식" action="전체 공지 보기" onAction={() => navigate('news')} />
      <div className="home-news-grid">
        <div className="home-news-image"><Placeholder label="공연 포스터 / 대표 사진" /><div className="image-corner-label">MYROCK ARCHIVE ↗</div></div>
        <div className="home-news-list">{demoPosts.map((post, i) => <button type="button" key={post.id} className="news-preview" onClick={() => notify()}>
          <span className="news-preview-index">0{i + 1}</span><span className="news-preview-main"><span className="news-preview-category">{post.category} <span>·</span> 미리보기</span><strong>{post.title}</strong><small>{post.date}</small></span><ArrowUpRight size={20} />
        </button>)}</div>
      </div>
    </div></section>

    <section className="section container">
      <SectionHeading eyebrow="MEMORIES" title="우리가 함께한 순간들" action="포토존 둘러보기" onAction={() => navigate('gallery')} />
      <div className="gallery-preview"><Placeholder label="공연 사진" /><Placeholder label="동아리 활동 사진" /><Placeholder label="MT · 행사 사진" /></div>
    </section>
    <section className="cta-band"><div className="container cta-inner"><div><Eyebrow>LET'S PLAY TOGETHER</Eyebrow><h2>좋은 음악은<br />함께할 때 시작되니까.</h2></div><button type="button" className="cta-circle" onClick={() => navigate('about')} aria-label="모여락 소개 보기"><ArrowUpRight size={36} /></button></div></section>
  </>;
}

function About({ navigate }: { navigate: Navigate }) {
  return <><PageIntro number="01" eyebrow="ABOUT US" title="우리를 소개합니다." description="음악으로 모이고, 연주로 가까워지는 곳. 모여락의 이야기를 만나보세요." />
    <section className="container section about-feature"><div><Eyebrow>THIS IS MYROCK</Eyebrow><h2>각자의 소리가 모여<br /><em>하나의 무대</em>가 됩니다.</h2><p>보컬, 기타, 베이스, 드럼, 키보드. 서로 다른 악기가 같은 곡을 연주하듯, 모여락은 음악을 좋아하는 사람들이 모여 함께 활동하는 동아리입니다.</p><button type="button" className="text-link" onClick={() => navigate('gallery')}>활동 사진 둘러보기 <ArrowUpRight size={18}/></button></div><Placeholder className="about-main-image" label="동아리 소개 이미지" /></section>
    <section className="section section-soft"><div className="container"><SectionHeading eyebrow="PEOPLE" title="함께 동아리를 이끄는 사람들" /><div className="people-grid">{['회장단','실무단','파트장'].map((name,i) => <div className="person-card" key={name}><Placeholder label="운영진 사진" /><span className="person-index">0{i + 1}</span><h3>{name}</h3><p>운영진 소개가 이곳에 표시됩니다.</p></div>)}</div></div></section>
    <section className="container section history-section"><SectionHeading eyebrow="OUR STORY" title="모여락의 발자취" /><div className="timeline"><div><span>HISTORY</span><strong>연혁이 등록될 자리</strong><p>동아리의 주요 활동과 역사를 연도별로 정리할 수 있습니다.</p></div><div><span>ARCHIVE</span><strong>공연과 행사 기록</strong><p>우리의 공연, 행사, 활동을 시간순으로 남깁니다.</p></div></div></section>
    <section className="container section social-section"><SectionHeading eyebrow="FOLLOW US" title="다른 곳에서도 모여락을 만나요" /><div className="social-grid"><div className="social-card"><Instagram/><strong>INSTAGRAM</strong><p>공식 SNS 계정 연결 예정</p><ExternalLink size={16}/></div><div className="social-card"><Music2/><strong>YOUTUBE</strong><p>공식 유튜브 채널 연결 예정</p><ExternalLink size={16}/></div></div></section>
  </>;
}

function Schedule({ notify }: { notify: Notify }) {
  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
  const hours = ['17:00','18:00','19:00','20:00','21:00','22:00'];
  return <><PageIntro number="02" eyebrow="WHEN2MEET" title="우리의 시간을 맞춰요." description="멤버를 초대하고 가능한 시간을 표시하면, 모두에게 맞는 합주 시간을 한눈에 찾을 수 있어요." />
    <section className="container section"><div className="schedule-toolbar"><div><Eyebrow>MY SCHEDULES</Eyebrow><h2>내 시간표</h2><p>아래 시간표와 일정은 화면 구성을 위한 예시입니다.</p></div><button type="button" className="btn btn-dark" onClick={() => notify()}><Plus size={18}/> 새 시간표 만들기</button></div>
      <div className="schedule-cards"><div className="schedule-card"><div><span className="sample-pill">SAMPLE</span><span className="soft-label">개인 시간표</span></div><h3>밴드 합주 시간 조율</h3><p>참여자들이 가능한 시간을 표시하고 있어요.</p><div className="avatars"><span>A</span><span>B</span><span>C</span><span>+2</span></div><button type="button" className="card-link" onClick={() => notify()}>시간표 보기 <ArrowUpRight size={18}/></button></div><div className="schedule-card"><div><span className="sample-pill">SAMPLE</span><span className="soft-label">구성팀 시간표</span></div><h3>공연 준비팀 일정</h3><p>운영진이 구성팀을 대신해 개설할 수 있어요.</p><div className="avatars"><span>D</span><span>E</span><span>F</span></div><button type="button" className="card-link" onClick={() => notify()}>시간표 보기 <ArrowUpRight size={18}/></button></div></div>
    </section>
    <section className="section section-soft"><div className="container"><SectionHeading eyebrow="AVAILABILITY PREVIEW" title="시간 조율 화면 미리보기" /><div className="calendar-layout"><div className="calendar-panel"><div className="calendar-top"><div><strong>합주 가능한 시간</strong><span>시간표 레이아웃 예시</span></div><span className="sample-pill">DEMO</span></div><div className="calendar-scroll"><div className="calendar-grid"><div className="calendar-label">TIME</div>{weekdays.map(day=><div className="calendar-day" key={day}>{day}</div>)}{hours.map((hour,row)=><div className="calendar-row" key={hour}><span className="calendar-time">{hour}</span>{weekdays.map((day,col)=><div key={day} className={'calendar-cell shade-' + (((row*3 + col*7 + row*col)%5))} title="예시 가능 시간" />)}</div>)}</div></div><div className="calendar-legend"><span><i className="legend-none"/> 가능 인원 적음</span><span><i className="legend-mid"/> 일부 가능</span><span><i className="legend-high"/> 대부분 가능</span></div></div><aside className="calendar-aside"><span className="aside-kicker">HOW IT WORKS</span><h3>합주 시간,<br/>더 쉽게 정해요.</h3><ol><li>학번으로 부원을 초대하고</li><li>각자 가능한 시간을 선택한 뒤</li><li>본인이 일정을 확정해요.</li></ol><div className="aside-note"><Check size={17}/><p>확정한 시간은 다른 시간표에서 자동 제외되도록 구현할 예정입니다.</p></div></aside></div></div></section>
  </>;
}

function News({ notify }: { notify: Notify }) {
  const [category,setCategory] = useState('전체');
  const [search,setSearch] = useState('');
  const filtered = demoPosts.filter(post => (category === '전체' || post.category === category) && (post.title + post.description).includes(search));
  return <><PageIntro number="03" eyebrow="NOTICE BOARD" title="모여락 소식." description="공연, 행사, 공지사항까지. 함께 알아야 할 이야기들을 한곳에 모았어요." />
    <section className="section container"><div className="board-controls"><div className="filter-tabs">{['전체','공지','공연','행사'].map(c=><button type="button" key={c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="board-actions"><label className="search-box"><Search size={17}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="제목 검색" aria-label="공지사항 제목 검색" /></label><button type="button" className="btn btn-dark btn-small" onClick={() => notify()}><Plus size={17}/> 글쓰기</button></div></div>
    <div className="board-list"><div className="board-header"><span>구분</span><span>제목</span><span>날짜</span></div>{filtered.length ? filtered.map(post=><button type="button" className="board-row" key={post.id} onClick={() => notify()}><span><i className="category-tag">{post.category}</i></span><span className="board-title"><strong>{post.title}</strong><small>{post.description}</small></span><span className="board-date">{post.date}<ArrowUpRight size={17}/></span></button>) : <div className="empty-state">검색 결과가 없습니다.</div>}</div>
    <div className="board-bottom"><span>샘플 게시글 · 실제 데이터 연결 전</span><div className="pagination"><button type="button" disabled aria-label="이전 페이지"><ChevronLeft size={18}/></button><span>1</span><button type="button" disabled aria-label="다음 페이지"><ChevronRight size={18}/></button></div></div></section>
  </>;
}

function Gallery({ notify }: { notify: Notify }) {
  const captions = ['공연 기록','함께한 무대','동아리 일상','MT와 행사','연습의 순간','우리의 추억'];
  return <><PageIntro number="04" eyebrow="PHOTO ARCHIVE" title="함께한 순간들." description="무대 위의 열기부터 일상 속 웃음까지. 우리의 이야기를 사진으로 기록합니다." />
    <section className="container section"><div className="gallery-heading"><span>PHOTO ZONE <span className="outline-pill">GALLERY PREVIEW</span></span><button type="button" className="btn btn-dark btn-small" onClick={() => notify()}><Plus size={17}/> 사진 등록</button></div><div className="gallery-grid">{captions.map((caption,i)=><button type="button" className="gallery-item" key={caption} onClick={() => notify()}><Placeholder label="사진 영역" /><div className="gallery-item-info"><span>0{i+1} / ARCHIVE</span><strong>{caption}</strong><ArrowUpRight size={18}/></div></button>)}</div></section>
  </>;
}

function Equipment({ notify }: { notify: Notify }) {
  const gear = [{ title: '기타 앰프', cat: 'AMPLIFIER' }, { title: '마이크', cat: 'MICROPHONE' }, { title: 'DI 박스', cat: 'AUDIO' }, { title: '마이크 스탠드', cat: 'ACCESSORY' }];
  return <><PageIntro number="05" eyebrow="EQUIPMENT" title="장비를 빌려요." description="동아리 장비를 조회하고 대여를 신청할 수 있는 공간입니다. 대여 및 반납은 운영진 확인을 거쳐 진행됩니다." />
    <section className="container section"><div className="equipment-bar"><div><Eyebrow>EQUIPMENT LIST</Eyebrow><h2>대여 가능 장비 <span className="small-muted">/ 구성 예시</span></h2></div><button type="button" className="btn btn-outline" onClick={() => notify()}><ClipboardList size={17}/> 내 신청 내역</button></div><div className="equipment-grid">{gear.map((item,i)=><div className="gear-card" key={item.title}><div className="gear-card-image"><Placeholder label="장비 사진"/><span className="gear-number">0{i+1}</span></div><div className="gear-card-body"><span className="item-category">{item.cat}</span><div className="gear-card-title"><h3>{item.title}</h3><span className="sample-pill">예시</span></div><p>운영진이 장비 정보를 등록하면 여기에 표시됩니다.</p><button type="button" className="card-link" onClick={() => notify()}>대여 신청 <ArrowRight size={17}/></button></div></div>)}</div><div className="process-panel"><div><Eyebrow>RENTAL PROCESS</Eyebrow><h3>대여는 이렇게 진행돼요.</h3></div><div className="process-steps">{['대여 신청','운영진 승인','장비 반납','반납 확인'].map((step,i)=><div key={step}><span>0{i+1}</span><strong>{step}</strong>{i!==3 && <ArrowRight size={17}/>}</div>)}</div></div></section>
  </>;
}

function Finance({ notify }: { notify: Notify }) {
  return <><PageIntro number="06" eyebrow="FINANCE & SUPPORT" title="투명하게 기록합니다." description="동아리의 후원과 회비 사용 내역을 정리하는 공간입니다. 공개 범위는 운영 정책에 따라 관리됩니다." />
    <section className="container section"><div className="finance-stats"><div><Wallet size={25}/><span>회비 집행 내역</span><strong>—</strong><small>실제 데이터 연동 예정</small></div><div><Handshake size={25}/><span>후원 내역</span><strong>—</strong><small>실제 데이터 연동 예정</small></div><div><FileText size={25}/><span>정산 기록</span><strong>—</strong><small>실제 데이터 연동 예정</small></div></div><div className="finance-layout"><div className="finance-table"><SectionHeading eyebrow="TRANSACTION HISTORY" title="회비 사용 기록" /><div className="simple-table-head"><span>항목</span><span>분류</span><span>날짜</span><span>금액</span></div><div className="finance-empty">등록된 내역이 표시될 자리입니다.</div></div><aside className="finance-aside"><Eyebrow>SUPPORT MYROCK</Eyebrow><h3>우리의 무대를<br/>응원해주세요.</h3><p>후원 안내와 계좌 정보가 등록될 자리입니다.</p><button type="button" className="btn btn-dark" onClick={() => notify()}>후원 안내 확인 <ArrowUpRight size={17}/></button></aside></div></section>
  </>;
}

function Handover({ openLogin }: { openLogin: () => void }) {
  return <><PageIntro number="07" eyebrow="HANDOVER" title="경험을 다음 사람에게." description="매년 바뀌는 운영진이 중요한 기록과 노하우를 이어갈 수 있도록 준비한 인수인계 공간입니다." />
    <section className="container section"><div className="locked-area"><span className="lock-icon"><LockKeyhole size={30}/></span><Eyebrow>STAFF ONLY</Eyebrow><h2>운영진 전용 공간입니다.</h2><p>인수인계 기록 및 드라이브 링크는 권한이 있는 운영진에게만 공개됩니다.<br/>현재는 화면 구조를 확인하는 미리보기 상태입니다.</p><button type="button" className="btn btn-dark" onClick={openLogin}>운영진 로그인 <ArrowRight size={17}/></button></div><div className="handover-preview"><div><span className="sample-pill">PREVIEW</span><h3>직책별 인수인계 노트</h3><p>회장, 총무, 홍보부장, 파트장 등 직책별 기록을 남깁니다.</p></div><div><span className="sample-pill">PREVIEW</span><h3>인수인계 드라이브</h3><p>업무 관련 파일과 문서를 한 곳에서 안내합니다.</p></div></div></section>
  </>;
}

function Members({ openLogin, notify }: { openLogin: () => void; notify: Notify }) {
  const [tab,setTab] = useState('회원 명단');
  return <><PageIntro number="08" eyebrow="MEMBER ADMIN" title="모여락 사람들." description="학번과 이름, 기수, 세션을 관리하고 운영진 권한을 인계할 수 있는 공간입니다." />
    <section className="container section"><div className="admin-alert"><ShieldCheck size={20}/><p><strong>관리자 화면 미리보기</strong> 실제 회원 정보와 로그인 권한은 아직 연결되지 않았습니다. 최종 구현에서는 회장단과 운영진의 접근 권한을 구분합니다.</p><button type="button" onClick={openLogin}>로그인 화면 <ArrowUpRight size={17}/></button></div><div className="members-shell"><div className="members-sidebar"><span>MEMBER MANAGEMENT</span>{['회원 명단','신입부원 등록','권한 관리'].map(t=><button type="button" key={t} className={tab===t?'selected':''} onClick={()=>setTab(t)}>{t}<ArrowRight size={16}/></button>)}</div><div className="members-panel"><div className="members-panel-head"><div><Eyebrow>MANAGEMENT</Eyebrow><h2>{tab}</h2></div><span className="sample-pill">PREVIEW</span></div>{tab==='회원 명단' ? <><div className="members-tools"><label className="search-box"><Search size={17}/><input placeholder="학번 또는 이름 검색" aria-label="회원 검색 (미리보기)" onChange={() => {}} /></label><button type="button" className="btn btn-outline btn-small" onClick={()=>setTab('신입부원 등록')}><Plus size={16}/> 회원 등록</button></div><div className="member-table"><div className="member-table-head"><span>학번</span><span>이름</span><span>기수</span><span>세션</span><span>직책</span></div><div className="member-empty"><Users size={27}/><strong>등록된 회원 정보가 표시됩니다.</strong><small>Firestore 연결 후 실제 회원 명단을 확인할 수 있어요.</small></div></div></> : tab==='신입부원 등록' ? <div className="member-form"><p>회장단이 신입부원의 정보를 등록할 때 사용할 화면입니다.</p><div className="form-grid"><label>학번<input placeholder="학번 입력"/></label><label>이름<input placeholder="이름 입력"/></label><label>기수<input placeholder="기수 입력"/></label><label>세션<select defaultValue=""><option value="" disabled>세션 선택</option>{['보컬','기타','베이스','드럼','키보드'].map(v=><option key={v}>{v}</option>)}</select></label></div><button type="button" className="btn btn-dark" onClick={()=>notify()}>회원 등록하기 <ArrowRight size={17}/></button><p className="small-muted">일괄 등록(CSV) 기능은 추후 연동 예정</p></div> : <div className="role-preview"><p>실제 운영에서는 현재 회장단이 다음 운영진에게 권한을 부여하고 퇴임 운영진의 권한을 회수할 수 있습니다.</p>{[['일반부원','기본 회원 기능'],['파트장','게시글 작성 · 대여 승인'],['실무단','동아리 정보 · 회계 관리'],['회장단','회원 등록 · 권한 변경']].map(([role,desc],i)=><div className="role-row" key={role}><span className="role-num">0{i+1}</span><strong>{role}</strong><span>{desc}</span><ShieldCheck size={17}/></div>)}</div>}</div></div></section>
  </>;
}

function LoginDialog({ onClose, notify }: { onClose: () => void; notify: Notify }) {
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div className="login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><button type="button" className="modal-close" onClick={onClose} aria-label="닫기"><X size={22}/></button><div className="modal-logo">MYROCK<span>.</span></div><Eyebrow>MEMBER SIGN IN</Eyebrow><h2 id="login-title">반가워요,<br/>모여락입니다.</h2><p>학번으로 로그인하는 화면입니다.<br/>인증 기능은 다음 단계에서 연결됩니다.</p><form onSubmit={event => {event.preventDefault(); notify('아직 로그인 기능은 연결되지 않았습니다. 화면 미리보기입니다.'); onClose();}}><label>학번<input inputMode="numeric" autoComplete="username" placeholder="학번을 입력하세요" /></label><label>비밀번호<input type="password" autoComplete="current-password" placeholder="비밀번호를 입력하세요" /></label><button type="submit" className="btn btn-dark">로그인 <ArrowRight size={18}/></button></form><div className="login-help"><CircleHelp size={16}/> 비밀번호 문의는 운영진에게 연락해주세요.</div></div></div>;
}

function App() {
  const [page, setPage] = useState<Page>(pageFromPath);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => { const handle = () => setPage(pageFromPath()); window.addEventListener('popstate', handle); return () => window.removeEventListener('popstate', handle); }, []);
  useEffect(() => { document.title = (page === 'home' ? '모여락 MYROCK' : ([...nav,...moreNav].find(item=>item.id===page)?.label || '모여락') + ' | MYROCK'); }, [page]);
  const navigate = (next: Page) => { if (window.location.pathname !== pathFor(next)) window.history.pushState(null, '', pathFor(next)); setPage(next); setMobileOpen(false); setMoreOpen(false); window.scrollTo({top:0,behavior:'instant'}); };
  const notify: Notify = (message = '화면 미리보기입니다. 실제 기능은 다음 단계에서 연결됩니다.') => { setToast(message); window.setTimeout(() => setToast(''), 3500); };
  const showLogin = () => { setLoginOpen(true); setMobileOpen(false); };
  return <div className="site-root">
    <div className="prototype-banner"><div className="container"><Sparkles size={13}/><span>MYROCK WEBSITE PREVIEW</span><span className="prototype-sub">현재 화면 및 레이아웃 시안입니다 · 로그인과 저장 기능은 미구현</span></div></div>
    <header className="site-header"><div className="container header-inner">
      <button type="button" className="logo" onClick={() => navigate('home')} aria-label="모여락 홈"><span className="logo-symbol">M<span>·</span></span><span className="logo-type"><strong>MYROCK<span>.</span></strong><small>모여락</small></span></button>
      <nav className="desktop-nav" aria-label="주 메뉴">{nav.map(item=><button type="button" key={item.id} className={page===item.id?'active':''} onClick={()=>navigate(item.id)}>{item.label}</button>)}<div className="more-wrap"><button type="button" className={moreNav.some(n=>n.id===page) ? 'active' : ''} onClick={()=>setMoreOpen(!moreOpen)} aria-expanded={moreOpen}>더보기 <ChevronDown size={14}/></button>{moreOpen && <div className="more-dropdown">{moreNav.map(item=><button type="button" key={item.id} onClick={()=>navigate(item.id)}>{item.label}<ArrowUpRight size={15}/></button>)}</div>}</div></nav>
      <div className="header-right"><button type="button" className="header-login" onClick={showLogin}><span>로그인</span><ArrowUpRight size={17}/></button><button type="button" className="mobile-toggle" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="메뉴 열기" aria-expanded={mobileOpen}>{mobileOpen ? <X size={23}/> : <Menu size={23}/>}</button></div>
    </div>{mobileOpen && <nav className="mobile-nav" aria-label="모바일 메뉴"><button type="button" onClick={()=>navigate('home')}>홈 <ArrowUpRight size={18}/></button>{[...nav,...moreNav].map(item=><button type="button" key={item.id} onClick={()=>navigate(item.id)}>{item.label} <ArrowUpRight size={18}/></button>)}<button type="button" onClick={showLogin}>로그인 <ArrowUpRight size={18}/></button></nav>}</header>
    <main key={page}>
      {page==='home' && <Home navigate={navigate} notify={notify}/>}
      {page==='about' && <About navigate={navigate}/>}
      {page==='schedule' && <Schedule notify={notify}/>}
      {page==='news' && <News notify={notify}/>}
      {page==='gallery' && <Gallery notify={notify}/>}
      {page==='equipment' && <Equipment notify={notify}/>}
      {page==='finance' && <Finance notify={notify}/>}
      {page==='handover' && <Handover openLogin={showLogin}/>}
      {page==='members' && <Members openLogin={showLogin} notify={notify}/>}
    </main>
    <footer className="footer"><div className="container footer-top"><div className="footer-identity"><div className="footer-wordmark">MYROCK<span>.</span></div><p>서로 다른 소리가 모여<br/>하나의 무대를 만드는 곳.</p><span>성균관대학교 밴드 동아리 모여락</span></div><div className="footer-nav"><div><strong>EXPLORE</strong>{nav.slice(0,4).map(item=><button type="button" key={item.id} onClick={()=>navigate(item.id)}>{item.label}</button>)}</div><div><strong>MEMBERS</strong>{[nav[4],...moreNav].map(item=><button type="button" key={item.id} onClick={()=>navigate(item.id)}>{item.label}</button>)}</div><div><strong>CONTACT</strong><span><Mail size={14}/> 운영진 연락처 등록 예정</span><span><Settings2 size={14}/> 사이트 관리자 연락처 등록 예정</span><span><Instagram size={14}/> Instagram 연결 예정</span></div></div></div><div className="container footer-bottom"><span>© MYROCK. ALL RIGHTS RESERVED.</span><span>MADE FOR THE MUSIC, MADE FOR US. <ArrowUpRight size={14}/></span></div></footer>
    {loginOpen && <LoginDialog onClose={()=>setLoginOpen(false)} notify={notify}/>}
    {toast && <div className="toast" role="status"><CircleHelp size={18}/><span>{toast}</span><button type="button" onClick={()=>setToast('')} aria-label="알림 닫기"><X size={16}/></button></div>}
  </div>;
}
export default App;
