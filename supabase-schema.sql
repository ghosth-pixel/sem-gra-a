-- TIGELINHA • SUPABASE SCHEMA FINAL
-- Estrutura para produtos, planos de key, estoque, vendas, clientes e auditoria.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Admin',
  role text not null default 'admin' check (role in ('admin','staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('account','key')),
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  low_stock integer not null default 3,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cada produto de key pode ter vários planos independentes.
create table if not exists public.product_plans (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null check (label in ('Diário','Semanal','Mensal','Lifetime')),
  price numeric(12,2) not null default 0,
  discord text,
  delivery_template text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(product_id, label)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discord text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.stock (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  plan_id uuid references public.product_plans(id) on delete restrict,
  type text not null check (type in ('account','key')),
  username text,
  password text,
  email text,
  key_value text,
  validity text,
  price numeric(12,2) not null default 0,
  observation text,
  status text not null default 'available' check (status in ('available','reserved','sold','unavailable')),
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id text primary key,
  product_id uuid not null references public.products(id) on delete restrict,
  plan_id uuid references public.product_plans(id) on delete set null,
  stock_id uuid references public.stock(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  price numeric(12,2) not null default 0,
  payment text,
  status text not null default 'pending' check (status in ('delivered','pending','cancelled')),
  note text,
  delivery text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  detail text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id boolean primary key default true,
  store_name text not null default 'Tigelinha',
  support text,
  account_template text,
  key_template text,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name','Admin'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_plans enable row level security;
alter table public.clients enable row level security;
alter table public.stock enable row level security;
alter table public.sales enable row level security;
alter table public.audit_log enable row level security;
alter table public.settings enable row level security;

drop policy if exists "authenticated profiles" on public.profiles;
create policy "authenticated profiles" on public.profiles for all to authenticated using (true) with check (true);
drop policy if exists "authenticated products" on public.products;
create policy "authenticated products" on public.products for all to authenticated using (true) with check (true);
drop policy if exists "authenticated product plans" on public.product_plans;
create policy "authenticated product plans" on public.product_plans for all to authenticated using (true) with check (true);
drop policy if exists "authenticated clients" on public.clients;
create policy "authenticated clients" on public.clients for all to authenticated using (true) with check (true);
drop policy if exists "authenticated stock" on public.stock;
create policy "authenticated stock" on public.stock for all to authenticated using (true) with check (true);
drop policy if exists "authenticated sales" on public.sales;
create policy "authenticated sales" on public.sales for all to authenticated using (true) with check (true);
drop policy if exists "authenticated audit" on public.audit_log;
create policy "authenticated audit" on public.audit_log for all to authenticated using (true) with check (true);
drop policy if exists "authenticated settings" on public.settings;
create policy "authenticated settings" on public.settings for all to authenticated using (true) with check (true);

insert into public.settings (id, store_name)
values (true, 'Tigelinha')
on conflict (id) do nothing;

-- Antes de abrir acesso para funcionários, substitua as policies amplas por policies
-- baseadas em profiles.role e implemente a criação de venda/baixa de estoque via RPC.
