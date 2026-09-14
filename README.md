# TasteLab

Skonio dirbtuvės su labai ribotu vietų skaičiumi.

Vieša versija: https://taste-lab-two.vercel.app (v1.1)

## Komanda

- **Jeanne** – pamatai (Next.js, Supabase, Auth, RLS, GitHub, Vercel) ir organizatoriaus dalis (`app/organizatorius/`).
- **Ingrida** – planų peržiūra ir dalyvio dalis (`app/veiklos/`, `app/rezervacijos/`).

## Paleidimas vietoje

```bash
git clone https://github.com/zanakel777-cyber/TasteLab.git
cd TasteLab
npm install
cp .env.example .env.local   # įrašyk tikras reikšmes iš Supabase
npm run dev
```

`.env.local` reikia dviejų reikšmių iš Supabase (Project Settings → API); jos į Git nepatenka:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Programa atsidaro adresu http://localhost:3000.

## Projekto struktūra

| Kelias | Kas tai |
|---|---|
| `app/organizatorius/` | Organizatoriaus dalis: veiklų kūrimas, sąrašas, redagavimas, atšaukimas (Jeanne) |
| `app/veiklos/`, `app/rezervacijos/` | Dalyvio dalis: viešas veiklų sąrašas ir „Mano rezervacijos“ (Ingrida) |
| `supabase/schema.sql` | Lentelės, rodinys `activities_public`, RLS taisyklės, funkcija `reserve_seat`, trigeris |
| `supabase/migracijos/` | Vėlesni duomenų bazės pakeitimai jau veikiančiai bazei |
| `scripts/apsaugos-testas.mjs` | Apsaugos testas: patikrina, ar rezervacijų neįmanoma įrašyti apeinant `reserve_seat` |
| `PLANAS.md` | Darbo planas: ekranai, duomenys, komandos pasidalijimas |
| `TESTAI.md` | Testavimo žurnalas ir saugumo vertinimas |

## Versijos

- **v1.0** – pirma patikrinta vieša versija: veiklos, rezervavimas, atšaukimas ir `reserve_seat` apsauga.
- **v1.1** – veiklos atšaukimas organizatoriui ir ženklas dalyviui; trigeris saugo datą ir draudžia atkurti atšauktą veiklą; bendras vizualinis stilius; apsaugos testo skriptas; `TESTAI.md`.

Planas – [PLANAS.md](PLANAS.md) · Testai – [TESTAI.md](TESTAI.md)
