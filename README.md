# MYROCK · 모여락

성균관대학교 밴드 동아리 모여락의 홈페이지 UI 초안입니다.

## 실행

```bash
npm install
npm run dev
```

## 배포

`main` 브랜치에 push하면 GitHub Actions에서 `npm install` → `npm run build`를 실행한 뒤 `dist/`를 기존 Firebase Hosting 프로젝트 `skku-myrock`에 배포합니다.

## 구현 범위

- 반응형 홈, 소개, 일정 조율, 공지사항, 포토존, 장비 대여, 회계, 인수인계, 회원 관리 화면
- 실제 사진 대신 `☒` 자리 표시자 사용
- 모바일 메뉴, 화면 이동, 예시 공지 필터, 로그인 모달 등의 UI 동작
- **현재 로그인, Firestore 저장, 일정 확정, 신청·승인 등은 연결되지 않은 화면 초안입니다.**

실제 회원 명단을 등록하기 전에 Firebase Authentication, Firestore Security Rules, Storage Rules, 권한 검증을 구현해야 합니다.
