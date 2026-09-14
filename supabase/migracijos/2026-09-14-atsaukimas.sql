-- TasteLab – migracija 2026-09-14: griežtesnis veiklos keitimo trigeris.
--
-- KAS KEIČIAMA
-- Trigerio funkcija public.activities_protect_fields() papildoma dviem taisyklėmis:
--   1) neleidžiama keisti starts_at (veiklos datos ir laiko);
--   2) neleidžiama status iš 'cancelled' grąžinti į 'active'.
-- Senosios dvi taisyklės (capacity ir organizer_id) lieka nepakitusios.
--
-- KODĖL
-- 9 žingsnio saugumo peržiūroje pastebėjom dvi vietas, kurių planas neaprašė:
--   - redagavimo formoje data rodoma pilka ir nekeičiama, bet per API savininkas
--     vis tiek galėjo ją pastumti, nors dalyviai rezervavo būtent tą laiką;
--   - atšauktą veiklą savininkas galėjo grąžinti į 'active', nors dalyviai jau
--     buvo matę pranešimą „Veikla atšaukta organizatoriaus“.
-- Tai buvo ne saugumo spraga (savininkas tvarko savo veiklą), o pažadų sąsajoje
-- ir duomenų bazės taisyklių neatitikimas. Dabar tikrina duomenų bazė.
--
-- KAIP PALEISTI
-- Įklijuoti į Supabase SQL Editor ir paleisti. Galima leisti kelis kartus.
-- Tas pats pakeitimas jau įrašytas ir supabase/schema.sql 6 bloke, todėl naujai
-- duomenų bazei šio failo nereikia – jis skirtas jau veikiančiai bazei atnaujinti.


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

  -- NAUJA: data nustatoma kuriant, dalyviai rezervavo būtent tą laiką.
  if new.starts_at is distinct from old.starts_at then
    raise exception 'Datos keisti negalima';
  end if;

  -- NAUJA: atšaukimas galutinis – atgal į 'active' grįžti negalima.
  if old.status = 'cancelled' and new.status = 'active' then
    raise exception 'Atšauktos veiklos grąžinti negalima';
  end if;

  return new;
end;
$$;


-- Trigeris prie funkcijos jau turėtų būti prikabintas; perkuriam tam atvejui,
-- jei duomenų bazė senesnė ir jo dar nėra.
drop trigger if exists activities_protect_fields_trg on public.activities;

create trigger activities_protect_fields_trg
  before update on public.activities
  for each row
  execute function public.activities_protect_fields();
