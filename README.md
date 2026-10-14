# 모여락 홈페이지

성균관대학교 중앙 밴드 동아리 모여락. **Cloudflare Pages(정적 홈페이지 및 관리자 API)** + **Firebase Auth/Firestore(Spark 무료)** 구성.

- 회원용 홈페이지: Cloudflare Pages 프로젝트의 `*.pages.dev` 주소
- 인증: 기존 Firebase Authentication 유지 (학번 + 비밀번호)
- 데이터: 기존 Firestore 유지
- 회장단 API: Cloudflare Pages Functions `/api/members/*` (기존 Firebase Cloud Functions는 사용하지 않음)

## 1. Cloudflare Pages 최초 연결

Cloudflare Dashboard → **Workers & Pages → Pages → Connect to Git**에서 GitHub `skwodnjs/skku-myrock` 저장소를 연결합니다.

| 항목 | 설정 |
|---|---|
| Project name | `skku-myrock` (사용 가능한 경우) |
| Production branch | `main` |
| Root directory | 저장소 루트 `/` |
| Framework | React (Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js | 22 이상 |

이 저장소의 루트 `functions/api/members/`는 **Cloudflare Pages Functions**입니다. Git 통합 배포 시 Pages가 이 경로를 인식해 `/api/members/list`, `/api/members/register`, `/api/members/permissions` API를 자동으로 배포합니다.

`public/_routes.json`은 Vite가 `dist/_routes.json`으로 복사합니다. **`/api/*`만 Pages Functions 요청으로 집계**하고 HTML/CSS/JS/정적 이미지 요청은 Pages 정적 자산으로 제공하도록 지정합니다.

기존 Firebase Hosting GitHub Actions는 제거했습니다. 예전에 배포된 `skku-myrock.web.app` 주소는 Firebase Hosting에서 수동으로 삭제하지 않는 이상 그대로 남아 있을 수 있지만 **최신 변경 사항은 Cloudflare Pages에 배포**합니다.

### Git 통합 확인

Cloudflare Pages 프로젝트 → **Deployments**에서 `main` 최신 커밋 배포가 **Success**인지 확인하세요. 설정이 `workers.dev`가 아니라 **Pages 프로젝트**인지도 확인합니다.

## 2. Firebase 인증 도메인 추가

Firebase Console → Authentication → Settings → **Authorized domains**에 **실제 발급된** `<your-project>.pages.dev` 도메인을 추가합니다. 주소에 `https://`를 포함하지 않습니다.

기존 Firebase Auth 계정, 비밀번호, Firestore 문서는 이전하지 않고 그대로 유지합니다. 로그인은 Firebase JS SDK로 처리하므로 기존 `authDomain` 설정을 유지합니다.

## 3. Cloudflare 비밀키 연결 (필수)

회장단 API는 Firebase 서비스 계정으로 Google REST API를 호출합니다. **클라이언트 코드나 GitHub에 서비스 계정 키를 절대로 저장하지 마세요.**

1. Firebase 프로젝트 `skku-myrock`에 접근 가능한 서비스 계정을 준비합니다. 최소 권한 관리를 위해 **Firebase Authentication Admin** 및 **Cloud Datastore User** 등 계정 생성·조회·삭제와 Firestore 문서 조회·생성·수정에 필요한 IAM 역할만 부여하는 전용 서비스 계정을 권장합니다.
2. 서비스 계정 JSON은 자신의 컴퓨터에만 저장합니다. 현재 Firebase Admin SDK에서 사용한 키를 임시로 재사용할 수도 있지만, 장기 운영에는 전용 키를 권장합니다.
3. Cloudflare → **Workers & Pages → 해당 Pages 프로젝트 → Settings → Variables and Secrets → Add**에서 다음을 생성합니다.

   | 이름 | 설정 | 값 |
   |---|---|---|
   | `FIREBASE_SERVICE_ACCOUNT` | **Encrypt/Secret** | 서비스 계정 JSON 전체 내용 |
   | `FIREBASE_API_KEY` | 일반 환경 변수 (선택) | Firebase 웹 API key. 코드에 기존 공개 Firebase 구성값을 기본으로 사용 |

4. **Production** 환경에 설정하고 **새 배포를 실행**해야 Functions 런타임에 반영됩니다. Preview 배포도 테스트하려면 Preview 환경에 별도로 지정해야 할 수 있습니다.
5. Cloudflare Pages 무료 할당량에 맞춰 각 요청에서는 회원 **최대 5명**씩 처리하며, CSV가 60명인 경우 웹이 자동으로 여러 요청으로 나눠 처리합니다.

서비스 계정 JSON 파일을 ChatGPT 대화, GitHub, 공개 페이지나 Cloudflare 일반 평문 변수에 붙여 넣지 마세요. **Secret**으로만 설정합니다. 계정 소유자 또는 개발 담당자만 이 설정을 관리하고, 일반 운영진에게 키를 넘기지 않습니다.

> **주의:** 비밀키가 없거나 Google Cloud IAM 권한이 부족하면 홈페이지 정적 페이지는 표시되지만 회원 관리 API는 실행되지 않습니다. 이 저장소 변경만으로 사용자의 Cloudflare Secret과 Firebase Authorized domains를 대신 설정할 수 없습니다.

## 4. CSV 회원 등록 절차

로그인한 회장단이 **회원 관리 → 신입부원 등록**에서 다음 3단계를 수행합니다.

1. **CSV 추가:** 양식을 받거나 UTF-8 CSV 파일 선택 (한 번에 최대 60명).
2. **추가될 명단 확인:** 서버에 쓰기 전 **전체 인원·학번·이름·기수·세션·직책을 표로 확인**. 다른 파일로 바꿀 수 있음.
3. **등록 실행 → 등록 완료:** 웹이 5명 단위로 처리한 진행 상황을 보여주고, **신규 생성/기존 계정/실패** 인원을 구분. 신규 회원의 초기 비밀번호를 CSV로 다운로드.

양식 예시:

```csv
학번,이름,기수,세션,직책
2026300001,예시회원,29,기타|베이스,
2026300002,예시회원2,29,드럼,장비관리
```

영문 헤더 `studentId,name,generation,sessions,positions`도 지원합니다. 세션 복수 입력은 `|`로 구분합니다.

- **실제 회원 생성은 2단계에서 관리자 확인을 누른 뒤에만 진행됩니다.**
- 새 계정은 언제나 `role: member`, `handoverAccess: false`. `generation`과 `positions`는 표시용 데이터입니다.
- 기존 학번이 이미 있으면 계정·프로필·비밀번호·권한을 수정하지 않고 건너뜁니다.
- 통신 장애 시 결과를 확인할 수 없는 계정이 존재할 수 있으므로 **무작정 같은 명단을 재시도하지 말고 회원 명단과 관리자 로그를 확인**하세요.
- 신규 계정의 초기 비밀번호는 완료 화면에서 **한 번만** 전달됩니다. 즉시 CSV로 내려받아 운영진만 안전하게 보관하고 개별 전달하세요. Git에 올리지 말고 전달 후 삭제합니다.
- 계정 생성과 Firestore 프로필 생성은 별도 Google 서비스 작업이므로 일부 실패가 가능하며, 서버는 신규 계정 롤백을 시도합니다.

## 5. 회원 권한 정책

- `role`: `member`, `part_leader`, `staff`, `president` (기수로 자동 변경되지 않음)
- `positions`: 표시용 직책 목록
- `handoverAccess`: 다른 권한과 독립적인 인수인계 접근 여부

Firebase 로그인 토큰 서명·대상 프로젝트·만료 시간 및 Firestore의 현재 회장단 권한을 **Cloudflare 서버에서 검증**합니다.

현재 개발용 최고관리자 계정은 유지되며, **최고관리자를 새로 발급하거나 수정하는 API는 제공하지 않습니다.** 웹에서 자기 자신이나 기존 최고관리자 계정의 권한 변경을 금지합니다.

세션 수정·자기 비밀번호 변경은 기존 Firebase SDK에서 진행합니다. 현재 이메일은 실제 수신함이 아닌 `학번@members.skku-myrock.firebaseapp.com` 주소로, 이메일 재설정은 지원하지 않습니다.

Firestore 보안 규칙 `firestore.rules`는 자기 프로필만 읽고 세션만 직접 수정하도록 제한합니다. 회장단 작업은 보안 규칙을 우회할 수 있는 서비스 계정으로 수행하므로 **Cloudflare Functions 내부에서 관리자 권한을 반드시 확인합니다.**

## 6. 개발 / 로컬 테스트

```bash
npm install
npm run build
npm run check:api
npm run check:pages
```

`npm run dev`는 React 프런트엔드만 실행합니다. Pages Functions까지 시험하려면 `npm run build` 다음 `npx wrangler pages dev dist`를 사용하세요. 인증 Secret을 테스트 환경에 등록해야 실제 관리자 호출이 동작합니다.

`.gitignore`는 `private/`, `.dev.vars`, `.wrangler/` 등을 제외합니다. 전용 IAM 서비스 계정 키를 공개 저장소에 올리면 안 됩니다.

## 후속 작업

공지/인수인계 자료, When2meet, 장비 대여/승인, 회계 및 관리자 비밀번호 초기화는 아직 미리보기 또는 후속 작업입니다. 인수인계 메뉴는 접근 여부만 반영하고 문서 CRUD는 별도 구현해야 합니다.
