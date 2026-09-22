-- =====================================================================
--  DAPUR INA AINA  -  Skema Database (PostgreSQL / Supabase)
--  Sumber rancangan : Tugas LSP 2 (rancangan tabel) + Class Diagram Tugas LSP 1
--
--  CARA PAKAI
--  1. Buka Supabase Dashboard -> SQL Editor -> New query
--  2. Tempel seluruh isi file ini lalu klik "Run"
--  3. Script aman dijalankan ulang (idempotent), data tidak dihapus.
--  4. Daftar akun lewat halaman /register, lalu jadikan admin (lihat bagian
--     paling bawah file ini).
-- =====================================================================


-- =====================================================================
-- 1. ENUM
-- =====================================================================
do $$ begin
  create type public.user_role as enum ('USER', 'ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'processing', 'completed', 'canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('CASH', 'CASHLESS');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('PENDING', 'PAID', 'FAILED');
exception when duplicate_object then null; end $$;


-- =====================================================================
-- 2. TABEL
-- =====================================================================

-- 2.1 users
--   id mengacu ke auth.users (Supabase Auth). Kolom "password" tetap ada
--   sesuai rancangan: isinya salinan hash bcrypt dari Supabase Auth (bukan
--   password asli) dan TIDAK dapat dibaca lewat API (lihat bagian GRANT).
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        varchar(50)  not null,
  email       varchar(50)  not null unique,
  password    varchar(100) not null,
  role        public.user_role not null default 'USER',
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

-- 2.2 categories
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        varchar(100) not null unique,
  description text,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

-- 2.3 products
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  id_category uuid not null references public.categories (id) on delete restrict,
  name        varchar(100) not null,
  description text,
  price       numeric(12,2) not null check (price >= 0),
  image_url   varchar(255),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_products_category on public.products (id_category);

-- 2.4 stocks  (relasi 1 : 1 dengan products)
create table if not exists public.stocks (
  id          uuid primary key default gen_random_uuid(),
  id_product  uuid not null unique references public.products (id) on delete cascade,
  name        varchar(100) not null,
  quantity    integer not null default 0 check (quantity >= 0),
  updated_at  timestamptz not null default now()
);

-- 2.5 orders
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  id_user      uuid not null references public.users (id) on delete restrict,
  order_date   timestamptz not null default now(),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  status       public.order_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_orders_user   on public.orders (id_user);
create index if not exists idx_orders_date   on public.orders (order_date);
create index if not exists idx_orders_status on public.orders (status);

-- 2.6 order_details
create table if not exists public.order_details (
  id          uuid primary key default gen_random_uuid(),
  id_order    uuid not null references public.orders (id) on delete cascade,
  id_product  uuid not null references public.products (id) on delete restrict,
  quantity    integer not null check (quantity > 0),
  price       numeric(12,2) not null check (price >= 0),
  subtotal    numeric(12,2) not null check (subtotal >= 0)
);
create index if not exists idx_order_details_order   on public.order_details (id_order);
create index if not exists idx_order_details_product on public.order_details (id_product);

-- 2.7 payments  (relasi 1 : 1 dengan orders)
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  id_order       uuid not null unique references public.orders (id) on delete cascade,
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'PENDING',
  amount         numeric(12,2) not null check (amount >= 0),
  paid_at        timestamptz,            -- terisi saat pembayaran berstatus PAID
  created_at     timestamptz not null default now()
);


-- =====================================================================
-- 3. FUNCTION & TRIGGER DASAR
-- =====================================================================

-- 3.1 updated_at otomatis
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at      on public.users;
drop trigger if exists trg_categories_updated_at on public.categories;
drop trigger if exists trg_products_updated_at   on public.products;
drop trigger if exists trg_stocks_updated_at     on public.stocks;
drop trigger if exists trg_orders_updated_at     on public.orders;

create trigger trg_users_updated_at      before update on public.users      for each row execute function public.set_updated_at();
create trigger trg_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger trg_products_updated_at   before update on public.products   for each row execute function public.set_updated_at();
create trigger trg_stocks_updated_at     before update on public.stocks     for each row execute function public.set_updated_at();
create trigger trg_orders_updated_at     before update on public.orders     for each row execute function public.set_updated_at();

-- 3.2 Produk baru -> otomatis dibuatkan baris stok (jumlah 0)
create or replace function public.handle_new_product()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.stocks (id_product, name, quantity)
  values (new.id, new.name, 0)
  on conflict (id_product) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_products_after_insert on public.products;
create trigger trg_products_after_insert
  after insert on public.products
  for each row execute function public.handle_new_product();

-- 3.3 Nama produk berubah -> nama di tabel stocks ikut berubah
create or replace function public.sync_stock_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.name is distinct from old.name then
    update public.stocks set name = new.name where id_product = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_after_update on public.products;
create trigger trg_products_after_update
  after update of name on public.products
  for each row execute function public.sync_stock_name();

-- 3.4 Akun baru di Supabase Auth -> otomatis dibuatkan baris di public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, name, email, password, role)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)), 50),
    new.email,
    coalesce(new.encrypted_password, ''),
    'USER'                       -- role SELALU USER saat mendaftar
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3.5 Email / password berubah di Supabase Auth -> sinkronkan ke public.users
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users
     set email    = new.email,
         password = coalesce(new.encrypted_password, public.users.password)
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, encrypted_password on auth.users
  for each row execute function public.handle_user_updated();

-- 3.6 Isi ulang public.users untuk akun Auth yang sudah ada sebelum script ini dijalankan
insert into public.users (id, name, email, password, role)
select u.id,
       left(coalesce(nullif(trim(u.raw_user_meta_data ->> 'name'), ''), split_part(u.email, '@', 1)), 50),
       u.email,
       coalesce(u.encrypted_password, ''),
       'USER'
from auth.users u
on conflict (id) do nothing;

-- 3.7 Pemeriksa role admin (dipakai oleh RLS & function)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.role = 'ADMIN'
  );
$$;


-- =====================================================================
-- 4. FUNCTION BISNIS (dipanggil dari aplikasi lewat supabase.rpc)
-- =====================================================================

-- 4.1 Membuat pesanan: validasi stok, hitung harga di sisi server,
--     kurangi stok, buat order + order_details + payments dalam 1 transaksi.
--     p_items contoh: [{"product_id":"<uuid>","quantity":2}, ...]
create or replace function public.create_order(
  p_items          jsonb,
  p_payment_method public.payment_method
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_order_id uuid;
  v_total    numeric(12,2) := 0;
  v_sub      numeric(12,2);
  r          record;
  v_name     text;
  v_price    numeric(12,2);
  v_active   boolean;
  v_stock    integer;
begin
  if v_uid is null then
    raise exception 'Anda harus login terlebih dahulu.' using errcode = '28000';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang masih kosong.';
  end if;

  if not exists (select 1 from public.users where id = v_uid) then
    raise exception 'Akun tidak ditemukan.';
  end if;

  insert into public.orders (id_user, total_amount, status)
  values (v_uid, 0, 'pending')
  returning id into v_order_id;

  for r in
    select (x ->> 'product_id')::uuid   as product_id,
           sum((x ->> 'quantity')::int) as qty
    from jsonb_array_elements(p_items) as x
    group by 1
    order by 1
  loop
    if r.qty is null or r.qty <= 0 then
      raise exception 'Jumlah pesanan tidak valid.';
    end if;

    select p.name, p.price, p.is_active, s.quantity
      into v_name, v_price, v_active, v_stock
    from public.products p
    join public.stocks s on s.id_product = p.id
    where p.id = r.product_id
    for update of s;

    if not found then
      raise exception 'Menu tidak ditemukan.';
    end if;
    if not v_active then
      raise exception 'Menu "%" sedang tidak tersedia.', v_name;
    end if;
    if v_stock < r.qty then
      raise exception 'Stok "%" tidak mencukupi (tersisa %).', v_name, v_stock;
    end if;

    update public.stocks
       set quantity = quantity - r.qty::int
     where id_product = r.product_id;

    v_sub := v_price * r.qty;

    insert into public.order_details (id_order, id_product, quantity, price, subtotal)
    values (v_order_id, r.product_id, r.qty::int, v_price, v_sub);

    v_total := v_total + v_sub;
  end loop;

  update public.orders set total_amount = v_total where id = v_order_id;

  insert into public.payments (id_order, payment_method, payment_status, amount)
  values (v_order_id, p_payment_method, 'PENDING', v_total);

  return v_order_id;
end;
$$;

-- 4.2 (internal) Batalkan pesanan + kembalikan stok
create or replace function public._cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.order_status;
begin
  select o.status into v_status
  from public.orders o
  where o.id = p_order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan.';
  end if;
  if v_status = 'canceled' then
    return;
  end if;
  if v_status = 'completed' then
    raise exception 'Pesanan yang sudah selesai tidak dapat dibatalkan.';
  end if;

  update public.stocks s
     set quantity = s.quantity + d.qty
    from (
      select od.id_product, sum(od.quantity)::int as qty
      from public.order_details od
      where od.id_order = p_order_id
      group by od.id_product
    ) d
   where s.id_product = d.id_product;

  update public.orders set status = 'canceled' where id = p_order_id;

  update public.payments
     set payment_status = 'FAILED', paid_at = null
   where id_order = p_order_id
     and payment_status = 'PENDING';
end;
$$;

-- 4.3 Pelanggan membatalkan pesanannya sendiri (hanya saat masih "pending" & belum dibayar)
create or replace function public.cancel_my_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_status public.order_status;
  v_pay    public.payment_status;
begin
  if v_uid is null then
    raise exception 'Anda harus login terlebih dahulu.' using errcode = '28000';
  end if;

  select o.status into v_status
  from public.orders o
  where o.id = p_order_id and o.id_user = v_uid;

  if not found then
    raise exception 'Pesanan tidak ditemukan.';
  end if;
  if v_status <> 'pending' then
    raise exception 'Pesanan hanya dapat dibatalkan saat berstatus menunggu.';
  end if;

  select p.payment_status into v_pay
  from public.payments p
  where p.id_order = p_order_id;

  if v_pay = 'PAID' then
    raise exception 'Pesanan yang sudah dibayar tidak dapat dibatalkan. Silakan hubungi admin.';
  end if;

  perform public._cancel_order(p_order_id);
end;
$$;

-- 4.4 Admin: ubah stok (Tambah = stok masuk, Kurang = stok keluar)
create or replace function public.admin_adjust_stock(
  p_product_id uuid,
  p_action     text,      -- 'add' | 'reduce'
  p_quantity   integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current integer;
  v_new     integer;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;
  if p_action not in ('add', 'reduce') then
    raise exception 'Tindakan stok tidak valid.';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Jumlah harus lebih dari 0.';
  end if;

  select s.quantity into v_current
  from public.stocks s
  where s.id_product = p_product_id
  for update;

  if not found then
    raise exception 'Data stok produk tidak ditemukan.';
  end if;

  if p_action = 'add' then
    v_new := v_current + p_quantity;
  else
    if p_quantity > v_current then
      raise exception 'Stok keluar (%) melebihi stok tersedia (%).', p_quantity, v_current;
    end if;
    v_new := v_current - p_quantity;
  end if;

  update public.stocks set quantity = v_new where id_product = p_product_id;
  return v_new;
end;
$$;

-- 4.5 Admin: ubah status pesanan
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status   public.order_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old        public.order_status;
  v_pay_status public.payment_status;
  v_method     public.payment_method;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;

  select o.status into v_old
  from public.orders o
  where o.id = p_order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan.';
  end if;
  if v_old = p_status then
    return;
  end if;
  if v_old = 'canceled' then
    raise exception 'Pesanan yang sudah dibatalkan tidak dapat diubah.';
  end if;
  if v_old = 'completed' then
    raise exception 'Pesanan yang sudah selesai tidak dapat diubah.';
  end if;

  if p_status = 'canceled' then
    perform public._cancel_order(p_order_id);
    return;
  end if;

  if p_status = 'pending' then
    raise exception 'Status pesanan tidak dapat dikembalikan ke menunggu.';
  end if;

  if p_status = 'completed' then
    select p.payment_status, p.payment_method
      into v_pay_status, v_method
    from public.payments p
    where p.id_order = p_order_id;

    if v_pay_status is distinct from 'PAID' then
      if v_method = 'CASH' then
        -- pembayaran tunai dianggap lunas saat pesanan diserahkan
        update public.payments
           set payment_status = 'PAID', paid_at = now()
         where id_order = p_order_id;
      else
        raise exception 'Pembayaran non-tunai belum dikonfirmasi. Konfirmasi pembayaran terlebih dahulu.';
      end if;
    end if;
  end if;

  update public.orders set status = p_status where id = p_order_id;
end;
$$;

-- 4.6 Admin: ubah status pembayaran
create or replace function public.admin_update_payment_status(
  p_order_id uuid,
  p_status   public.payment_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_status public.order_status;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;

  select o.status into v_order_status
  from public.orders o
  where o.id = p_order_id;

  if not found then
    raise exception 'Pesanan tidak ditemukan.';
  end if;
  if v_order_status = 'canceled' then
    raise exception 'Pembayaran pesanan yang dibatalkan tidak dapat diubah.';
  end if;

  update public.payments
     set payment_status = p_status,
         paid_at = case when p_status = 'PAID' then coalesce(paid_at, now()) else null end
   where id_order = p_order_id;

  if not found then
    raise exception 'Data pembayaran tidak ditemukan.';
  end if;
end;
$$;

-- 4.7 Admin: ringkasan dashboard
create or replace function public.get_admin_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;

  v_result := jsonb_build_object(
    'orders_today', (
      select count(*) from public.orders o
      where (o.order_date at time zone 'Asia/Jakarta')::date = v_today
        and o.status <> 'canceled'
    ),
    'revenue_today', (
      select coalesce(sum(o.total_amount), 0)
      from public.orders o
      join public.payments p on p.id_order = o.id
      where (o.order_date at time zone 'Asia/Jakarta')::date = v_today
        and o.status <> 'canceled'
        and p.payment_status = 'PAID'
    ),
    'pending_orders',    (select count(*) from public.orders where status = 'pending'),
    'processing_orders', (select count(*) from public.orders where status = 'processing'),
    'active_products',   (select count(*) from public.products where is_active),
    'low_stock', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id_product', s.id_product, 'name', s.name, 'quantity', s.quantity)
          order by s.quantity, s.name
        ), '[]'::jsonb)
      from public.stocks s
      join public.products pr on pr.id = s.id_product
      where pr.is_active and s.quantity <= 5
    )
  );

  return v_result;
end;
$$;

-- 4.8 Admin: laporan penjualan
--     p_period : 'weekly' (per hari, Senin-Minggu) | 'monthly' (per hari) | 'yearly' (per bulan)
--     p_date   : tanggal acuan; periode yang memuat tanggal ini yang ditampilkan
--     "Penjualan" = pesanan yang tidak dibatalkan dan pembayarannya berstatus PAID.
create or replace function public.get_sales_report(
  p_period text,
  p_date   date default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ref    date := coalesce(p_date, (now() at time zone 'Asia/Jakarta')::date);
  v_start  date;
  v_end    date;      -- batas atas (eksklusif)
  v_step   interval;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;

  if p_period = 'weekly' then
    v_start := date_trunc('week', v_ref::timestamp)::date;
    v_end   := v_start + 7;
    v_step  := interval '1 day';
  elsif p_period = 'monthly' then
    v_start := date_trunc('month', v_ref::timestamp)::date;
    v_end   := (v_start + interval '1 month')::date;
    v_step  := interval '1 day';
  elsif p_period = 'yearly' then
    v_start := date_trunc('year', v_ref::timestamp)::date;
    v_end   := (v_start + interval '1 year')::date;
    v_step  := interval '1 month';
  else
    raise exception 'Periode tidak valid. Gunakan weekly, monthly, atau yearly.';
  end if;

  v_result := (
    with sold as (
      select o.id,
             o.total_amount,
             (o.order_date at time zone 'Asia/Jakarta') as local_ts
      from public.orders o
      join public.payments p on p.id_order = o.id
      where o.status <> 'canceled'
        and p.payment_status = 'PAID'
        and (o.order_date at time zone 'Asia/Jakarta') >= v_start::timestamp
        and (o.order_date at time zone 'Asia/Jakarta') <  v_end::timestamp
    ),
    buckets as (
      select gs::date as bucket
      from generate_series(v_start::timestamp, (v_end - 1)::timestamp, v_step) as gs
    ),
    series as (
      select b.bucket,
             count(s.id)                        as orders,
             coalesce(sum(s.total_amount), 0)   as revenue
      from buckets b
      left join sold s
        on (case when p_period = 'yearly'
                 then date_trunc('month', s.local_ts)::date
                 else s.local_ts::date end) = b.bucket
      group by b.bucket
    ),
    top_items as (
      select pr.name,
             sum(od.quantity)::int as qty,
             sum(od.subtotal)      as revenue
      from public.order_details od
      join sold s on s.id = od.id_order
      join public.products pr on pr.id = od.id_product
      group by pr.name
      order by sum(od.quantity) desc, pr.name
      limit 5
    )
    select jsonb_build_object(
      'period',        p_period,
      'start_date',    v_start,
      'end_date',      v_end - 1,
      'total_orders',  (select count(*) from sold),
      'total_revenue', (select coalesce(sum(total_amount), 0) from sold),
      'series', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('bucket', bucket, 'orders', orders, 'revenue', revenue)
            order by bucket
          ), '[]'::jsonb)
        from series
      ),
      'top_products', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('name', name, 'quantity', qty, 'revenue', revenue)
            order by qty desc, name
          ), '[]'::jsonb)
        from top_items
      )
    )
  );

  return v_result;
end;
$$;


-- =====================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================================
alter table public.users         enable row level security;
alter table public.categories    enable row level security;
alter table public.products      enable row level security;
alter table public.stocks        enable row level security;
alter table public.orders        enable row level security;
alter table public.order_details enable row level security;
alter table public.payments      enable row level security;

-- users
drop policy if exists users_select     on public.users;
drop policy if exists users_update_own on public.users;
create policy users_select on public.users
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy users_update_own on public.users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- categories
drop policy if exists categories_select      on public.categories;
drop policy if exists categories_admin_write on public.categories;
create policy categories_select on public.categories
  for select to authenticated using (true);
create policy categories_admin_write on public.categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- products
drop policy if exists products_select      on public.products;
drop policy if exists products_admin_write on public.products;
create policy products_select on public.products
  for select to authenticated
  using (is_active or public.is_admin());
create policy products_admin_write on public.products
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- stocks (hanya baca; perubahan lewat function)
drop policy if exists stocks_select on public.stocks;
create policy stocks_select on public.stocks
  for select to authenticated using (true);

-- orders (hanya baca; pembuatan/perubahan lewat function)
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select to authenticated
  using (id_user = (select auth.uid()) or public.is_admin());

-- order_details
drop policy if exists order_details_select on public.order_details;
create policy order_details_select on public.order_details
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_details.id_order
        and o.id_user = (select auth.uid())
    )
  );

-- payments
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = payments.id_order
        and o.id_user = (select auth.uid())
    )
  );


-- =====================================================================
-- 6. HAK AKSES (GRANT / REVOKE)
-- =====================================================================
-- Pengunjung yang belum login tidak boleh menyentuh tabel apa pun.
revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Tabel yang hanya boleh diubah lewat function (security definer).
revoke insert, update, delete on public.stocks        from authenticated;
revoke insert, update, delete on public.orders        from authenticated;
revoke insert, update, delete on public.order_details from authenticated;
revoke insert, update, delete on public.payments      from authenticated;

-- users: kolom "password" (hash) & perubahan "role" tidak boleh lewat API.
revoke all on public.users from authenticated;
grant select (id, name, email, role, created_at, updated_at) on public.users to authenticated;
grant update (name) on public.users to authenticated;

-- Function: hanya user yang login yang boleh memanggil.
revoke all on function public.create_order(jsonb, public.payment_method)          from public, anon;
revoke all on function public.cancel_my_order(uuid)                               from public, anon;
revoke all on function public.admin_adjust_stock(uuid, text, integer)             from public, anon;
revoke all on function public.admin_update_order_status(uuid, public.order_status) from public, anon;
revoke all on function public.admin_update_payment_status(uuid, public.payment_status) from public, anon;
revoke all on function public.get_admin_dashboard()                               from public, anon;
revoke all on function public.get_sales_report(text, date)                        from public, anon;
revoke all on function public.is_admin()                                          from public, anon;

grant execute on function public.create_order(jsonb, public.payment_method)          to authenticated;
grant execute on function public.cancel_my_order(uuid)                               to authenticated;
grant execute on function public.admin_adjust_stock(uuid, text, integer)             to authenticated;
grant execute on function public.admin_update_order_status(uuid, public.order_status) to authenticated;
grant execute on function public.admin_update_payment_status(uuid, public.payment_status) to authenticated;
grant execute on function public.get_admin_dashboard()                               to authenticated;
grant execute on function public.get_sales_report(text, date)                        to authenticated;
grant execute on function public.is_admin()                                          to authenticated;

-- Function internal & trigger: tidak boleh dipanggil dari API.
revoke all on function public._cancel_order(uuid)      from public, anon, authenticated;
revoke all on function public.handle_new_product()     from public, anon, authenticated;
revoke all on function public.sync_stock_name()        from public, anon, authenticated;
revoke all on function public.handle_new_user()        from public, anon, authenticated;
revoke all on function public.handle_user_updated()    from public, anon, authenticated;
revoke all on function public.set_updated_at()         from public, anon, authenticated;


-- =====================================================================
-- 7. STORAGE : bucket foto menu
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "product_images_admin_insert" on storage.objects;
drop policy if exists "product_images_admin_update" on storage.objects;
drop policy if exists "product_images_admin_delete" on storage.objects;

create policy "product_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());


-- =====================================================================
-- 8. DATA AWAL (contoh) - hanya diisi jika tabel products masih kosong
-- =====================================================================
do $seed$
declare
  v_seed jsonb := '[
    {"cat":"Makanan","name":"Nasi Ayam Goreng","description":"Ayam goreng bumbu kuning dengan nasi hangat, lalapan, dan sambal terasi.","price":18000,"qty":30},
    {"cat":"Makanan","name":"Nasi Rendang","description":"Rendang sapi empuk berbumbu rempah, disajikan dengan nasi putih dan sayur.","price":25000,"qty":20},
    {"cat":"Makanan","name":"Soto Ayam","description":"Soto ayam kuah kuning dengan suwiran ayam, telur, dan soun.","price":16000,"qty":25},
    {"cat":"Makanan","name":"Gado-Gado","description":"Sayuran rebus, tahu, tempe, dan lontong dengan saus kacang khas rumahan.","price":15000,"qty":20},
    {"cat":"Makanan","name":"Nasi Uduk Komplit","description":"Nasi uduk gurih dengan telur balado, bihun, dan tempe orek.","price":17000,"qty":25},
    {"cat":"Makanan","name":"Mie Goreng Spesial","description":"Mie goreng bumbu rempah dengan telur, sayuran, dan bakso.","price":15000,"qty":20},
    {"cat":"Menu Tambahan","name":"Telur Dadar","description":"Telur dadar tebal, digoreng garing di pinggir.","price":5000,"qty":40},
    {"cat":"Menu Tambahan","name":"Tempe Goreng","description":"Tiga potong tempe goreng tepung yang renyah.","price":4000,"qty":50},
    {"cat":"Menu Tambahan","name":"Kerupuk","description":"Kerupuk putih renyah, porsi satu bungkus.","price":3000,"qty":60},
    {"cat":"Menu Tambahan","name":"Sambal Terasi Extra","description":"Tambahan sambal terasi pedas segar.","price":2000,"qty":60},
    {"cat":"Menu Tambahan","name":"Nasi Putih","description":"Nasi putih hangat, satu porsi.","price":4000,"qty":60},
    {"cat":"Minuman","name":"Es Teh Manis","description":"Teh manis dingin segar.","price":4000,"qty":60},
    {"cat":"Minuman","name":"Es Jeruk","description":"Perasan jeruk asli dengan es batu.","price":6000,"qty":40},
    {"cat":"Minuman","name":"Teh Panas","description":"Teh panas manis atau tawar sesuai selera.","price":3000,"qty":50},
    {"cat":"Minuman","name":"Kopi Hitam","description":"Kopi tubruk hitam yang harum.","price":5000,"qty":40},
    {"cat":"Minuman","name":"Es Kopi Susu","description":"Kopi susu gula aren dingin.","price":12000,"qty":30}
  ]'::jsonb;
begin
  if exists (select 1 from public.products) then
    return;
  end if;

  insert into public.categories (name, description) values
    ('Makanan',       'Hidangan utama khas Dapur Ina Aina'),
    ('Menu Tambahan', 'Lauk dan pelengkap untuk hidangan utama'),
    ('Minuman',       'Minuman dingin dan panas')
  on conflict (name) do nothing;

  insert into public.products (id_category, name, description, price)
  select c.id, x.name, x.description, x.price
  from jsonb_to_recordset(v_seed)
         as x(cat text, name text, description text, price numeric, qty int)
  join public.categories c on c.name = x.cat;

  update public.stocks st
     set quantity = x.qty
    from public.products p
    join jsonb_to_recordset(v_seed)
           as x(cat text, name text, description text, price numeric, qty int)
      on x.name = p.name
   where st.id_product = p.id;
end
$seed$;


-- =====================================================================
-- 9. MEMBUAT AKUN ADMIN
-- =====================================================================
-- Semua akun yang mendaftar lewat aplikasi otomatis berperan USER.
-- Untuk menjadikan sebuah akun sebagai ADMIN:
--   1) Daftar dulu lewat halaman /register di aplikasi
--   2) Jalankan query di bawah (ganti emailnya), lalu login ulang
--
--   update public.users set role = 'ADMIN' where email = 'admin@contoh.com';
