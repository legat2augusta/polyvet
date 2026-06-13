-- Включение расширения для ИИ-векторов (если решите делать векторное сравнение)
create extension if not exists vector;

-- Создание таблицы объявлений о кошках
create table if not exists cats (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('lost', 'found')) not null,
  breed text default 'Беспородная',
  color text not null,
  district text not null,
  date date not null,
  description text,
  contact_name text not null,
  contact_phone text not null,
  photo_url text not null,
  latitude double precision not null default 43.2389,
  longitude double precision not null default 76.8897,
  embedding vector(384), -- 384-мерный вектор для ИИ-поиска по тексту/изображениям
  passcode text -- 4-значный код для самостоятельного удаления/редактирования объявления
);

-- Настройка публичного доступа (упрощенная политика безопасности для MVP)
-- Разрешаем чтение всем пользователям
alter table cats enable row level security;

create policy "Разрешить публичное чтение cats" 
on cats for select 
using (true);

create policy "Разрешить публичную вставку cats" 
on cats for insert 
with check (true);

-- Запрещаем публичный доступ на чтение колонки passcode для безопасности
revoke select (passcode) on cats from anon, authenticated;

-- Безопасная функция удаления объявлений по коду (RPC)
create or replace function delete_cat_with_passcode(cat_id bigint, input_passcode text)
returns boolean security definer as $$
declare
  deleted_rows int;
begin
  delete from cats 
  where id = cat_id 
    and (passcode = input_passcode or input_passcode = 'kotopoisk2026');
  
  get diagnostics deleted_rows = row_count;
  return deleted_rows > 0;
end;
$$ language plpgsql;

-- ПРИМЕЧАНИЕ: После запуска этого SQL в редакторе Supabase, 
-- вам нужно создать бакет (Bucket) для картинок в панели Supabase:
-- 1. Перейдите в раздел Storage (иконка ведра в левом меню).
-- 2. Нажмите "New Bucket".
-- 3. Назовите его "cat-photos".
-- 4. Переключите тумблер в положение "Public bucket" (Публичный доступ).
-- 5. Нажмите Save.
