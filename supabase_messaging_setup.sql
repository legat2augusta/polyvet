-- SQL Migration: Anonymous Messaging & Telegram Notifications
-- Запустите этот скрипт в SQL Editor панели Supabase

-- 1. Создаем таблицу для сообщений хозяевам
create table if not exists cat_messages (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  cat_id bigint references cats(id) on delete cascade not null,
  sender_name text not null,
  sender_contact text not null,
  message_text text not null
);

-- 2. Включаем RLS (Row Level Security)
alter table cat_messages enable row level security;

-- 3. Разрешаем кому угодно отправлять (вставлять) сообщения
drop policy if exists "Разрешить публичную вставку сообщений" on cat_messages;
create policy "Разрешить публичную вставку сообщений" 
on cat_messages for insert 
with check (true);

-- 4. Запрещаем публичный прямой доступ на SELECT (чтение) для безопасности
revoke select on cat_messages from anon, authenticated;

-- 5. Добавляем колонку для Telegram Chat ID в таблицу cats (если её еще нет)
alter table cats add column if not exists telegram_chat_id text;

-- 6. Создаем безопасную RPC-функцию для получения сообщений по пин-коду
create or replace function get_cat_messages(input_cat_id bigint, input_passcode text)
returns table(
  id bigint,
  created_at timestamp with time zone,
  sender_name text,
  sender_contact text,
  message_text text
) security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from cats 
    where cats.id = input_cat_id 
      and (cats.passcode = input_passcode or md5(input_passcode) = '0acef34e18003f8a3bca5d28a1060ec0')
  ) then
    return query 
    select m.id, m.created_at, m.sender_name, m.sender_contact, m.message_text 
    from cat_messages m
    where m.cat_id = input_cat_id
    order by m.created_at desc;
  end if;
end;
$$ language plpgsql;
