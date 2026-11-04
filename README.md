# 익명 소리함 (Anonymous Complaint & Improvement Board) 📢

사용자가 개인 신원 노출 걱정 없이 자유롭게 불만 및 개선 건의사항을 등록하고, 운영팀의 공식 답변을 대화형으로 받아볼 수 있는 **반응형 익명 게시판 웹 애플리케이션**입니다.

---

## 🌟 주요 핵심 기능

### 1. 🔍 [불만 바로 조회] 전용 메뉴
- 상단 네비게이션에 배치된 전용 메뉴를 통해 발급받은 **접수번호(Ticket #, 예: CMP-2026-F9A1)**로 자신의 불만 처리 현황을 원클릭으로 바로 조회할 수 있습니다.
- 실시간 접수 누적, 검토 대기, 답변 완료 현황 통계 카드 제공.
- 최근 조회한 접수번호를 기억하여 클릭 한 번으로 재조회 가능.

### 2. 💬 대화형 공식 답변 & 추가 문의 (Conversational Thread)
- 운영팀의 공식 답변이 등록된 후, 단발성으로 끝나지 않고 **카카오톡/메신저 스타일의 대화형(Chat UI) 스레드**로 추가 질의응답을 주고받을 수 있습니다.
- **작성자**: 등록 시 설정한 비밀번호 인증 후 추가 문의 메시지 전송 → 상태가 `추가 문의 접수`로 자동 변경되어 관리자가 누락 없이 확인.
- **운영팀(관리자)**: 관리자 모드에서 즉시 후속 답변 전송 → 상태가 `답변 완료`로 갱신.

### 3. 🛡️ 100% 완전 익명 보장 & 비밀글 옵션
- IP 주소나 사용자 계정 등 어떠한 개인 식별자도 저장하지 않습니다.
- 민감한 제보를 위한 **비밀글(비밀번호 잠금)** 기능 지원 (비밀번호를 입력한 작성자와 관리자만 본문 및 대화 열람 가능).

### 4. 👥 커뮤니티 소통 & 공감(좋아요)
- 공개글에 대해 동료들이 익명으로 **공감(좋아요)** 및 **익명 댓글**을 작성하여 지지와 의견을 표명할 수 있습니다.
- 최신순, 공감 많은 순, 조회수 순 정렬 및 카테고리/상태별 필터 지원.

### 5. 🔑 원클릭 간편 관리자 모드
- 상단 [관리자] 버튼 클릭 후 관리자 PIN(`1234`) 입력 시 즉시 관리자 권한 활성화.
- 관리자 권한으로 공식 답변 작성, 상태 변경(`접수대기` ↔ `처리중` ↔ `답변완료`), 부적절한 게시글 및 댓글 삭제 가능.

---

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, clsx
- **Backend / Database**: Supabase (PostgreSQL), `@supabase/supabase-js`
- **Fallback / Resilience**: Supabase 연동 전이거나 오프라인 환경에서도 즉시 완벽하게 동작하는 `LocalStorage Mock Adapter` 내장

---

## 🚀 실행 방법

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173`으로 접속합니다.

### 프로덕션 빌드 및 미리보기
```bash
npm run build
npm run preview
```

---

## 🗄️ 환경 변수 및 GitHub 연동

- **`.env.local`**: 실제 로컬 실행 시 사용되는 Supabase URL, Key, 관리자 PIN 설정 파일 (`.gitignore`에 포함되어 GitHub에 노출되지 않음).
- **`.env.example`**: GitHub 저장소 공개용 환경 변수 템플릿 파일.
- **`.gitignore`**: `node_modules`, `dist`, `.env*` 등 민감한 키와 대용량 빌드 파일이 원격 저장소에 올라가지 않도록 안전하게 설정되어 있습니다.

### GitHub 업로드 (커밋 & 푸시) 명령어
```bash
git add .
git commit -m "feat: 익명 불만 접수 및 대화형 답변 게시판 초기 구축"
git branch -M main
git remote add origin <사용자_깃허브_레포지토리_URL>
git push -u origin main
```

---

## 🗄️ Supabase 데이터베이스 설정 안내

프로젝트 내 `supabase/schema.sql` 파일에 테이블 생성 및 RLS 보안 정책 DDL이 포함되어 있습니다.
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인합니다.
2. 프로젝트의 **SQL Editor**로 이동합니다.
3. `supabase/schema.sql`의 내용을 붙여넣고 **Run**을 실행하면 모든 테이블(`complaints`, `conversation_messages`, `comments`)과 실시간 정책이 즉시 구성됩니다.

