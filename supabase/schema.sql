-- Run in the Supabase SQL Editor. This schema is safe to re-run.
create extension if not exists pgcrypto;

-- Keep the previous anonymous-board comments if this project is upgraded in place.
do $$
begin
  if to_regclass('public.comments') is not null
    and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'comments' and column_name = 'post_id'
    )
    and to_regclass('public.complaint_comments_legacy') is null then
    execute 'alter table public.comments rename to complaint_comments_legacy';
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '회원',
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  is_admin_only boolean not null default false,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.boards
  add column if not exists is_anonymous boolean not null default false;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  content text not null check (length(trim(content)) > 0),
  is_notice boolean not null default false,
  is_hidden boolean not null default false,
  is_anonymous boolean not null default false,
  view_count integer not null default 0 check (view_count >= 0),
  like_count integer not null default 0 check (like_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts
  add column if not exists is_sample boolean not null default false;

alter table public.posts
  add column if not exists is_anonymous boolean not null default false;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  is_hidden boolean not null default false,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.comments
  add column if not exists is_sample boolean not null default false;

alter table public.comments
  add column if not exists is_anonymous boolean not null default false;

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  file_path text not null unique,
  file_name text not null,
  file_size bigint not null check (file_size >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  message text not null,
  target_url text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reason text not null check (length(trim(reason)) > 0),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.reports
  add column if not exists is_sample boolean not null default false;

create index if not exists posts_board_created_idx on public.posts(board_id, created_at desc);
create index if not exists posts_board_likes_idx on public.posts(board_id, like_count desc);
create unique index if not exists posts_sample_title_unique_idx
  on public.posts(board_id, title) where is_sample;
create index if not exists comments_post_created_idx on public.comments(post_id, created_at);
create unique index if not exists comments_sample_content_unique_idx
  on public.comments(post_id, content) where is_sample;
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
create unique index if not exists reports_sample_target_unique_idx
  on public.reports(target_type, target_id) where is_sample;
create index if not exists attachments_post_idx on public.attachments(post_id);

create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = (select auth.uid()) $$;

create or replace function public.has_role(allowed_roles text[])
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.current_profile_role() = any(allowed_roles), false) $$;

create or replace function public.is_profile_suspended()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select is_suspended from public.profiles where id = (select auth.uid())), false) $$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public
as $$ select public.has_role(array['moderator', 'admin']) $$;

create or replace function public.seed_community_examples(seed_author_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('moaboard-community-examples-v1'));

  if not exists (select 1 from public.profiles where id = seed_author_id) then
    return;
  end if;

  insert into public.boards (title, description)
  select sample.title, sample.description
  from (values
    ('일상 라운지', '일상과 관심사를 편하게 나누는 공간입니다.'),
    ('업무·생활 제안', '함께 개선하고 싶은 업무와 생활 아이디어를 나눠 주세요.'),
    ('업무 제안', '업무 방식과 협업 환경을 더 좋게 만들 아이디어를 나눠 주세요.'),
    ('생활 제안', '일상과 생활 환경에 대한 제안과 경험을 나눠 주세요.'),
    ('IT 게시판', '기술, 기기, 소프트웨어와 IT 관련 정보를 나눠 주세요.'),
    ('대나무숲', '이름을 드러내지 않고 편하게 생각과 고민을 나누는 공간입니다.'),
    ('자유게시판', '주제 제한 없이 자유롭게 이야기해 보세요.'),
    ('익명 게시판', '작성자 이름을 표시하지 않고 편하게 이야기를 나눠 보세요.')
  ) as sample(title, description)
  where not exists (
    select 1 from public.boards existing
    where lower(existing.title) = lower(sample.title)
  );

  update public.boards
  set is_anonymous = true
  where lower(title) in (lower('대나무숲'), lower('익명 게시판'));

  insert into public.posts (board_id, author_id, title, content, is_sample, is_anonymous, created_at, updated_at)
  select board.id, seed_author_id, sample.title, sample.content, true, false,
    now() - make_interval(hours => sample.age_hours),
    now() - make_interval(hours => sample.age_hours)
  from (values
    (
      '업무·생활 제안',
      '휴게실 커피 머신 점검 및 원두 분쇄 조정 제안',
      '휴게실 커피 머신 추출이 중간에 멈추거나 커피 맛이 평소보다 연해진 것 같아요. 필터와 분쇄 상태를 점검하고 정기 관리 일정을 안내하면 이용에 도움이 될 것 같습니다.',
      28
    ),
    (
      '업무·생활 제안',
      '원격 근무 시간대의 VPN 연결 안정성 개선 아이디어',
      '원격 근무자가 많은 시간대에 사내 서비스 연결이 느려지거나 VPN이 간헐적으로 끊기는 경우가 있습니다. 이용이 집중되는 시간대의 회선 상태를 확인하고 개선 계획을 공유해 주시면 좋겠습니다.',
      48
    ),
    (
      '업무·생활 제안',
      '주간 업무 보고서의 중복 항목을 줄여 보면 어떨까요?',
      '주간 보고서 내용 중 프로젝트 관리 도구에 이미 등록된 진행 상황과 겹치는 항목이 많습니다. 기존 자료를 활용해 반복 입력을 줄이고, 주요 결과와 다음 주 계획 중심으로 간소화하면 어떨까요?',
      12
    ),
    (
      '업무·생활 제안',
      '야근 식대 지원 기준을 현실에 맞게 검토해 주세요',
      '주변 식사 비용이 오르면서 현재 야근 식대만으로는 선택할 수 있는 메뉴가 제한적입니다. 최근 물가와 실제 이용 현황을 살펴보고 지원 기준 조정을 검토해 주시면 감사하겠습니다.',
      3
    ),
    (
      '일상 라운지',
      '회의실 예약 후 미사용을 줄이는 방법을 제안합니다',
      '회의실을 예약했지만 일정이 바뀌어 사용하지 못하는 경우가 종종 있습니다. 예약 취소를 더 쉽게 하고, 예약 시간 전 간단한 사용 확인 알림을 보내면 필요한 동료들이 공간을 다시 이용할 수 있을 것 같아요.',
      72
    )
  ) as sample(board_title, title, content, age_hours)
  join public.boards board on lower(board.title) = lower(sample.board_title)
  where not exists (
    select 1 from public.posts existing
    where existing.board_id = board.id
      and existing.title = sample.title
      and existing.is_sample
  )
  on conflict (board_id, title) where is_sample do nothing;

  insert into public.comments (post_id, author_id, content, is_sample, is_anonymous)
  select post.id, seed_author_id,
    '예시 댓글입니다. 제안에 공감해요. 점검 결과와 관리 일정도 함께 안내되면 좋겠습니다.',
    true, false
  from public.posts post
  where post.is_sample
    and post.title = '휴게실 커피 머신 점검 및 원두 분쇄 조정 제안'
  on conflict (post_id, content) where is_sample do nothing;

  insert into public.reports (reporter_id, target_type, target_id, reason, is_sample)
  select seed_author_id, 'post', post.id,
    '[예시 신고] 게시글 신고 검토 화면을 보여 주기 위한 데모 데이터입니다.',
    true
  from public.posts post
  where post.is_sample
    and post.title = '야근 식대 지원 기준을 현실에 맞게 검토해 주세요'
  on conflict (target_type, target_id) where is_sample
  do update set status = 'pending', reason = excluded.reason;

  insert into public.reports (reporter_id, target_type, target_id, reason, is_sample)
  select seed_author_id, 'comment', comment.id,
    '[예시 신고] 댓글 신고 검토 화면을 보여 주기 위한 데모 데이터입니다.',
    true
  from public.comments comment
  where comment.is_sample
    and comment.content = '예시 댓글입니다. 제안에 공감해요. 점검 결과와 관리 일정도 함께 안내되면 좋겠습니다.'
  on conflict (target_type, target_id) where is_sample
  do update set status = 'pending', reason = excluded.reason;
end;
$$;

revoke all on function public.seed_community_examples(uuid) from public;

create or replace function public.enforce_post_anonymity()
returns trigger language plpgsql set search_path = public
as $$
begin
  if exists (
    select 1 from public.boards board
    where board.id = new.board_id and board.is_anonymous
  ) then
    new.is_anonymous := true;
  end if;
  return new;
end;
$$;

drop trigger if exists force_anonymous_board_posts on public.posts;
create trigger force_anonymous_board_posts before insert or update of board_id, is_anonymous
on public.posts for each row execute function public.enforce_post_anonymity();

create or replace function public.enforce_comment_anonymity()
returns trigger language plpgsql set search_path = public
as $$
begin
  if exists (
    select 1
    from public.posts post
    join public.boards board on board.id = post.board_id
    where post.id = new.post_id
      and (post.is_anonymous or board.is_anonymous)
  ) then
    new.is_anonymous := true;
  end if;
  return new;
end;
$$;

drop trigger if exists force_anonymous_post_comments on public.comments;
create trigger force_anonymous_post_comments before insert or update of post_id, is_anonymous
on public.comments for each row execute function public.enforce_comment_anonymity();

create or replace function public.anonymize_existing_board_content()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.is_anonymous and not old.is_anonymous then
    update public.posts
    set is_anonymous = true
    where board_id = new.id and not is_anonymous;

    update public.comments
    set is_anonymous = true
    where post_id in (select id from public.posts where board_id = new.id)
      and not is_anonymous;
  end if;
  return new;
end;
$$;

drop trigger if exists anonymize_existing_board_content on public.boards;
create trigger anonymize_existing_board_content after update of is_anonymous
on public.boards for each row execute function public.anonymize_existing_board_content();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''), split_part(new.email, '@', 1), '회원')
  );
  perform public.seed_community_examples(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, nickname)
select
  id,
  coalesce(nullif(trim(raw_user_meta_data ->> 'nickname'), ''), split_part(email, '@', 1), '회원')
from auth.users
on conflict (id) do nothing;

do $$
declare seed_author_id uuid;
begin
  select id into seed_author_id
  from public.profiles
  order by (role = 'admin') desc, created_at asc
  limit 1;
  if seed_author_id is not null then
    perform public.seed_community_examples(seed_author_id);
  end if;
end;
$$;

create or replace function public.update_post_like_count()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  end if;
  update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  return old;
end;
$$;

create or replace function public.restrict_moderator_content_edits()
returns trigger language plpgsql set search_path = public
as $$
begin
  if public.has_role(array['moderator'])
    and not public.has_role(array['admin'])
    and old.author_id is distinct from (select auth.uid())
    and (to_jsonb(new) - 'is_hidden') is distinct from (to_jsonb(old) - 'is_hidden') then
    raise exception 'Moderators may only change the hidden status of other users'' content';
  end if;
  return new;
end;
$$;

drop trigger if exists restrict_moderator_post_edits on public.posts;
create trigger restrict_moderator_post_edits before update on public.posts
for each row execute function public.restrict_moderator_content_edits();
drop trigger if exists restrict_moderator_comment_edits on public.comments;
create trigger restrict_moderator_comment_edits before update on public.comments
for each row execute function public.restrict_moderator_content_edits();

drop trigger if exists post_like_count_changed on public.post_likes;
create trigger post_like_count_changed after insert or delete on public.post_likes
for each row execute function public.update_post_like_count();

create or replace function public.notify_post_author_of_comment()
returns trigger language plpgsql security definer set search_path = public
as $$
declare post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.author_id then
    insert into public.notifications (user_id, type, message, target_url)
    values (post_author, 'comment', '내 게시글에 새 댓글이 달렸습니다.', '/posts/' || new.post_id::text);
  end if;
  return new;
end;
$$;

drop trigger if exists notify_post_author_on_comment on public.comments;
create trigger notify_post_author_on_comment after insert on public.comments
for each row execute function public.notify_post_author_of_comment();

create or replace function public.is_valid_comment_parent(target_parent_id uuid, target_post_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.comments parent
    where parent.id = target_parent_id
      and parent.post_id = target_post_id
      and parent.parent_id is null
  );
$$;
revoke all on function public.is_valid_comment_parent(uuid, uuid) from PUBLIC, anon, authenticated;
grant execute on function public.is_valid_comment_parent(uuid, uuid) to authenticated;

create or replace function public.increment_post_view(target_post_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update public.posts as post
  set view_count = post.view_count + 1
  where post.id = target_post_id
    and (not post.is_hidden or post.author_id = (select auth.uid()) or public.is_staff())
    and exists (
      select 1 from public.boards b where b.id = post.board_id
        and (not b.is_admin_only or public.has_role(array['admin']))
    );
end;
$$;
grant execute on function public.increment_post_view(uuid) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.attachments enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public" on public.profiles for select using (true);
drop policy if exists "Users update their profile" on public.profiles;
create policy "Users update their profile" on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and role = public.current_profile_role()
  and is_suspended = public.is_profile_suspended()
);
drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles" on public.profiles for all to authenticated
using (public.has_role(array['admin'])) with check (public.has_role(array['admin']));

drop policy if exists "Public and admin-only boards" on public.boards;
create policy "Public and admin-only boards" on public.boards for select
using (not is_admin_only or public.has_role(array['admin']));
drop policy if exists "Admins manage boards" on public.boards;
create policy "Admins manage boards" on public.boards for all to authenticated
using (public.has_role(array['admin'])) with check (public.has_role(array['admin']));

drop policy if exists "Visible posts" on public.posts;
create policy "Visible posts" on public.posts for select
using (
  exists (
    select 1 from public.boards b where b.id = board_id
      and (not b.is_admin_only or public.has_role(array['admin']))
  )
  and (not is_hidden or author_id = (select auth.uid()) or public.is_staff())
);
drop policy if exists "Signed-in users create posts" on public.posts;
create policy "Signed-in users create posts" on public.posts for insert to authenticated
with check (
  author_id = (select auth.uid())
  and not public.is_profile_suspended()
  and not is_hidden
  and not is_sample
  and view_count = 0
  and like_count = 0
  and (not is_notice or public.is_staff())
  and exists (
    select 1 from public.boards b where b.id = board_id
      and (not b.is_admin_only or public.has_role(array['admin']))
  )
);
drop policy if exists "Authors edit their posts" on public.posts;
create policy "Authors edit their posts" on public.posts for update to authenticated
using (author_id = (select auth.uid()) and not is_hidden and not is_notice and not is_sample)
with check (
  author_id = (select auth.uid())
  and not public.is_profile_suspended()
  and not is_notice
  and not is_hidden
  and not is_sample
);
drop policy if exists "Staff moderate posts" on public.posts;
create policy "Staff moderate posts" on public.posts for update to authenticated
using (public.is_staff()) with check (public.is_staff());
drop policy if exists "Authors and staff delete posts" on public.posts;
create policy "Authors and staff delete posts" on public.posts for delete to authenticated
using ((author_id = (select auth.uid()) and not is_sample) or public.is_staff());

drop policy if exists "Visible comments" on public.comments;
create policy "Visible comments" on public.comments for select
using (
  (not is_hidden or author_id = (select auth.uid()) or public.is_staff())
  and exists (select 1 from public.posts p where p.id = post_id)
);
drop policy if exists "Signed-in users create comments" on public.comments;
create policy "Signed-in users create comments" on public.comments for insert to authenticated
with check (
  author_id = (select auth.uid())
  and not public.is_profile_suspended()
  and not is_hidden
  and not is_sample
  and exists (select 1 from public.posts p where p.id = post_id and not p.is_hidden)
  and (parent_id is null or public.is_valid_comment_parent(parent_id, post_id))
);
drop policy if exists "Authors edit their comments" on public.comments;
create policy "Authors edit their comments" on public.comments for update to authenticated
using (author_id = (select auth.uid()) and not is_hidden and not is_sample)
with check (author_id = (select auth.uid()) and not public.is_profile_suspended() and not is_hidden and not is_sample);
drop policy if exists "Staff moderate comments" on public.comments;
create policy "Staff moderate comments" on public.comments for update to authenticated
using (public.is_staff()) with check (public.is_staff());
drop policy if exists "Authors and staff delete comments" on public.comments;
create policy "Authors and staff delete comments" on public.comments for delete to authenticated
using ((author_id = (select auth.uid()) and not is_sample) or public.is_staff());

drop policy if exists "Likes are public" on public.post_likes;
create policy "Likes are public" on public.post_likes for select using (true);
drop policy if exists "Users like visible posts once" on public.post_likes;
create policy "Users like visible posts once" on public.post_likes for insert to authenticated
with check (
  user_id = (select auth.uid()) and not public.is_profile_suspended()
  and exists (select 1 from public.posts p where p.id = post_id and not p.is_hidden)
);
drop policy if exists "Users remove their likes" on public.post_likes;
create policy "Users remove their likes" on public.post_likes for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Visible post attachments" on public.attachments;
create policy "Visible post attachments" on public.attachments for select
using (exists (select 1 from public.posts p where p.id = post_id));
drop policy if exists "Authors manage attachments" on public.attachments;
drop policy if exists "Authors add attachments" on public.attachments;
create policy "Authors add attachments" on public.attachments for insert to authenticated
with check (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
);
drop policy if exists "Authors edit attachments" on public.attachments;
drop policy if exists "Authors and staff delete attachments" on public.attachments;
create policy "Authors and staff delete attachments" on public.attachments for delete to authenticated
using (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
  or public.is_staff()
);

drop policy if exists "Users read their notifications" on public.notifications;
create policy "Users read their notifications" on public.notifications for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "Users update their notifications" on public.notifications;
create policy "Users update their notifications" on public.notifications for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Reporters and staff read reports" on public.reports;
create policy "Reporters and staff read reports" on public.reports for select to authenticated
using (reporter_id = (select auth.uid()) or public.is_staff());
drop policy if exists "Signed-in users submit reports" on public.reports;
create policy "Signed-in users submit reports" on public.reports for insert to authenticated
with check (
  reporter_id = (select auth.uid()) and not public.is_profile_suspended()
  and (
    (target_type = 'post' and exists (select 1 from public.posts p where p.id = target_id))
    or (target_type = 'comment' and exists (select 1 from public.comments c where c.id = target_id))
  )
  and not is_sample
);
drop policy if exists "Staff resolve reports" on public.reports;
create policy "Staff resolve reports" on public.reports for update to authenticated
using (public.is_staff()) with check (public.is_staff());

-- Keep counters, ownership and parent references out of client-controlled UPDATEs.
revoke update on public.posts from anon, authenticated;
grant update (title, content, updated_at, is_notice, is_hidden, is_anonymous) on public.posts to authenticated;
revoke update on public.comments from anon, authenticated;
grant update (content, is_hidden) on public.comments to authenticated;
revoke update on public.notifications from anon, authenticated;
grant update (is_read) on public.notifications to authenticated;
revoke update on public.reports from anon, authenticated;
grant update (status) on public.reports to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'board-files', 'board-files', false, 10485760,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Read visible board files" on storage.objects;
create policy "Read visible board files" on storage.objects for select
using (
  bucket_id = 'board-files'
  and exists (select 1 from public.attachments a where a.file_path = name)
);
drop policy if exists "Authors upload board files" on storage.objects;
create policy "Authors upload board files" on storage.objects for insert to authenticated
with check (
  bucket_id = 'board-files'
  and exists (
    select 1 from public.posts p
    where p.id::text = split_part(name, '/', 1) and p.author_id = (select auth.uid())
  )
);
drop policy if exists "Authors and staff delete board files" on storage.objects;
create policy "Authors and staff delete board files" on storage.objects for delete to authenticated
using (
  bucket_id = 'board-files'
  and (
    public.is_staff()
    or exists (
      select 1 from public.posts p
      where p.id::text = split_part(name, '/', 1) and p.author_id = (select auth.uid())
    )
  )
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    execute 'alter publication supabase_realtime add table public.profiles';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end $$;
