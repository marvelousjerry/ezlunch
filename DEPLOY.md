# EzLunch 배포 및 데이터베이스 연동 가이드

완벽한 기능(위치 권한 + 데이터 영구 저장)을 위해 Vercel에 배포하고 데이터베이스를 연결하는 방법을 안내합니다.

## 1단계: GitHub에 코드 업로드

1.  GitHub에 로그인하고 **New Repository**를 클릭하여 새 저장소(`ezlunch`)를 만듭니다.
2.  프로젝트 폴더 터미널에서 아래 명령어를 실행합니다:

```bash
# 깃 초기화 및 커밋
git init
git add .
git commit -m "Complete project with Database"

# 원격 저장소 연결 및 업로드
git branch -M main
git remote add origin [당신의_새_저장소_주소_HTTPS]
git push -u origin main
```

## 2단계: Vercel 배포 및 DB 생성 (One-Click)

1.  [Vercel Dashboard](https://vercel.com/dashboard)로 이동합니다.
2.  **"Add New..."** -> **"Project"**를 클릭합니다.
3.  GitHub의 `ezlunch` 저장소를 선택하여 **Import**합니다.
4.  **"Storage"** 섹션을 찾아(혹은 배포 후 Settings에서) **"Connect Store"**를 클릭합니다.
5.  **"Postgres"**를 선택하고 **"Create New"**를 누릅니다.
    *   Region(지역)은 `Washington, D.C. (iad1)` 또는 가까운 곳을 선택합니다.
    *   생성 후 **"Connect"**를 눌러 프로젝트와 연결합니다.
6.  **"Environment Variables"**가 자동으로 설정됩니다. (`POSTGRES_PRISMA_URL` 등)
7.  **Deploy** 버튼을 눌러 프로젝트를 배포합니다.

## 3단계: 데이터베이스 초기화 (중요!)

DB는 생성되었지만 아직 텅 비어있습니다. 테이블(`Post`)을 만들어줘야 합니다.
Vercel 대시보드에서는 직접 명령어를 치기 어려우므로, 로컬에서 배포된 DB로 스키마를 밀어넣겠습니다.

1.  Vercel 프로젝트 페이지 -> **Storage** 탭 -> **Postgres** 선택 -> **.env.local** 탭 클릭
2.  **"Copy Snippet"**을 눌러 환경변수를 복사합니다.
3.  로컬 프로젝트 루트에 `.env` 파일을 만들고 붙여넣습니다.
4.  터미널에서 아래 명령어를 실행하여 DB 구조를 배포된 서버에 적용합니다:

```bash
npm exec prisma db push
```

## 4단계: 완료 및 확인

이제 Vercel이 제공한 주소(`https://ezlunch-xyz.vercel.app`)로 접속해보세요.
*   🔒 **HTTPS**가 적용되어 위치 권한 요청이 정상 작동합니다.
*   💾 게시글을 쓰면 **Postgres 데이터베이스**에 저장되어, 영원히 사라지지 않습니다.

---

### 로컬 개발 시 팁 (Local Development)

이제 로컬(`localhost:3000`)에서 실행할 때도 `.env` 파일에 있는 Vercel DB를 바라보게 됩니다.
즉, 로컬에서 글을 써도 배포된 사이트와 데이터가 공유됩니다. (개발하기 훨씬 편합니다!)
