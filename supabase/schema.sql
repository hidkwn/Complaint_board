-- ============================================================
-- 익명 소리함 & 개선 게시판 Database Schema
-- Supabase SQL Editor에 복사하여 실행하세요.
-- ============================================================

-- 1. UUID 확장 활성화 (기본 활성화되어 있음)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 불만/건의사항 메인 테이블 (complaints)
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '기타',
    author_alias TEXT NOT NULL DEFAULT '익명',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending'(접수대기), 'in_progress'(처리중), 'answered'(답변완료), 'follow_up'(추가문의)
    is_secret BOOLEAN NOT NULL DEFAULT false,
    password_hash TEXT NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 대화형 답변 및 추가 문의 스레드 테이블 (conversation_messages)
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'author')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 커뮤니티 익명 댓글 테이블 (comments)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    author_alias TEXT NOT NULL DEFAULT '익명',
    content TEXT NOT NULL,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_complaints_ticket_number ON complaints(ticket_number);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_conversation_complaint_id ON conversation_messages(complaint_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_complaint_id ON comments(complaint_id, created_at ASC);

-- Row Level Security (RLS) 설정
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 정책 설정: 누구나 읽기/쓰기 허용 (익명 서비스 특성)
CREATE POLICY "Public complaints select" ON complaints FOR SELECT USING (true);
CREATE POLICY "Public complaints insert" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Public complaints update" ON complaints FOR UPDATE USING (true);
CREATE POLICY "Public complaints delete" ON complaints FOR DELETE USING (true);

CREATE POLICY "Public conversation select" ON conversation_messages FOR SELECT USING (true);
CREATE POLICY "Public conversation insert" ON conversation_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Public comments select" ON comments FOR SELECT USING (true);
CREATE POLICY "Public comments insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public comments delete" ON comments FOR DELETE USING (true);

-- 실시간 구독(Realtime) 활성화 (선택 사항)
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

