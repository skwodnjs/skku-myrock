import { ArrowLeft, ArrowRight, ArrowUpRight, ClipboardList, HeartHandshake, LockKeyhole, Wallet } from 'lucide-react';

type Nav = () => void;

function FinanceHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="page-heading container">
    <span className="eyebrow">{eyebrow}</span>
    <h1>{title}</h1>
    <p>{description}</p>
  </div>;
}

function FinanceSectionTitle({ title, description }: { title: string; description?: string }) {
  return <div className="section-heading">
    <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
  </div>;
}

export function FinanceLanding({ onDonations, onExpenses }: { onDonations: Nav; onExpenses: Nav }) {
  return <>
    <FinanceHeading eyebrow="SUPPORT & FINANCE" title="후원 · 회계"
      description="모여락의 다음 무대를 함께 만들어 주시는 모든 분께 감사드립니다." />

    <section className="container section-block finance-support-intro">
      <span className="eyebrow">SUPPORT MYROCK</span>
      <h2>여러분의 응원이 모여<br />더 나은 모여락을 만듭니다.</h2>
      <p>모여락은 음악을 좋아하는 사람들이 함께 배우고, 합주하고, 무대에 오르는 성균관대학교 중앙 밴드동아리입니다. 서로 다른 악기와 목소리가 모여 하나의 음악을 완성하듯, 동아리를 응원해 주시는 한 분 한 분의 마음이 모여 모여락의 활동을 더욱 풍성하게 만들어 줍니다.</p>
      <p>여러분의 후원은 악기와 장비를 더 좋은 상태로 유지하고, 신입부원이 새로운 음악에 도전하며, 더 많은 공연과 활동을 이어갈 수 있는 소중한 힘이 됩니다. 크고 작은 관심과 응원 모두 모여락의 성장에 큰 도움이 됩니다.</p>
      <p>보내주신 마음이 의미 있게 쓰일 수 있도록 후원 내역과 회비 집행 내역을 투명하게 공유하는 공간도 마련하고자 합니다. 모여락이 앞으로도 즐겁게 음악을 만들 수 있도록 따뜻한 관심 부탁드립니다.</p>
    </section>

    <section className="container section-block finance-donation-account">
      <FinanceSectionTitle title="후원 계좌 안내" description="후원을 원하시는 분을 위한 계좌 안내입니다." />
      <div className="finance-bank-card">
        <div className="finance-bank-card-header">
          <span className="finance-bank-eyebrow">DONATION ACCOUNT</span>
        </div>
        <div className="finance-bank-fields">
          <div><span>은행</span><strong>등록 예정</strong></div>
          <div><span>계좌번호</span><strong>등록 예정</strong></div>
          <div><span>예금주</span><strong>등록 예정</strong></div>
        </div>
      </div>
      <div className="finance-privacy-note">
        <LockKeyhole size={19} aria-hidden="true" />
        <div>
          <strong>이름을 공개하지 않고 후원할 수 있습니다.</strong>
          <p>특정 후원 내역에서 이름을 공개하고 싶지 않다면 입금자명을 <b>홍길동(비공개)</b>와 같이 작성하거나 운영진에게 해당 후원 건의 익명 처리를 요청해 주세요. 익명 처리된 후원은 <b>전체 후원 내역</b>에서 후원자 이름 대신 <b>익명</b>으로 표시됩니다. 본인이 후원한 <b>모든 내역</b>을 익명 처리하기를 희망하는 경우 운영진에게 문의해 주세요.</p>
          <p>익명 처리 여부와 관계없이, 본인이 후원한 내역은 로그인 후 <b>내 후원 내역</b>에서 확인할 수 있습니다.</p>
        </div>
      </div>
    </section>

    <section className="container section-block finance-entry-section">
      <FinanceSectionTitle title="후원 및 회계 내역" description="후원 현황과 동아리의 회비 사용 내역을 확인하는 공간입니다." />
      <div className="finance-entry-grid">
        <button type="button" className="finance-entry-card" onClick={onDonations}>
          <HeartHandshake size={26} strokeWidth={1.6} aria-hidden="true" />
          <span className="finance-entry-content">
            <strong>후원 내역 확인</strong>
            <small>전체 후원 내역 및 로그인 후 내 후원 내역</small>
          </span>
          <ArrowUpRight size={19} aria-hidden="true" />
        </button>
        <button type="button" className="finance-entry-card" onClick={onExpenses}>
          <ClipboardList size={26} strokeWidth={1.6} aria-hidden="true" />
          <span className="finance-entry-content">
            <strong>회비 집행 내역 확인</strong>
            <small>동아리 회비가 사용된 항목과 집행 기록</small>
          </span>
          <ArrowUpRight size={19} aria-hidden="true" />
        </button>
      </div>
    </section>
  </>;
}

function BackToFinance({ onBack }: { onBack: Nav }) {
  return <button type="button" className="finance-return-link" onClick={onBack}>
    <ArrowLeft size={16} aria-hidden="true" /> 후원 · 회계로 돌아가기
  </button>;
}

function FinanceEmpty({ title, description }: { title: string; description: string }) {
  return <div className="finance-record-empty" role="status">
    <Wallet size={24} strokeWidth={1.5} aria-hidden="true" />
    <strong>{title}</strong>
    <p>{description}</p>
  </div>;
}

export function DonationHistory({
  onBack, loggedIn, authPending, onLogin,
}: {
  onBack: Nav;
  loggedIn: boolean;
  authPending: boolean;
  onLogin: Nav;
}) {
  return <>
    <FinanceHeading eyebrow="DONATION HISTORY" title="후원 내역"
      description="모여락에 보내주신 소중한 응원을 확인하는 공간입니다." />
    <div className="container finance-details-content">
      <BackToFinance onBack={onBack} />

      <section className="finance-record-section" aria-labelledby="all-donations-heading">
        <FinanceSectionTitle title="전체 후원 내역" description="누구나 확인할 수 있는 동아리 후원 기록입니다." />
        <p className="finance-record-description" id="all-donations-heading">
          후원자 이름 공개를 원하지 않는 경우 이 목록에는 실명 대신 <b>익명</b>으로 표시합니다.
        </p>
        <div className="finance-record-table">
          <div className="finance-record-table-header finance-donations-columns">
            <span>후원일</span><span>후원자</span><span>후원 금액</span>
          </div>
          <FinanceEmpty title="후원 기록 연결 예정"
            description="현재는 화면 구성 단계로, 실제 후원 내역이나 금액을 표시하지 않습니다." />
        </div>
      </section>

      <section className="finance-record-section" aria-labelledby="my-donations-heading">
        <FinanceSectionTitle title="내 후원 내역" description="로그인한 부원 본인의 후원 내역을 확인하는 공간입니다." />
        <div className="finance-personal-note" id="my-donations-heading">
          <LockKeyhole size={17} aria-hidden="true"/>
          <span>개별 후원을 익명 처리하거나 모든 후원 내역을 익명 처리하더라도, 본인이 후원한 내역은 로그인 후 <b>내 후원 내역</b>에서 확인할 수 있습니다.</span>
        </div>
        {authPending ? <FinanceEmpty title="로그인 상태 확인 중"
          description="본인 확인이 완료되면 내 후원 내역 영역을 보여드립니다." /> :
          loggedIn ? <div className="finance-record-table">
            <div className="finance-record-table-header finance-personal-columns">
              <span>후원일</span><span>후원 내역</span><span>후원 금액</span>
            </div>
            <FinanceEmpty title="내 후원 내역 연결 예정"
              description="현재는 실제 후원 내역을 불러오지 않습니다. 후원 내역 확인·계정 연결 기능은 추후 제공할 예정입니다." />
          </div> :
          <div className="finance-login-gate">
            <LockKeyhole size={24} aria-hidden="true" />
            <div><strong>내 후원 내역은 로그인 후 확인할 수 있습니다.</strong>
              <p>개인별 후원 내역은 본인만 조회할 수 있도록 연결할 예정입니다.</p>
            </div>
            <button type="button" className="button button-primary" onClick={onLogin}>
              로그인 <ArrowRight size={15} aria-hidden="true"/>
            </button>
          </div>}
      </section>
      <div className="finance-detail-footer"><BackToFinance onBack={onBack}/></div>
    </div>
  </>;
}

export function ExpenseHistory({ onBack }: { onBack: Nav }) {
  return <>
    <FinanceHeading eyebrow="CLUB EXPENSES" title="회비 집행 내역"
      description="모여락의 동아리 회비가 어떻게 쓰이는지 확인하는 공간입니다." />
    <div className="container finance-details-content">
      <BackToFinance onBack={onBack} />
      <section className="finance-record-section">
        <FinanceSectionTitle title="회비 집행 기록" description="회비 사용 내역을 항목별로 투명하게 공유할 예정입니다." />
        <div className="finance-record-table">
          <div className="finance-record-table-header finance-expense-columns">
            <span>집행일</span><span>사용 항목</span><span>상세 내용</span><span>금액</span>
          </div>
          <FinanceEmpty title="회비 집행 기록 연결 예정"
            description="현재는 화면 구성 단계로, 실제 회비 집행 내역이나 금액을 표시하지 않습니다." />
        </div>
        <p className="finance-record-footnote">추후 회비 집행 데이터가 연결되면 날짜, 사용 항목, 집행 사유와 금액을 확인할 수 있습니다.</p>
      </section>
      <div className="finance-detail-footer"><BackToFinance onBack={onBack}/></div>
    </div>
  </>;
}
