-- Запустіть цей SQL у Supabase Dashboard → SQL Editor → New query
-- Він створює таблицю замовлень з усіма потрібними полями

create table if not exists orders (
  id            bigserial primary key,               -- унікальний номер замовлення
  created_at    timestamptz default now() not null,  -- дата і час подачі заявки
  first_name    text        not null,                -- ім'я клієнта
  last_name     text        not null,                -- прізвище клієнта
  phone         text        not null,                -- номер телефону
  cleaning_type text        not null,                -- тип клінінгу
  comment       text,                               -- коментар (може бути порожнім)
  status        text        not null default 'new'   -- статус: new | in_progress | done
);

-- Відключаємо публічний доступ (дані видно тільки через Service Role Key,
-- який є тільки у вашій Edge Function)
alter table orders enable row level security;

-- Дозволяємо Edge Function (service role) писати в таблицю
create policy "Service role can insert orders"
  on orders for insert
  to service_role
  with check (true);

create policy "Service role can select orders"
  on orders for select
  to service_role
  using (true);
