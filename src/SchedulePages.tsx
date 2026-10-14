import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock3, Plus, Users } from 'lucide-react';

export type DemoSchedule = {
  id: string;
  title: string;
  category: string;
  description: string;
  seed: number;
};

// Temporary, clearly labeled display data. No Firestore reads or saved responses yet.
export const scheduleExamples: readonly DemoSchedule[] = [
  { id: 'regular-a', title: '정기공연 A팀 합주', category: '정기공연', description: '정기공연 준비를 위한 합주 시간 조율', seed: 0 },
  { id: 'regular-b', title: '정기공연 B팀 합주', category: '정기공연', description: '정기공연 준비를 위한 합주 시간 조율', seed: 1 },
  { id: 'collab', title: '연합공연 합주', category: '연합공연', description: '연합공연에 참여하는 구성원들의 시간 조율', seed: 2 },
  { id: 'free-jam', title: '자율 합주', category: '자율합주', description: '자유롭게 모여 연습하는 합주 시간 조율', seed: 3 },
];

export const findSchedule = (id: string): DemoSchedule | undefined =>
  scheduleExamples.find(schedule => schedule.id === id);

function ScheduleHeading({ title, description, tag = 'WHEN2MEET' }: { title: string; description: string; tag?: string }) {
  return <div className="page-heading container">
    <span className="eyebrow">{tag}</span>
    <h1>{title}</h1>
    <p>{description}</p>
  </div>;
}

export function ScheduleLanding({
  canCreateTeam, onCreate, onCreateTeam, onOpen,
}: {
  canCreateTeam: boolean;
  onCreate: () => void;
  onCreateTeam: () => void;
  onOpen: (id: string) => void;
}) {
  return <>
    <ScheduleHeading title="합주 시간 조율" description="새 시간표를 만들거나, 내가 참여한 합주 시간표를 확인하세요." />
    <section className="container section-block schedule-landing">
      <div className="schedule-action-grid">
        <button type="button" className="schedule-create-card" onClick={onCreate}>
          <span className="schedule-action-icon"><Plus size={25} strokeWidth={1.8} aria-hidden="true" /></span>
          <span className="schedule-action-text">
            <strong>시간표 만들기</strong>
            <small>함께 합주할 사람들과 가능한 시간을 조율해 보세요.</small>
            <em>기능 준비 중</em>
          </span>
          <ArrowUpRight size={19} aria-hidden="true" />
        </button>
        {canCreateTeam && <button type="button" className="schedule-create-card schedule-create-card-team" onClick={onCreateTeam}>
          <span className="schedule-action-icon"><Users size={25} strokeWidth={1.8} aria-hidden="true" /></span>
          <span className="schedule-action-text">
            <strong>구성팀 시간표 만들기</strong>
            <small>공연 구성팀의 합주 시간을 조율하는 시간표입니다.</small>
            <em>운영진 전용 · 기능 준비 중</em>
          </span>
          <ArrowUpRight size={19} aria-hidden="true" />
        </button>}
      </div>
    </section>

    <section className="container section-block schedule-list-section">
      <div className="section-heading">
        <div>
          <h2>내가 참여한 시간표</h2>
          <p>현재는 화면 확인을 위한 예시 시간표 4개가 표시됩니다.</p>
        </div>
        <span className="schedule-list-count">총 {scheduleExamples.length}개</span>
      </div>
      <div className="schedule-list" role="list">
        {scheduleExamples.map(schedule => <div className="schedule-list-item" role="listitem" key={schedule.id}>
          <div className="schedule-list-icon"><CalendarDays size={21} strokeWidth={1.6} aria-hidden="true" /></div>
          <div className="schedule-list-content">
            <div className="schedule-list-meta"><span>{schedule.category}</span><span>예시 데이터</span></div>
            <h3>{schedule.title}</h3>
            <p>{schedule.description}</p>
          </div>
          <button type="button" className="outline-action schedule-open-button" onClick={() => onOpen(schedule.id)}
            aria-label={schedule.title + ' 시간표 열기'}>
            시간표 열기 <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>)}
      </div>
    </section>
  </>;
}

const days = ['월', '화', '수', '목', '금', '토', '일'] as const;
const hours = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'] as const;
const levelNames = ['응답 적음', '일부 가능', '가능 인원 많음', '대부분 가능'] as const;
const sampleLevel = (seed: number, dayIndex: number, hourIndex: number): number =>
  (seed + hourIndex * 3 + dayIndex * 2 + (hourIndex * dayIndex) % 3) % 4;

export function ScheduleDetail({ schedule, onBack }: { schedule: DemoSchedule | undefined; onBack: () => void }) {
  if (!schedule) {
    return <>
      <ScheduleHeading title="시간표를 찾을 수 없습니다" description="요청한 시간표가 존재하지 않습니다." />
      <section className="container section-block schedule-detail">
        <button className="schedule-back-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" /> 시간표 목록으로
        </button>
      </section>
    </>;
  }
  return <>
    <ScheduleHeading title={schedule.title} tag="SCHEDULE DETAIL" description={schedule.description} />
    <section className="container section-block schedule-detail">
      <button className="schedule-back-button" type="button" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> 내가 참여한 시간표 목록
      </button>
      <div className="schedule-detail-heading">
        <div>
          <span className="schedule-detail-label">{schedule.category} · 예시 시간표</span>
          <h2>주간 시간 조율 현황</h2>
          <p>시간표를 열었을 때의 화면 예시입니다. 실제 참여자 응답은 아직 연결되지 않았습니다.</p>
        </div>
        <span className="schedule-detail-preview">PREVIEW</span>
      </div>
      <div className="schedule-calendar">
        <div className="calendar-wrapper">
          <div className="availability-head"><span><Clock3 size={14} aria-hidden="true" /> 17:00 — 23:00</span><span>월요일부터 일요일까지</span></div>
          <div className="calendar-scroll" role="group" aria-label={schedule.title + ' 주간 시간표 예시'}>
            <div className="calendar-grid">
              <div className="calendar-corner">TIME</div>
              {days.map(day => <div className="calendar-day" key={day}>{day}</div>)}
              {hours.map((hour, row) => <div className="calendar-row" key={hour}>
                <div className="calendar-hour">{hour}</div>
                {days.map((day, col) => {
                  const level = sampleLevel(schedule.seed, col, row);
                  return <div key={day} className={`calendar-cell level-${level}`}
                    role="img" aria-label={`${day}요일 ${hour} · ${levelNames[level]} (예시)`}
                    title={`${day}요일 ${hour} · ${levelNames[level]} (예시)`} />;
                })}
              </div>)}
            </div>
          </div>
          <div className="calendar-legend" aria-label="예시 가능 시간 범례">
            <span><i className="legend-level-0" /> 응답 적음</span>
            <span><i className="legend-level-2" /> 일부 가능</span>
            <span><i className="legend-level-3" /> 대부분 가능</span>
          </div>
        </div>
      </div>
      <p className="schedule-detail-footnote">현재는 구성원 입력이나 일정 확정 기능 없이 예시 시간표만 보여줍니다.</p>
    </section>
  </>;
}
