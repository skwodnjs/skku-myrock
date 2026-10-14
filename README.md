# 모여락 홈페이지

성균관대학교 **중앙 밴드 동아리 모여락** 웹사이트. React + TypeScript + Firebase Hosting / Authentication / Firestore.

## 개발

```bash
npm install
npm run dev
npm run build
```

`main`에 push하면 기존 GitHub Actions가 Firebase Hosting에 배포합니다. 데이터베이스 보안 규칙은 **자동 배포되지 않습니다**.

## 로그인 준비 (중요)

1. Firebase Console > Authentication > Sign-in method에서 **이메일/비밀번호** 로그인 사용 설정.
2. Firebase Console > Firestore Database에서 데이터베이스를 생성한 다음 `firestore.rules`를 검토하고 `firebase deploy --only firestore:rules --project skku-myrock` 실행. **기존 Firestore Rules를 대체**하므로 기존 컬렉션 접근에 미치는 영향을 반드시 검토하세요. 기본 정책은 users 본인 문서만 읽고 `sessions`만 수정할 수 있게 하며, 나머지 모든 접근은 거부합니다.
3. 운영진 명단은 공개 저장소에 커밋하지 않습니다. 별도 전달된 `members.json` 파일을 프로젝트의 `private/members.json`에 배치합니다.
4. 로컬 머신의 Firebase 관리자 인증을 준비합니다. 권장: `GOOGLE_APPLICATION_CREDENTIALS` 환경 변수로 안전하게 보관된 서비스 계정 JSON 경로 지정(서비스 계정 키를 저장소에 업로드하면 안 됩니다). Admin SDK와 프로젝트에 대한 Auth/Firestore 관리 권한이 있어야 합니다.
5. `node scripts/provision-members.mjs private/members.json`으로 내용 검증 후 `node scripts/provision-members.mjs private/members.json --apply`로 등록.
6. 생성된 `private/initial-credentials.csv`의 임시 비밀번호를 본인에게만 전달하고 안전하게 삭제합니다. **학번은 비밀번호로 사용하지 않습니다.** 비밀번호 재설정은 Firebase 관리자에게 요청해야 합니다.

로그인 화면에는 학번만 표시되고, 내부적으로 `학번@members.skku-myrock.firebaseapp.com` 형태의 로그인 전용 식별자를 사용합니다. 이는 실제 메일함이 아니며 이메일 비밀번호 찾기는 지원하지 않습니다. Firestore 프로필은 인증 UID로 조회하며 공개적인 학번 조회를 제공하지 않습니다.

초기 등록은 보안을 위해 **모두 일반부원(role=member)** 으로 생성됩니다. 직책(`positions`)은 표시용으로 보관되며 자동으로 관리자 권한이 되지 않습니다. 운영진 승격은 향후 관리 기능과 서버 측 권한 검증을 구현할 때 별도로 진행해야 합니다.

## 구현 범위

- 소개/소식/활동의 3개 상위 메뉴와 모바일 하위 메뉴
- 회원 로그인/로그아웃 및 본인 정보 조회
- 보컬·기타·베이스·드럼·키보드 세션 다중 선택 수정
- 운영 기능은 **UI 미리보기만 제공**. 다른 회원 조회/등록/권한 수정, When2meet, 공지 작성은 아직 없음

보안 규칙과 실제 회원 생성은 저장소 커밋만으로 자동 적용되지 않습니다.
