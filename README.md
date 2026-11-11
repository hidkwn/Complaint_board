# 모아보드

React, Vite, Tailwind CSS, React Router, Lucide React, Supabase로 만든 권한 기반 커뮤니티 게시판입니다. 이메일 인증, 게시판/게시글/댓글, 파일 첨부, 추천, 신고·블라인드, 운영자 도구와 실시간 알림을 제공합니다.

## 로컬 실행

1. Supabase 프로젝트를 만들고 프로젝트 URL과 publishable key를 확인합니다.
2. `.env.example`을 `.env.local`로 복사한 뒤 값을 입력합니다.

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

3. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다. 회원가입 트리거, RLS 정책, `board-files` 비공개 버킷, 알림 Realtime 구독 및 예시 게시판·게시글이 구성됩니다.
4. 의존성을 설치하고 개발 서버를 실행합니다.

   ```bash
   npm install
   npm run dev
   ```

## 최초 관리자 설정

가입한 계정에 최초 관리자 권한을 부여하려면 Supabase SQL Editor에서 아래 쿼리의 이메일을 해당 계정으로 바꿔 실행합니다. 이 작업은 신뢰할 수 있는 프로젝트 관리자만 수행해야 합니다.

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

기존 프로젝트에 이미 가입한 계정이 있다면 `schema.sql`을 다시 실행해 예시 게시판, 게시글, 댓글과 신고 내역을 즉시 추가할 수 있습니다. 아직 가입자가 없다면 첫 회원가입 때 예시 데이터가 자동으로 생성됩니다. 예시 신고는 운영자 대시보드에서 **예시 신고**로 구분됩니다.

기본 게시판에는 업무·생활 제안, 업무 제안, 생활 제안, IT, 대나무숲, 자유게시판, 익명 게시판이 포함됩니다. 일반 게시판에서도 글 작성 시 익명 여부를 선택할 수 있습니다. 익명 게시판의 글과 댓글은 모든 이용자 화면에 `익명`으로 표시됩니다. 게시물 소유권과 운영 처리를 위해 작성자 ID는 내부 DB에 보관되며, 이 기능은 실명/이메일을 공개 화면에 표시하지 않는 익명 표시 기능입니다.

관리자 계정으로 로그인한 뒤 대시보드에서 게시판을 만들고 운영자 권한을 부여할 수 있습니다. 서비스 역할 키는 브라우저 환경 변수나 저장소에 넣지 마세요.

## 권한

- **비회원**: 공개 게시판 및 게시글 열람·검색.
- **일반 회원**: 게시글/댓글 작성, 본인 글·댓글 수정/삭제, 첨부 파일, 게시글 추천, 신고, 본인 알림 열람.
- **운영자**: 공지 작성, 게시글/댓글 블라인드 및 삭제, 신고 검토와 처리.
- **관리자**: 운영자 권한에 더해 게시판 관리, 역할 부여, 이용 정지 및 해제.

화면의 권한 제어는 편의 기능이며, 실제 접근 제어는 `supabase/schema.sql`의 RLS와 Storage 정책으로 강제됩니다. 신규 계정 역할은 데이터베이스 트리거가 `user`로 생성합니다.

## 웹으로 배포 (Vercel)

로컬 개발 서버(`npm run dev`)는 내 컴퓨터에서만 실행됩니다. 다른 사람도 인터넷으로 접속하려면 GitHub에 코드를 올리고 Vercel에 배포해야 합니다.

1. 변경된 코드를 GitHub 저장소에 push합니다. `.env.local`은 `.gitignore`에 포함되어 있으므로 업로드하지 않습니다.
2. [Vercel](https://vercel.com/)에 로그인하고 **Add New → Project**에서 GitHub 저장소를 가져옵니다.
3. Framework Preset은 **Vite**, Build Command는 `npm run build`, Output Directory는 `dist`로 둡니다.
4. 프로젝트 설정의 **Environment Variables**에 다음 두 값을 등록합니다. Production뿐 아니라 필요한 Preview 환경에도 설정합니다.
   - `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key
5. **Deploy**를 선택합니다. 배포가 완료되면 Vercel이 제공하는 `https://…vercel.app` 주소로 접속할 수 있습니다. GitHub에 새 변경사항을 push하면 다시 배포됩니다.
6. Supabase 대시보드의 **Authentication → URL Configuration**에서 Site URL을 Vercel 도메인으로 설정하고, Redirect URLs에도 `https://프로젝트.vercel.app/**`을 추가합니다. 커스텀 도메인을 쓰면 해당 도메인도 등록합니다.

싱글 페이지 앱 경로는 저장소의 `vercel.json`에서 처리합니다. 인터넷 배포 후 로그인·게시글 기능을 사용하려면 대상 Supabase 프로젝트에서 `supabase/schema.sql`도 실행되어 있어야 합니다.

## 데이터베이스 참고

`supabase/schema.sql`은 재실행할 수 있도록 작성했습니다. 기존 익명 게시판에서 사용하던 `public.comments` 테이블이 있으면 새 댓글 스키마와 충돌하지 않도록 `public.complaint_comments_legacy`로 보존합니다. 기존 민원 테이블과 데이터는 변경하거나 삭제하지 않습니다.


##웹 접속
https://complaint-board-six.vercel.app/

