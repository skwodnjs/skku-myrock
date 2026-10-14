# 모여락 홈페이지

성균관대학교 중앙 밴드 동아리 **모여락** 홈페이지. React + Vite + Firebase Hosting / Authentication / Firestore / Cloud Functions.

## 로컬 실행

Node.js 22 또는 24 권장.

```bash
npm install
npm run build
npm run dev
```

GitHub `main`에 푸시하면 기존 GitHub Actions가 **Hosting만** 배포합니다.
**Cloud Functions와 Firestore Rules는 자동 배포되지 않습니다.** 서버를 배포하기 전 회원 관리 화면에서는 연결 오류가 표시됩니다.

## 새 회원 관리 기능 배포 (최초 한 번)

1. Firebase Authentication → 로그인 방법에서 이메일/비밀번호 사용.
2. Firebase Cloud Functions를 사용하려면 **Blaze(사용량 기반) 요금제**와 필요한 Google Cloud API 활성화가 필요할 수 있습니다. 요금/할당량을 검토해 주세요.
3. 프로젝트 폴더에서 Firebase CLI로 로그인:
   ```bash
   npx firebase-tools login
   npx firebase-tools use skku-myrock
   ```
   `firebase use`가 필요 없다면 `--project`를 지정해도 됩니다.
4. 프로젝트의 최신 코드 가져오기: `git pull --ff-only origin main`. 작업 중인 로컬 파일이 있다면 `git status`로 먼저 확인하고 충돌을 해결하세요. `private/`에 보관된 개인 정보는 Git에 올리지 마세요.
5. Cloud Functions 의존성 설치 및 서버 배포:
   ```bash
   npm --prefix functions install
   npm --prefix functions run check
   npx firebase-tools deploy --only functions --project skku-myrock
   ```
6. Firestore 규칙이 이미 배포되어 있더라도 변경된 버전을 적용해야 할 때는 **기존 데이터 및 규칙을 검토한 뒤**:
   ```bash
   npx firebase-tools deploy --only firestore:rules --project skku-myrock
   ```
   현재 규칙은 본인 프로필 `get`과 세션 수정만 허용하며, 타인 명단은 브라우저에서 직접 조회할 수 없습니다. 서버 함수만 관리자 권한으로 조회합니다.

이 프로젝트의 Function 지역은 `asia-northeast3`(서울)이며 런타임은 Node.js 22입니다.

## 회원 로그인과 비밀번호 변경

- 홈페이지는 **학번 10자리 + 비밀번호**로 로그인합니다.
- 실제 Firebase Auth 이메일은 `학번@members.skku-myrock.firebaseapp.com` 형태의 **수신 불가능한 로그인 전용 식별자**입니다.
- 로그인 후 **내 정보 → 비밀번호 변경**에서 현재 비밀번호로 재인증 후 새 비밀번호(12자 이상)를 지정합니다.
- 초기 비밀번호를 잊은 회원의 관리자 초기화 UI는 아직 구현되지 않았습니다. 로그인용 가상 이메일은 비밀번호 재설정 메일을 수신하지 못합니다.
- 비밀번호 원문은 Firestore에 저장하지 않습니다.

## 회장단 회원 관리

권한은 기수와 무관하게 **관리자가 수동 설정**합니다.

- `role`: `member`(일반부원), `part_leader`(파트장), `staff`(실무단), `president`(회장단)
- `handoverAccess`: 운영 역할과 별개로 인수인계 접근 권한을 표시하는 boolean
- `generation`: 예를 들어 `27.5`; 어떤 권한도 자동 부여·회수하지 않음
- `positions`: 표시용 직책 문자열 배열; 권한 판정에 사용하지 않음

로그인한 회장단은 **회원 관리**에서 다음을 할 수 있습니다.

- 회원 목록 조회/검색(100명씩 불러오기)
- CSV 파일로 1~60명 등록, 중복 학번 건너뛰기
- 직접 한 명 등록
- 기존 회원의 `role`, `handoverAccess`, `positions` 수정

신규 회원은 항상 `role: member`, `handoverAccess: false`로 생성됩니다.
권한 변경은 Firebase Cloud Functions 서버가 사용자 프로필을 다시 확인합니다.
본인 계정과 기존 최고관리자 계정은 웹에서 권한을 수정하지 못합니다.
**홈페이지에는 새로운 `superadmin` 권한을 부여하는 기능이 없습니다.** 최초 관리자 설정용 스크립트도 공개 저장소에 포함하지 않습니다. 현재의 기존 최고관리자 계정은 유지합니다.

### CSV 형식

양식은 회원 관리 화면에서 다운로드할 수 있습니다. UTF-8 CSV를 사용하세요.

```csv
학번,이름,기수,세션,직책
2026300001,예시회원,29,기타|베이스,
```

- 필수 열: 학번/이름/기수/세션; 직책은 선택 사항입니다.
- 영문 헤더 `studentId,name,generation,sessions,positions`도 지원합니다.
- 여러 세션이나 직책은 `|`로 구분합니다. 쉼표가 들어 있는 셀은 CSV 규칙에 맞게 큰따옴표로 감싸세요.
- 등록 전에 미리보기로 데이터를 확인할 수 있습니다.
- **새로 생성된 회원의 초기 비밀번호는 결과 화면에서 한 번만 CSV로 저장**할 수 있습니다. 파일은 민감 정보이므로 GitHub에 업로드하거나 공개 공유하지 말고, 각각의 회원에게 개별로 전달한 뒤 안전하게 삭제하세요.
- 일부 계정만 생성된 상태에서 요청이 실패할 수 있습니다. 결과를 확인한 뒤 기존 계정 중복 여부를 고려해 재시도하세요. 초기 비밀번호는 다시 표시되지 않습니다.

## 기존 일회성 로컬 등록 스크립트

`scripts/provision-members.mjs`는 데이터 복구 및 개발 초기 설정용으로 유지합니다.
`private/members.json`만 사용하며, 기본값은 검증 전용입니다.

```bash
node scripts/provision-members.mjs private/members.json
# 관리자 인증이 있는 로컬 환경에서만 실제 생성:
node scripts/provision-members.mjs private/members.json --apply
```

`GOOGLE_APPLICATION_CREDENTIALS`를 사용하는 경우 서비스 계정 JSON은 프로젝트 바깥의 안전한 위치에 보관하세요.
`private/`, `*service-account*.json`, `*credentials*.csv`는 Git에서 제외되어 있습니다.

기존 등록 스크립트 또한 역할과 비밀번호를 임의 변경하지 않습니다. **직접 학번을 바꾸는 것**은 아직 지원되지 않으며, 학번 변경 시 Firebase Auth의 내부 이메일과 Firestore `studentId`를 같은 UID에 대해 함께 변경해야 합니다.

## 아직 구현되지 않은 범위

회원 비밀번호 관리자 초기화, 회원 학번 수정, 인수인계 문서 CRUD, 공지·포토존 작성, 합주 시간표, 장비대여, 회계 등은 후속 작업입니다.
인수인계 메뉴는 `handoverAccess` 또는 운영 역할로 표시되지만 실제 자료 기능은 미리보기입니다.
운영 기능을 추가할 때도 각 API에 **서버 측 권한 검증**을 적용해야 합니다.
