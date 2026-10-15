import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import typescript from 'typescript';

const dataSource = await readFile(new URL('../src/noticesData.ts', import.meta.url), 'utf8');
const built = typescript.transpileModule(dataSource, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const { notices, findNotice } = await import('data:text/javascript;base64,' + Buffer.from(built).toString('base64'));
const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

test('all four user-supplied notices have exact titles, date, category, and descending publication order', () => {
  assert.deepEqual(notices.map(({ title, category, publishedAt }) => [title, category, publishedAt]), [
    ['🎸중앙동아리 밴드 모여락 29.5기 신입부원 모집🎸', '공지', '2026-08-28'],
    ['2026학년도 2학기 29.5기 신입 보컬 모집 기한 및 오디션 방법 안내', '공지', '2026-08-21'],
    ['📢 2026 MYR 홈커밍데이 안내', '행사', '2026-08-18'],
    ['2026 모여락 여름 공연', '공연', '2026-07-11'],
  ]);
  assert.deepEqual(notices.map(post => post.date), [
    '2026. 08. 28.', '2026. 08. 21.', '2026. 08. 18.', '2026. 07. 11.',
  ]);
  assert.equal(new Set(notices.map(post => post.id)).size, 4);
  assert.ok(notices.every(post => findNotice(post.id) === post));
  assert.equal(findNotice('nonexistent-notice'), undefined);
});
test('each notice has a leading image placeholder, with no images downloaded yet', () => {
  assert.ok(notices.every(post => post.images.length >= 1));
  assert.ok(notices.every(post => post.images.every(src => src === null)));
  assert.match(app, /notice\.images\.map\(\(src, index\) =>/);
  assert.match(app, /notice-detail-photo-placeholder/);
  assert.match(app, /notice-detail-images[\s\S]*?notice-detail-body/);
});
test('recruitment notice preserves schedule, classes, auditions, questions and contact info', () => {
  const post = notices[0];
  assert.ok(post.body.length > 2000, 'recruitment notice should retain full user-supplied text');
  for (const phrase of [
    '※ 모여락 29.5기 신입부원 모집※',
    '8/24(월)부터 9/17(목) 17시까지',
    '❗️클래스(레슨) ❗️',
    '❗️정기공연❗️',
    '❗️신입생 환영회 및 정기모임 ❗️',
    '❗️ MT ❗️',
    '*학사 일정에 따라 변동될 수 있습니다.*',
    '브로큰 발렌타인 - 알루미늄',
    '터치드 - 야경',
    '❓모여락 Q&A',
    '신입생 카톡방 개설 : 9/20 (일)',
    '보컬 테스트 톡방 개설 : 9/15 (화)',
    '@skku_m.y.rock',
    '010-6350-7007(Instagram:@florescence_328)',
  ]) assert.ok(post.body.includes(phrase), 'Missing recruitment section: ' + phrase);
});
test('vocal notice preserves audition times, song options, constraints and submission email', () => {
  const post = notices[1];
  for (const phrase of [
    '9/17(목) 17시 마감', '9/20(일), 9/21(월)',
    '학생회관 B1 ’화요뜨락‘',
    '🎼지정곡 안내', '브로큰발렌타인 - 알루미늄', '터치드 - 야경',
    '모든 테스트 과정은 녹화됩니다', '9/18(토) 23시 59분',
    '에코/리버브 등 효과는 전부 제거',
    'azure328@g.skku.edu', '010-6350-7007',
  ]) assert.ok(post.body.includes(phrase), 'Missing vocal notice section: ' + phrase);
});
test('homecoming notice preserves complete timetable and application deadlines', () => {
  const post = notices[2];
  for (const phrase of [
    'OB와 YB가 함께 공연', '2026년 9월 19일 토요일',
    '11:00~13:00 리허설', '13:00~14:00 점심 식사',
    '14:30~15:30 2026년도 활동 소개', '15:30~17:30 공연',
    '18:00~ 뒤풀이', '2026년 8월 15일 23시 59분까지',
    '08.15 (토) ~ 08.29 (토) 23시 59분까지',
    '학생회관 소강당 (예정)', '010-6350-7007',
  ]) assert.ok(post.body.includes(phrase), 'Missing homecoming notice section: ' + phrase);
});
test('summer concert notice preserves stage, ticket price and event date', () => {
  const post = notices[3];
  for (const phrase of [
    '무더운 여름 속', '밀려오는 리듬에', '7월 18일 17:00 – 20:00',
    '홍대 스윙홀', '서울 마포구 동교로 162-5 지하 1층',
    '사전예매: 2000원 / 현장예매: 4000원', '사전예매 | 프로필 링크',
  ]) assert.ok(post.body.includes(phrase), 'Missing concert notice section: ' + phrase);
});
test('home teaser, category list, search, direct detail routes and browser history stay in sync', () => {
  assert.match(app, /notices\.slice\(0,\s*3\)/);
  assert.match(app, /onClick=\{\(\) => openNotice\(post\.id\)\}/);
  assert.match(app, /const filtered = notices\.filter/);
  assert.match(app, /const noticeIdFromPath/);
  assert.match(app, /window\.location\.pathname\.match\(\/\^\\\/news/);
  assert.match(app, /window\.history\.pushState\(null, '', path\)/);
  assert.match(app, /setActiveNoticeId\(noticeIdFromPath\(\)\)/);
  assert.match(app, /page==='notice-detail'&&<NoticeDetail/);
  assert.match(app, /onClick=\{backToList\}/);
  assert.match(app, /notice\.body\.split\(\/\\n\\s\*\\n\/\)/);
  assert.doesNotMatch(app, /미리보기용 예시 공지입니다/);
});
test('article content is not fetched from a database and wraps original line breaks', () => {
  assert.doesNotMatch(dataSource, /firebase|firestore|fetch\(/i);
  assert.match(styles, /\.notice-detail-body p\s*\{[^}]*white-space:\s*pre-line;/s);
  assert.match(styles, /\.notice-detail-photo-placeholder\s*\{/);
  assert.match(styles, /@media \(max-width:\s*700px\)/);
});


test('only management roles see the writing action and direct compose routes enforce access', () => {
  assert.match(app, /function News\(\{ canWrite, onWrite, openNotice \}/);
  assert.match(app, /\{canWrite && <button type="button" className="button button-primary" onClick=\{onWrite\}>/);
  assert.match(app, /canWrite=\{Boolean\(user && !authPending && currentLevel\)\}/);
  assert.match(app, /page==='notice-compose'&&\(authPending \?/);
  assert.match(app, /user && currentLevel \? <NoticeComposer/);
  assert.match(app, /page === 'notice-compose' \? '\/news\/write'/);
  assert.match(app, /return match && match\[1\] !== 'write'/);
  assert.match(app, /return 'notice-compose'/);
  assert.doesNotMatch(app, /글쓰기는 추후 연결할 예정입니다/);
});
test('plain notice composer supports editable title, text blocks and inserted images without publishing', async () => {
  const composer = await readFile(new URL('../src/NoticeComposer.tsx', import.meta.url), 'utf8');
  for (const token of ['공지사항 글쓰기', '제목', '본문', '이미지 추가', '본문 추가', '미리보기',
    'type="file"', 'accept="image/png,image/jpeg,image/webp,image/gif"', 'URL.createObjectURL',
    'URL.revokeObjectURL', 'moveBlock', 'removeBlock', '<textarea', '게시글은 저장되지 않습니다']) {
    assert.ok(composer.includes(token), 'Composer missing: ' + token);
  }
  assert.doesNotMatch(composer, /contentEditable|document\.execCommand|fontSize|fontWeight|setDoc\(|addDoc\(|updateDoc\(/);
  assert.match(styles, /\.notice-composer-blocks\s*\{/);
  assert.match(styles, /\.notice-composer-preview\s*\{/);
});


test('hardcoded notice authors are two each and only visible to permitted members', () => {
  assert.deepEqual(notices.map(post => post.author), ['나재원', '나재원', '김서연', '김서연']);
  assert.match(app, /canWrite && <span className="notice-author-cell">작성자<\/span>/);
  assert.match(app, /canWrite && <span className="notice-author-cell">\{post\.author\}<\/span>/);
  assert.match(app, /canViewAuthor && <span>작성자 \{notice\.author\}<\/span>/);
  assert.match(app, /canViewAuthor=\{Boolean\(user && !authPending && currentLevel\)\}/);
  assert.match(styles, /\.notice-table-head\.has-author,\.notice-table-row\.has-author\{grid-template-columns:90px minmax\(0,1fr\) 100px 90px\}/);
});
test('image editor accepts px dimensions, defaults to locked ratio and allows independent sizing when unlocked', async () => {
  const component = await readFile(new URL('../src/NoticeComposer.tsx', import.meta.url), 'utf8');
  const source = await readFile(new URL('../src/noticeImageSize.ts', import.meta.url), 'utf8');
  const js = typescript.transpileModule(source, {compilerOptions: {module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022}}).outputText;
  const { initialImageDimensions, resizeImageDimensions } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
  assert.deepEqual(initialImageDimensions(1600, 800), {width: 800, height: 400});
  assert.deepEqual(initialImageDimensions(600, 1200), {width: 450, height: 900});
  assert.deepEqual(resizeImageDimensions({width: 800, height: 400}, 'width', 400, true), {width: 400, height: 200});
  assert.deepEqual(resizeImageDimensions({width: 800, height: 400}, 'height', 300, true), {width: 600, height: 300});
  assert.deepEqual(resizeImageDimensions({width: 800, height: 400}, 'width', 500, false), {width: 500, height: 400});
  assert.deepEqual(resizeImageDimensions({width: 800, height: 400}, 'height', 275, false), {width: 800, height: 275});
  assert.deepEqual(resizeImageDimensions({width: 800, height: 400}, 'width', 0, true), {width: 800, height: 400});
  for (const part of ['ratioLocked: true', 'ratioLocked: !block.ratioLocked', 'type="number"', 'value={block.width', 'value={block.height',
    'changeImageSize(block.id', 'role="group"', 'aria-pressed={block.ratioLocked}', '<Link size={19}', '<Link2Off size={19}', 'initialImageDimensions', 'aspectRatio:', 'onLoad={event => setNaturalSize']) {
    assert.ok(component.includes(part), 'Image sizing missing: ' + part);
  }
  assert.match(styles, /\.notice-composer-dimensions\s*\{/);
  assert.match(styles, /\.notice-composer-ratio-toggle\s*\{/);
  assert.match(styles, /\.notice-composer-image-stage img,\.notice-composer-preview-image img\{[^}]*max-height:none;/);
  assert.doesNotMatch(component, /uploadBytes|uploadString|addDoc|setDoc/);
});
