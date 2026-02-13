# EasyLunch Deployment Guide (Vercel)

이 문서는 EasyLunch(이지런치) 프로젝트를 Vercel에 배포하는 방법을 설명합니다.

## 1. Vercel 연결
1. [Vercel](https://vercel.com)에 로그인합니다.
2. 대시보드에서 **"Add New..."** -> **"Project"**를 클릭합니다.
3. GitHub 레포지토리를 연결하고 `EzLunch` 프로젝트를 Import 합니다.

## 2. 환경 변수 설정 (Environment Variables)
Vercel 프로젝트 설정의 **Settings > Environment Variables** 메뉴에서 다음 변수들을 추가해야 합니다.

| 변수명 | 설명 | 예시 값 |
|---|---|---|
| `DATABASE_URL` | Neon DB 접속 주소 | `postgresql://...?sslmode=require` |
| `KAKAO_API_KEY` | 카카오 REST API 키 | `abcdef123456...` |
| `JWT_SECRET` | 세션/토큰 암호화 키 (임의의 문자열) | `super-secret...` |
| `ADMIN_USER` | 관리자 아이디 | `myadmin` |
| `ADMIN_PASSWORD` | 관리자 비밀번호 | `mypassword123!` |

> **중요**: 로컬 `.env` 파일 내용은 보안상 커밋되지 않을 수 있으니, Vercel에 직접 입력해야 합니다.

## 3. Build & Output Settings
Next.js 프로젝트는 Vercel이 자동으로 설정을 감지합니다. 별도 설정 불필요.

## 4. 배포 확인
설정이 완료되면 **Deploy** 버튼을 누릅니다.
배포 후 도메인(예: `ezlunch.vercel.app`)으로 접속하여 다음을 확인하세요:
1. 메인 페이지 로딩 확인.
2. 런치 룰렛 "시작하기" 클릭 시 "배달" 카테고리가 자동으로 추가되었는지 확인.
3. `ezlunch.vercel.app/admin` 접속 시 로그인 페이지로 이동하는지 확인.
