-- Run in Supabase SQL editor. Enables durable + realtime inventory with atomic holds.
create table if not exists ticket_types (
  id text primary key, code text unique not null, name text not null,
  price int not null, total_quantity int not null, remaining_quantity int not null,
  sales_open boolean default true, perks jsonb default '[]'
);
create table if not exists bookings (
  id text primary key, ticket_type_id text references ticket_types(id),
  event_session text not null, qty int not null, amount int not null,
  name text not null, phone text not null, email text not null,
  payment_status text default 'held', razorpay_order_id text,
  qr_code text, checked_in boolean default false, created_at timestamptz default now()
);
 -- Remove old ticket types: Group Pass (5 Entries), VIP, Season Pass (9 Nights)
 delete from bookings where ticket_type_id in ('t-group','t-vip','t-season','t-season-pass');
 delete from ticket_types where code in ('GROUP','VIP','SEASON');
 -- Upsert ticket types (prices updated): Single, Couple, Group of 3/5/9 + Rice
 insert into ticket_types (id, code, name, price, total_quantity, remaining_quantity, sales_open, perks) values
  ('t-single','SINGLE','Single',399,250,250,true,'["1 Garba night entry","Access to food stalls"]'),
  ('t-couple','COUPLE','Couple',749,200,200,true,'["2 entries, same night","Priority entry lane","1 free chaas each"]'),
  ('t-group3','GROUP3','Group of 3',1299,60,60,true,'["3 entries, same night","Dedicated group Garba circle","1 veg rice (for 1 person)"]'),
  ('t-group5','GROUP5','Group of 5',2299,50,50,true,'["5 entries, same night","Dedicated group Garba circle","2 veg rice (for 2 persons)"]'),
  ('t-group9','GROUP9','Group of 9',3999,40,40,true,'["9 entries, same night","Dedicated group Garba circle","3 veg rice (for 3 persons)"]'),
  ('t-group3-nr','GROUP3_NR','Group of 3 (No Rice)',1199,60,60,true,'["3 entries, same night","Dedicated group Garba circle","Without rice packet"]'),
  ('t-group5-nr','GROUP5_NR','Group of 5 (No Rice)',1999,50,50,true,'["5 entries, same night","Dedicated group Garba circle","Without rice packet"]'),
  ('t-group9-nr','GROUP9_NR','Group of 9 (No Rice)',3499,40,40,true,'["9 entries, same night","Dedicated group Garba circle","Without rice packet"]')
 on conflict (id) do update set
   code = excluded.code, name = excluded.name, price = excluded.price,
   total_quantity = excluded.total_quantity, remaining_quantity = excluded.remaining_quantity,
   sales_open = excluded.sales_open, perks = excluded.perks;

-- Atomic hold / release (prevents oversell under concurrency)
create or replace function hold_tickets(p_ticket_type_id text, p_qty int) returns boolean
language plpgsql as $$
declare r int;
begin
  update ticket_types set remaining_quantity = remaining_quantity - p_qty
  where id = p_ticket_type_id and sales_open and remaining_quantity >= p_qty
  returning remaining_quantity into r;
  return found;
end $$;

create or replace function release_tickets(p_ticket_type_id text, p_qty int) returns void
language plpgsql as $$
begin
  update ticket_types set remaining_quantity = least(total_quantity, remaining_quantity + p_qty)
  where id = p_ticket_type_id;
end $$;

-- Realtime was already enabled for ticket_types + bookings (original schema).

-- ============ Auth profiles (email/password users) ============
-- Run this block once in Supabase SQL editor.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  phone text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can read own profile" on profiles;
create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup from auth metadata (backup if client insert is blocked)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Bookings (add UPI ref column for zero-fee UPI flow) ============
alter table if exists bookings add column if not exists upi_txn_ref text;

-- Extra veg rice packets bought with group passes (₹149 each)
alter table if exists bookings add column if not exists rice_packets int default 0;

-- ============ Dynamic gallery ============
-- Also create a Storage bucket named "gallery" (public) in Dashboard -> Storage.
create table if not exists gallery_photos (
  id text primary key,
  url text not null,
  path text,
  caption text default '',
  position int default 0,
  created_at timestamptz default now()
);
-- Public content read by the homepage API (service role) — no RLS needed.
