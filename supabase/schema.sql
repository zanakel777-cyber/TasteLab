-- TasteLab – duomenų bazės schema (Supabase / Postgres).
-- Failą galima paleisti Supabase SQL Editor'e kelis kartus iš eilės – jis nieko nesugadins.
-- Eilės tvarka: 1) lentelės, 2) rodinys, 3) RLS taisyklės, 4) funkcija reserve_seat, 5) teisės.


-- ============================================================
-- 1. LENTELĖS
-- ============================================================

-- Veiklos: vienas įrašas – viena degustacija ar dirbtuvės; capacity turi būti teigiamas, o status – tik 'active' arba 'cancelled'.
create table if not exists public.activities (
  id           uuid        primary key default gen_random_uuid(),
  organizer_id uuid        not null references auth.users (id) on delete cascade,
  title        text        not null,
  description  text,
  image_url    text,
  starts_at    timestamptz not null,
  capacity     integer     not null check (capacity > 0),
  status       text        not null default 'active' check (status in ('active', 'cancelled')),
  created_at   timestamptz not null default now()
);

-- Rezervacijos: viena eilutė – vieno žmogaus vieta vienoje veikloje; UNIQUE neleidžia tam pačiam žmogui registruotis du kartus.
create table if not exists public.reservations (
  id          uuid        primary key default gen_random_uuid(),
  activity_id uuid        not null references public.activities (id) on delete cascade,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (activity_id, user_id)
);

-- Indeksai, kad sąrašai ir vietų skaičiavimas veiktų greitai.
create index if not exists activities_organizer_id_idx on public.activities (organizer_id);
create index if not exists activities_starts_at_idx    on public.activities (starts_at);
create index if not exists reservations_user_id_idx    on public.reservations (user_id);


-- ============================================================
-- 2. RODINYS activities_public
-- ============================================================

-- Rodinys parodo veiklas kartu su užimtų (reserved_count) ir likusių (free_spots) vietų skaičiumi, bet neatskleidžia, kas rezervavo.
drop view if exists public.activities_public;

create view public.activities_public as
select
  a.id,
  a.organizer_id,
  a.title,
  a.description,
  a.image_url,
  a.starts_at,
  a.capacity,
  a.status,
  a.created_at,
  coalesce(r.reserved_count, 0)                             as reserved_count,
  greatest(a.capacity - coalesce(r.reserved_count, 0), 0)   as free_spots
from public.activities a
left join (
  select activity_id, count(*)::integer as reserved_count
  from public.reservations
  group by activity_id
) r on r.activity_id = a.id;

-- Rodinys sąmoningai paliekamas be „security_invoker“, todėl jis pats gali suskaičiuoti rezervacijas, nors pats lankytojas jų eilučių matyti negali.
grant select on public.activities_public to anon, authenticated;


-- ============================================================
-- 3. RLS – EILUČIŲ LYGIO SAUGUMAS
-- ============================================================

-- Įjungiam RLS: nuo šios akimirkos be aiškios taisyklės niekas negali nei skaityti, nei rašyti.
alter table public.activities   enable row level security;
alter table public.reservations enable row level security;

-- Senas taisykles pašalinam, kad failą būtų galima paleisti pakartotinai.
drop policy if exists "activities_select_all"       on public.activities;
drop policy if exists "activities_insert_own"       on public.activities;
drop policy if exists "activities_update_own"       on public.activities;
drop policy if exists "reservations_select_own"     on public.reservations;
drop policy if exists "reservations_delete_own"     on public.reservations;

-- ACTIVITIES: skaityti veiklas gali visi, net neprisijungę lankytojai.
create policy "activities_select_all"
  on public.activities
  for select
  to anon, authenticated
  using (true);

-- ACTIVITIES: kurti veiklą gali tik prisijungęs vartotojas ir tik savo vardu (organizer_id turi būti jis pats).
create policy "activities_insert_own"
  on public.activities
  for insert
  to authenticated
  with check (auth.uid() = organizer_id);

-- ACTIVITIES: redaguoti ir atšaukti (status = 'cancelled') gali tik veiklos kūrėjas, ir po pakeitimo savininkas turi likti tas pats.
create policy "activities_update_own"
  on public.activities
  for update
  to authenticated
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

-- ACTIVITIES: DELETE taisyklės nėra sąmoningai – veiklos netrinamos, tik pažymimos atšauktomis.

-- RESERVATIONS: matyti savo rezervacijas gali tik pats jų savininkas.
create policy "reservations_select_own"
  on public.reservations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RESERVATIONS: ištrinti (t. y. atšaukti) galima tik savo rezervaciją.
create policy "reservations_delete_own"
  on public.reservations
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- RESERVATIONS: INSERT ir UPDATE taisyklių nėra sąmoningai – įrašyti rezervaciją gali tik funkcija reserve_seat.


-- ============================================================
-- 4. FUNKCIJA reserve_seat – apsauga dėl paskutinės vietos
-- ============================================================

-- Funkcija įrašo rezervaciją: ji viena užrakina veiklos eilutę, patikrina visas sąlygas ir tik tada rašo, todėl dviese paskutinės vietos užimti neįmanoma.
create or replace function public.reserve_seat(activity_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id        uuid := auth.uid();
  v_activity       public.activities%rowtype;
  v_taken          integer;
  v_reservation_id uuid;
begin
  -- Vartotojas imamas TIK iš sesijos (auth.uid()), niekada iš parametro; neprisijungusiam iškart klaida.
  if v_user_id is null then
    raise exception 'Reikia prisijungti';
  end if;

  -- Užrakinam veiklos eilutę: kitas tuo pat metu rezervuojantis žmogus čia palauks, kol baigsim.
  select *
    into v_activity
    from public.activities a
   where a.id = reserve_seat.activity_id
     for update;

  -- Patikra, ar tokia veikla apskritai yra.
  if not found then
    raise exception 'Veikla nerasta';
  end if;

  -- Į organizatoriaus atšauktą veiklą registruotis negalima.
  if v_activity.status = 'cancelled' then
    raise exception 'Veikla atšaukta';
  end if;

  -- Į jau prasidėjusią ar praėjusią veiklą registruotis negalima.
  if v_activity.starts_at <= now() then
    raise exception 'Veikla jau prasidėjo';
  end if;

  -- Jei šis žmogus jau užsiregistravęs, naujos rezervacijos nekuriam ir pasakom tai aiškiai.
  select r.id
    into v_reservation_id
    from public.reservations r
   where r.activity_id = reserve_seat.activity_id
     and r.user_id = v_user_id;

  if v_reservation_id is not null then
    raise exception 'Jau esate užsiregistravęs';
  end if;

  -- Suskaičiuojam užimtas vietas ir palyginam su capacity (likusios vietos niekur atskirai nesaugomos).
  select count(*)
    into v_taken
    from public.reservations r
   where r.activity_id = reserve_seat.activity_id;

  if v_taken >= v_activity.capacity then
    raise exception 'Vietų nebeliko';
  end if;

  -- Tik dabar įrašom rezervaciją ir grąžinam jos id; užraktas atlaisvinamas pasibaigus funkcijai.
  insert into public.reservations (activity_id, user_id)
  values (reserve_seat.activity_id, v_user_id)
  returning id into v_reservation_id;

  return v_reservation_id;

-- Atsarginis variantas: jei UNIQUE taisyklė vis dėlto suveiktų anksčiau už mūsų patikrą, vartotojas gauna tą pačią aiškią žinutę.
exception
  when unique_violation then
    raise exception 'Jau esate užsiregistravęs';
end;
$$;

-- Funkciją leidžiam vykdyti tik prisijungusiems: iš „visų“ ir iš neprisijungusių (anon) teisė atimama.
revoke all on function public.reserve_seat(uuid) from public;
revoke all on function public.reserve_seat(uuid) from anon;
grant execute on function public.reserve_seat(uuid) to authenticated;


-- ============================================================
-- 5. LENTELIŲ TEISĖS – antras apsaugos sluoksnis šalia RLS
-- ============================================================

-- Veiklas skaityti gali visi, o kurti ir keisti – tik prisijungę (ką tiksliai galima, toliau sprendžia RLS).
grant select on public.activities to anon, authenticated;
grant insert, update on public.activities to authenticated;

-- Veiklų trynimo teisės neduodam niekam – veikla tik pažymima atšaukta.
revoke delete on public.activities from anon, authenticated;

-- Rezervacijas prisijungęs gali skaityti ir trinti, bet ne įrašyti ar keisti – įrašo tik funkcija reserve_seat.
grant select, delete on public.reservations to authenticated;
revoke insert, update on public.reservations from anon, authenticated;
revoke all on public.reservations from anon;


-- ============================================================
-- 6. PAPILDOMA APSAUGA: ko po sukūrimo keisti nebegalima
-- ============================================================

-- Trigeris saugo keturis dalykus, kurių RLS taisyklė patikrinti negali (ji sprendžia dėl visos eilutės, ne dėl atskiro stulpelio):
-- capacity, organizer_id, starts_at ir atšauktos veiklos grąžinimą į aktyvias.
create or replace function public.activities_protect_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Vietų skaičius nustatomas kuriant – kitaip rezervacijų galėtų pasidaryti daugiau nei vietų.
  if new.capacity is distinct from old.capacity then
    raise exception 'Vietų skaičiaus keisti negalima';
  end if;

  -- Veiklos savininkas nekeičiamas.
  if new.organizer_id is distinct from old.organizer_id then
    raise exception 'Organizatoriaus keisti negalima';
  end if;

  -- Data nustatoma kuriant: dalyviai rezervavo būtent tą laiką, todėl jo pastumti nebegalima.
  if new.starts_at is distinct from old.starts_at then
    raise exception 'Datos keisti negalima';
  end if;

  -- Atšaukimas galutinis: iš 'cancelled' atgal į 'active' grįžti negalima, nes dalyviai jau matė pranešimą apie atšaukimą.
  if old.status = 'cancelled' and new.status = 'active' then
    raise exception 'Atšauktos veiklos grąžinti negalima';
  end if;

  return new;
end;
$$;

drop trigger if exists activities_protect_fields_trg on public.activities;

create trigger activities_protect_fields_trg
  before update on public.activities
  for each row
  execute function public.activities_protect_fields();


-- Naujos veiklos data turi būti ateityje. CHECK taisyklė čia netinka – Postgres reikalauja,
-- kad CHECK naudotų tik IMMUTABLE funkcijas, o now() tokia nėra; todėl tikrinam trigeriu.
-- Tikrinamas tik įrašymas: datos keisti vėliau ir taip neleidžia activities_protect_fields.
create or replace function public.activities_check_starts_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.starts_at <= now() then
    raise exception 'Data turi būti ateityje';
  end if;

  return new;
end;
$$;

drop trigger if exists activities_check_starts_at_trg on public.activities;

create trigger activities_check_starts_at_trg
  before insert on public.activities
  for each row
  execute function public.activities_check_starts_at();
