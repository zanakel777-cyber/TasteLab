-- TasteLab – migracija 2026-09-17: naujos veiklos data turi būti ateityje.
--
-- KAS KEIČIAMA
-- Pridedama nauja trigerio funkcija public.activities_check_starts_at() ir trigeris
-- activities_check_starts_at_trg, kuris prieš KIEKVIENĄ ĮRAŠYMĄ tikrina, ar starts_at
-- yra ateityje. Jei ne – klaida „Data turi būti ateityje“, eilutė neįrašoma.
--
-- KODĖL
-- Organizatoriaus formoje buvo galima įvesti praeities datą ir veikla būdavo sukuriama
-- be jokio įspėjimo: viešame sąraše jos nesimatydavo (ten yra datos filtras), bet
-- „Mano organizuojamos veiklos“ sąraše ji likdavo kaboti. Formoje dabar yra `min` ir
-- patikra prieš įrašymą, tačiau sąsają galima apeiti, todėl tikrina ir duomenų bazė.
--
-- KODĖL NE `CHECK` TAISYKLĖ
-- Postgres reikalauja, kad CHECK taisyklė naudotų tik IMMUTABLE funkcijas, o now() tokia
-- nėra – bandymas baigtųsi klaida „functions in check constraint must be marked IMMUTABLE“.
-- Trigeris tą patį padaro teisingai ir turi papildomą privalumą: jis tikrina tik naujus
-- įrašymus, todėl jau esančios praeities veiklos migracijos nesustabdo.
--
-- KAIP PALEISTI
-- Įklijuoti į Supabase SQL Editor ir paleisti. Galima leisti kelis kartus.
-- Tas pats pakeitimas jau įrašytas ir supabase/schema.sql 6 bloke, todėl naujai
-- duomenų bazei šio failo nereikia – jis skirtas jau veikiančiai bazei atnaujinti.
--
-- PASTABA
-- Datos keisti po sukūrimo neleidžia 2026-09-14 migracijos trigeris, tad klaidingai
-- sukurtos praeities veiklos vėliau nebepataisysi – liks tik ją atšaukti.


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
