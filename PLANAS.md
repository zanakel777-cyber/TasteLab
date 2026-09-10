# TasteLab – planas

Degustacijų ir maisto dirbtuvių platforma. Organizatorius sukuria veiklą → dalyvis rezervuoja vietą → abu mato rezultatą → dalyvis atšaukia rezervaciją → vieta vėl laisva.

Komanda: **Jeanne** (pamatai + organizatoriaus dalis) ir **Ingrida** (dalyvio dalis). Dirbam vienoje `main` šakoje. Apimtis: pati programa ~4–5 val., su komandinio darbo darbais (kontroliuojamas merge konfliktas, apsikeitimas dalimis, `TESTAI.md`, v1.1, švarus klonavimas) ~7 val.

---

## A. Programos veikimas

### Ekranai

| Maršrutas | Kam | Kas jame |
|---|---|---|
| `/` | visiems | Trumpas TasteLab pristatymas, mygtukai „Veiklos“ ir „Prisijungti“ |
| `/auth/sign-up`, `/auth/login` | visiems | Registracija ir prisijungimas el. paštu + slaptažodžiu (iš oficialaus Supabase pavyzdžio) |
| `/veiklos` | visiems (ir neprisijungusiems) | Viešas būsimų veiklų sąrašas kortelėmis: nuotrauka, pavadinimas, data, „6 / 8 vietos užimtos → Liko 2 vietos“, mygtukas „Rezervuoti“ |
| `/rezervacijos` | prisijungusiam | „Mano rezervacijos“ – kokias veiklas užsirezervavau, mygtukas „Atšaukti rezervaciją“, ženklas „Veikla atšaukta organizatoriaus“ |
| `/organizatorius` | prisijungusiam | „Mano organizuojamos veiklos“ – mano sukurtų veiklų sąrašas su užimtumu, mygtukai „Redaguoti“ ir „Atšaukti veiklą“ |
| `/organizatorius/nauja` | prisijungusiam | Naujos veiklos forma: pavadinimas, aprašymas, nuotraukos nuoroda, data ir laikas, vietų skaičius |
| `/organizatorius/[id]/redaguoti` | tik veiklos kūrėjui | Pavadinimo ir aprašymo keitimas |

Viršuje bendra juosta: TasteLab · Veiklos · Mano rezervacijos · Mano veiklos · vartotojo el. paštas / Atsijungti.

### Vartotojo veiksmai

1. **Užsiregistruoja / prisijungia** el. paštu ir slaptažodžiu. Atskirų paskyros tipų nėra – tas pats žmogus gali ir kurti veiklas, ir rezervuoti.
2. **Sukuria veiklą**: užpildo formą, nurodo vietų skaičių. Veikla iškart matoma viešame sąraše.
3. **Rezervuoja vietą**: `/veiklos` → „Rezervuoti“. Neprisijungęs nukreipiamas į prisijungimą.
4. **Mato rezultatą**: dalyvis – `/rezervacijos`, organizatorius – `/organizatorius` (užimtumas pasikeitė).
5. **Atšaukia rezervaciją**: `/rezervacijos` → „Atšaukti“ → vieta vėl laisva, tą pačią veiklą galima rezervuoti iš naujo.
6. **Organizatorius atšaukia veiklą**: `/organizatorius` → „Atšaukti veiklą“ → veikla dingsta iš viešo sąrašo, o dalyviai savo rezervacijose mato „Veikla atšaukta organizatoriaus“.

### Rezervavimo taisyklės

- Vienas vartotojas – **viena rezervacija vienoje veikloje**. Pakartotinis „Rezervuoti“ naujos nesukuria (duomenų bazėje `UNIQUE(activity_id, user_id)`), rodom žinutę „Jau esate užsiregistravęs“.
- **Likusios vietos niekur nesaugomos atskirai**: visada `capacity` minus rezervacijų skaičius. Todėl skaičius negali „nueiti į šoną“.
- Į **pilną** veiklą rezervuoti negalima („Vietų nebeliko“).
- Į **atšauktą** veiklą rezervuoti negalima.
- **Praėjusios veiklos** viešame sąraše nerodomos (`starts_at >= dabar`); rezervacijų ir organizatoriaus sąrašuose lieka, pažymėtos kaip įvykusios.
- **Vietų skaičius nustatomas kuriant ir vėliau nekeičiamas** – kad negalėtų atsirasti daugiau rezervacijų nei vietų.
- Dvi skirtingos atšaukimo rūšys:
  - *dalyvis atšaukia rezervaciją* → rezervacijos eilutė **ištrinama** (kad `UNIQUE` leistų vėliau registruotis iš naujo);
  - *organizatorius atšaukia veiklą* → veiklos `status = 'cancelled'`, rezervacijos **lieka** (dalyvis turi pamatyti, kad renginys atšauktas).
- Veiklą redaguoti ar atšaukti gali **tik jos kūrėjas** – tai tikrina duomenų bazė, ne paslėptas mygtukas.
- Organizatorius gali rezervuoti ir savo veiklą (atskiro draudimo nekuriam).

### Bandomosios veiklos

| Veikla | Vietų |
|---|---|
| Itališkų makaronų gamyba | 8 |
| Šokolado degustacija | 10 |
| Sušių dirbtuvės | 6 |
| Desertų dekoravimas | 8 |
| Privati vyno degustacija su someljė | 1 (paskutinės vietos bandymui) |

---

## B. Technologijos ir duomenys

### Įrankiai

- **Next.js (App Router)** – svetainės karkasas; puslapiai daromi iš `app/` katalogo aplankų.
- **Supabase** – Postgres duomenų bazė + prisijungimai (Auth) + saugumo taisyklės (RLS).
- **Vercel** – nemokamas talpinimas; paskelbia svetainę tiesiai iš GitHub.
- **Tailwind CSS** – apipavidalinimas (ateina kartu su oficialiu Supabase Next.js pavyzdžiu).
- Pagrindas: **oficialus Supabase + Next.js pavyzdys** (`npx create-next-app -e with-supabase`) – jame jau yra prisijungimo puslapiai, `lib/supabase/client.ts`, `lib/supabase/server.ts` ir `middleware.ts` sesijai palaikyti.

### Lentelės

**`activities` (veiklos)**

| Stulpelis | Tipas | Paaiškinimas |
|---|---|---|
| `id` | uuid, PK | Veiklos numeris |
| `organizer_id` | uuid → `auth.users(id)` | Kas sukūrė |
| `title` | text | Pavadinimas |
| `description` | text | Aprašymas |
| `image_url` | text | Nuotraukos **nuoroda tekstu** (failų neįkeliam) |
| `starts_at` | timestamptz | Data ir laikas |
| `capacity` | int (> 0) | Vietų skaičius, vėliau nekeičiamas |
| `status` | text: `'active'` \| `'cancelled'` | Ar veikla galioja |
| `created_at` | timestamptz | Sukūrimo laikas |

**`reservations` (rezervacijos)**

| Stulpelis | Tipas | Paaiškinimas |
|---|---|---|
| `id` | uuid, PK | Rezervacijos numeris |
| `activity_id` | uuid → `activities(id)` ON DELETE CASCADE | Kuri veikla |
| `user_id` | uuid → `auth.users(id)` | Kas rezervavo |
| `created_at` | timestamptz | Kada |
| | **`UNIQUE(activity_id, user_id)`** | Vienas žmogus – viena rezervacija vienoje veikloje |

**Ryšiai paprastai:** vienas vartotojas gali turėti daug veiklų; viena veikla gali turėti daug rezervacijų; vienas vartotojas vienoje veikloje – ne daugiau kaip viena rezervacija.

**`activities_public` (rodinys, angl. view)** – veiklų sąrašas kartu su `reserved_count` (kiek rezervuota) ir `free_spots` (kiek liko). Reikalingas todėl, kad neprisijungęs lankytojas neturi teisės matyti rezervacijų eilučių, bet **skaičių** matyti turi. Rodinys parodo tik skaičių, ne kas rezervavo. (Jei pritrūktų laiko – atsarginis variantas: leisti visiems skaityti `reservations` ir skaičiuoti `count`; tada matomi svetimi vartotojų numeriai, todėl renkamės rodinį.)

### RLS taisyklės paprastais žodžiais

**`activities`:**
- **Skaityti** – gali visi, net neprisijungę (veiklos viešos).
- **Kurti** – tik prisijungęs, ir tik tokią eilutę, kurioje `organizer_id` yra jis pats (negali sukurti veiklos kito vardu).
- **Keisti** – tik tas, kurio `organizer_id` sutampa su jo paskyra. Taip veikia ir redagavimas, ir „Atšaukti veiklą“.
- **Trinti** – niekam neleidžiama; veikla tik pažymima kaip atšaukta.

**`reservations`:**
- **Skaityti** – vartotojas mato tik savo rezervacijas.
- **Kurti** – **INSERT taisyklės nėra visai**, todėl tiesiogiai į lentelę neįrašo niekas. Vienintelis kelias – funkcija `reserve_seat`. Klientas visada kviečia `.rpc('reserve_seat', { activity_id })`.
- **Trinti** – vartotojas gali ištrinti tik savo rezervaciją (taip atšaukiama).
- **Keisti** – niekam nereikia, taisyklės nekuriam.

### Paskutinės vietos apsauga – funkcija `reserve_seat`

Kuriama **iš karto kartu su schema (4 žingsnis)**, nes be jos rezervacijos apskritai neveiktų – laikinų apėjimų nedarom.

Kas kartą, kai kas nors spaudžia „Rezervuoti“, duomenų bazėje iš eilės vyksta:
1. patikrina `auth.uid()`; jei tuščias (neprisijungęs) → klaida „Reikia prisijungti“;
2. užrakina tos veiklos eilutę (`SELECT ... FOR UPDATE`) – kitas žmogus tuo metu laukia;
3. jei veiklos nėra → „Veikla nerasta“;
4. jei `status = 'cancelled'` → „Veikla atšaukta“;
5. jei `starts_at` jau praėjo → „Veikla jau prasidėjo“;
6. suskaičiuoja rezervacijas; jei jų `>= capacity` → „Vietų nebeliko“;
7. tik tada įrašo rezervaciją; jei tokia jau buvo → „Jau esate užsiregistravęs“;
8. atrakina eilutę – kitas žmogus tęsia ir gauna teisingą atsakymą.

Svarbiausios funkcijos savybės:
- **`SECURITY DEFINER`** – veikia su kūrėjo teisėmis, todėl gali įrašyti į `reservations` ten, kur pačiam vartotojui rašyti neleidžiama;
- **priima tik `activity_id`** – daugiau jokių parametrų;
- **vartotoją nustato pati iš `auth.uid()`, niekada iš parametro** – todėl padirbti svetimo `user_id` neįmanoma, net siunčiant užklausą ranka;
- **jei `auth.uid()` tuščias – grąžina klaidą** ir nieko neįrašo;
- `search_path` fiksuotas į `public`, vykdyti leidžiama tik prisijungusiems (`authenticated`).

### Saugumas ir aplinkos kintamieji

- Naršyklėje – **tik viešas `anon` raktas**. `service_role` raktas projekte nenaudojamas niekur.
- Teises tikrina RLS duomenų bazėje; mygtukų slėpimas yra tik patogumas, ne apsauga.
- `.env.example` – tik pavadinimai, be reikšmių: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (tikslūs pavadinimai – kaip oficialiame pavyzdyje).
- `.gitignore` neįleidžia: `.env*`, `node_modules`, `.next`, `.vercel`.

---

## C. Komandos darbas

### Jeanne – pamatai + A dalis (organizatorius)

**Pamatai:** Next.js projektas iš Supabase pavyzdžio, Supabase projektas, Auth (el. paštas + slaptažodis, „Confirm email“ **išjungtas**), lentelės, rodinys, RLS, GitHub repozitorija, Vercel paskelbimas, `app/layout.tsx` meniu, `.env.example`, `.gitignore`, `README.md`.

**A dalis:**
- `app/organizatorius/page.tsx` – „Mano organizuojamos veiklos“ su užimtumu
- `app/organizatorius/nauja/page.tsx` – veiklos kūrimo forma
- `app/organizatorius/[id]/redaguoti/page.tsx` – pavadinimo ir aprašymo keitimas
- **Apsikeitus dalimis** – dirba jau Ingridos kataloge `app/rezervacijos/`: ženklas „Veikla atšaukta organizatoriaus“ ir apsauga (atšauktos veiklos rezervacijos rodomos, bet rezervuoti iš naujo neleidžiama)

### Ingrida – B dalis (dalyvis)

- `app/veiklos/page.tsx` – viešas sąrašas su likusiomis vietomis ir mygtuku „Rezervuoti“
- `app/rezervacijos/page.tsx` – „Mano rezervacijos“ ir „Atšaukti rezervaciją“
- Pagalbiniai savi komponentai, pvz. `components/veiklos-kortele.tsx`, `components/rezervuoti-mygtukas.tsx`
- **Apsikeitus dalimis** – dirba jau Jeanne kataloge `app/organizatorius/`: mygtukas „Atšaukti veiklą“ (`status = 'cancelled'`, patvirtinimo klausimas)

### Bendri failai – keičiami tik susitarus

`app/layout.tsx`, `lib/supabase/*`, `supabase/schema.sql`, `README.md`, `PLANAS.md`, `TESTAI.md`.

Išimtis – **10 darbas**, kur `README.md` šūkio eilutę abi keičia sąmoningai vienu metu, kad išmoktume spręsti merge konfliktą.

Antra išimtis – **11 darbas**, kur abi dirba viena kitos kataloge (apsikeitimas dalimis); prieš tai abi `push`, kad `main` būtų švari.

### Kur dalys susijungia

1. **Duomenų bazė** – abi naudoja tas pačias lenteles, rodinį `activities_public` ir tuos pačius stulpelių pavadinimus.
2. **Meniu** `app/layout.tsx` – Jeanne padaro nuorodas į abi dalis iškart, kad Ingrida galėtų dirbti nelaukdama.
3. **Veiklos atšaukimas – čia sąmoningai apsikeičiam dalimis** (kad kiekviena padirbėtų ir kitos kode): **Ingrida** daro mygtuką „Atšaukti veiklą“ Jeanne kataloge `app/organizatorius/`, **Jeanne** – ženklą „Veikla atšaukta organizatoriaus“ ir apsaugą Ingridos kataloge `app/rezervacijos/`. Suderinam, kad abi remiasi tuo pačiu `status = 'cancelled'`.
4. **Vietų skaičiavimas** – abiejose vietose vienodai iš `activities_public` (`free_spots`), jokių savų skaičiavimų.

### Kaip dirbam vienoje `main` šakoje

- Abi nusistatom `git config pull.rebase false` – naudojam paprastą **sujungimą (merge)**, ne rebase.
- Prieš pradedant darbą ir prieš kiekvieną `push`: **`git pull`**.
- Jei kyla konfliktas: sprendžiam **VS Code** redaktoriuje („Accept Current / Incoming / Both“), tada `git add` ir užbaigiam **sujungimo commit'u** (`git commit`). Taip istorijoje matosi, kad dvi darbo šakos susijungė – to reikalauja užduotis.
- Commit'ai maži ir dažni, aiškiais lietuviškais aprašymais.
- Savo katalogus liečia tik savininkė; bendrus failus – tik pranešus kitai.
- Vercel iš `main` paskelbia automatiškai, tad į `main` keliam tik veikiantį kodą (`npm run build` praeina).

---

## D. Įgyvendinimas ir patikrinimas

### Darbų eilė

| # | Darbas | Kas | ~Laikas |
|---|---|---|---|
| 1 | Next.js projektas iš Supabase pavyzdžio, paleidimas vietoje | Jeanne | 20 min |
| 2 | Supabase projektas, Auth (be el. pašto patvirtinimo), `.env.local`, `.env.example`, `.gitignore` | Jeanne | 20 min |
| 3 | GitHub repozitorija, `git config pull.rebase false` abiejuose kompiuteriuose, pirmas `push` į `main`, Ingrida klonuojasi | Jeanne | 15 min |
| 4 | `supabase/schema.sql`: lentelės, rodinys `activities_public`, RLS taisyklės **ir funkcija `reserve_seat`** (`SECURITY DEFINER`, `FOR UPDATE`, `auth.uid()`) | Jeanne | 55 min |
| 5 | **Vercel paskelbimas** – atskiras darbas: projekto importas, aplinkos kintamieji, pirmas `deploy`, Supabase URL Configuration | Jeanne | 20 min |
| 6 | `app/layout.tsx` meniu ir prisijungimo būsena; abi pradeda savo dalis | Jeanne | 15 min |
| 7 | A dalis: veiklos kūrimas, sąrašas, redagavimas, užimtumas; bandomosios 5 veiklos | Jeanne | 70 min |
| 8 | B dalis: viešas sąrašas su likusiomis vietomis ir „Rezervuoti“ per `.rpc('reserve_seat', { activity_id })` + klaidų žinutės | Ingrida | 60 min |
| 9 | B dalis: „Mano rezervacijos“ ir rezervacijos atšaukimas | Ingrida | 40 min |
| 10 | **Kontroliuojamas merge konfliktas** (po B dalies): abi vienu metu perrašo tą pačią `README.md` šūkio eilutę, abi commit'ina, antroji per `git pull` gauna konfliktą, sprendžia VS Code ir užbaigia sujungimo commit'u | abi | 15 min |
| 11 | **Apsikeitimas dalimis**: Ingrida – mygtukas „Atšaukti veiklą“ `app/organizatorius/`; Jeanne – ženklas „Veikla atšaukta organizatoriaus“ ir apsauga `app/rezervacijos/` | abi | 40 min |
| 12 | **Apsaugos patikrinimas** (ne taisymas): dvi naršyklės vienu metu rezervuoja 1 vietos veiklą; bandymas įrašyti į `reservations` tiesiogiai; bandymas kviesti RPC neprisijungus | abi kartu | 25 min |
| 13 | **`TESTAI.md`** – patikros lentelė su tikrais rezultatais (ką tikrinom, kas, kada, ✅/❌, pastabos) | abi | 20 min |
| 14 | **v1.1 pažyma** – `README.md` eilutė „Versija: v1.1“ su pakeitimų sąrašu ir `git tag v1.1` + `git push --tags` | abi | 10 min |
| 15 | **Švarus `Clone` pagal `README.md`** – klonuoti repozitoriją į naują tuščią katalogą ir, sekant tik README nurodymais (`npm install`, `.env.local` iš `.env.example`, `npm run dev`), paleisti programą | abi | 20 min |

Iš viso ~7 val. Pagrindinė dalis (1–9) telpa į ~5 val., o 10–15 darbai (merge konfliktas, apsikeitimas, `TESTAI.md`, v1.1, švarus klonavimas) prideda ~2 val. Jei laiko trūktų, pirmiausia trumpinam 7 ir 8 darbus (paprastesnis apipavidalinimas), o 10–15 darai lieka – jie parodo komandinį darbą.

Funkcija `reserve_seat` yra 4 žingsnyje, todėl „Rezervuoti“ nuo pirmos minutės rašo tik per ją – nereikia nieko perdarinėti.

**Kontroliuojamo konflikto tvarka (10 darbas):** susitariam iš anksto, kad abi keičia tik `README.md` šūkio eilutę. Jeanne įrašo savo variantą ir `push`. Ingrida tuo pat metu įrašo savo, tada `git pull` – Git parodo konfliktą. Sprendžiam VS Code („Accept Both Changes“, paliekam sutartą galutinį šūkį), `git add README.md`, `git commit` (sujungimo commit'as), `git push`. Rezultatas: istorijoje matomas tikras merge commit'as ir konflikto sprendimas.

### Pirmos versijos ribos (ko sąmoningai nedarom)

Mokėjimų, pokalbių, kalendoriaus, nuotraukų įkėlimo (tik nuoroda), el. laiškų pranešimų, laukiančiųjų eilės, paieškos ir filtrų, dalyvių sąrašo su el. paštais, vietų skaičiaus keitimo, veiklos trynimo, administratoriaus vaidmens, telefonui pritaikyto dizaino tobulinimo.

### Paleidimas Vercel (5 darbas – atskiras, po schemos)

1. Kodas į GitHub `main`.
2. Vercel → „Import Git Repository“ → pasirenkam repozitoriją.
3. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` ir `NEXT_PUBLIC_SUPABASE_ANON_KEY` (tos pačios reikšmės kaip `.env.local`).
4. Deploy. Kiekvienas `push` į `main` paskelbia naują versiją automatiškai.
5. Supabase → Authentication → URL Configuration: nurodom Vercel adresą.

### Kaip patikrinsim kiekvieną funkciją

Testuojam dviese, dviem skirtingomis paskyromis (arba antra – naršyklės inkognito lange).

| Ką tikrinam | Kaip | Ko tikimės |
|---|---|---|
| Registracija ir prisijungimas | Sukurti dvi paskyras | Abi iškart prisijungusios, meniu rodo el. paštą |
| Veiklos sukūrimas | Jeanne sukuria „Sušių dirbtuvės“, 6 vietos | Veikla matoma `/veiklos` ir `/organizatorius` |
| Vieša peržiūra | Atidaryti `/veiklos` neprisijungus | Sąrašas matomas, „Rezervuoti“ nukreipia į prisijungimą |
| Rezervacija | Ingrida rezervuoja | Kortelėje „1 / 6 užimtos → Liko 5“, įrašas `/rezervacijos` |
| Abu mato rezultatą | Jeanne atsinaujina `/organizatorius` | Užimtumas 1 / 6 |
| Dvigubos rezervacijos apsauga | Ingrida spaudžia „Rezervuoti“ dar kartą | Naujos rezervacijos neatsiranda, žinutė „Jau esate užsiregistravęs“ |
| Rezervacijos atšaukimas | Ingrida atšaukia | Įrašas dingsta, „Liko 6“, galima rezervuoti iš naujo |
| Pilna veikla | „Privati vyno degustacija“ (1 vieta): rezervuoja Ingrida, bando Jeanne | Jeanne gauna „Vietų nebeliko“ |
| **Paskutinė vieta lygiagrečiai** (12 darbas) | Abi vienu metu spaudžia „Rezervuoti“ tą pačią 1 vietos veiklą | Pavyksta **tik vienai**; rezervacijų lentelėje viena eilutė |
| **Tiesioginis įrašymas apeinant funkciją** (12 darbas) | Naršyklės konsolėje `supabase.from('reservations').insert(...)` | Duomenų bazė neleidžia (nėra INSERT taisyklės), eilutė neatsiranda |
| **Svetimas `user_id`** (12 darbas) | Kviesti `reserve_seat` ir bandyti perduoti kito vartotojo id | Neįmanoma – funkcija priima tik `activity_id`, vartotoją ima iš `auth.uid()` |
| **RPC neprisijungus** (12 darbas) | Kviesti `reserve_seat` be sesijos | Grąžina klaidą „Reikia prisijungti“, nieko neįrašo |
| Veiklos atšaukimas | Jeanne atšaukia veiklą, kurioje yra Ingridos rezervacija | Dingsta iš `/veiklos`; Ingrida mato „Veikla atšaukta organizatoriaus“; rezervacija lieka |
| Į atšauktą veiklą | Bandyti rezervuoti atšauktą | Neleidžia |
| Svetimos veiklos redagavimas | Ingrida bando atidaryti Jeanne veiklos redagavimą / siųsti `update` | Duomenų bazė neleidžia (RLS), pakeitimų nėra |
| Praėjusios veiklos | Sukurti veiklą su vakarykšte data | Viešame sąraše nesimato |
| Paskelbta versija | Visus punktus pakartoti Vercel adrese | Veikia taip pat kaip vietoje |
| **Merge konfliktas** (10 darbas) | `git log --graph --oneline` po konflikto sprendimo | Matomas sujungimo (merge) commit'as, `README.md` turi sutartą šūkį |
| **Švarus `Clone`** (15 darbas) | Klonuoti į naują katalogą ir sekti tik `README.md` | `npm install` → `.env.local` → `npm run dev` užtenka; programa pasileidžia be papildomų klausimų |

Rezultatus surašom į **`TESTAI.md`** (13 darbas): ta pati lentelė + stulpeliai „kas tikrino“, „kada“, „✅ / ❌“, „pastabos“.

---

## Terminų žodynėlis

- **App Router** – naujasis Next.js būdas kurti puslapius, kai kiekvienas aplankas `app/` viduje tampa svetainės adresu.
- **RLS (Row Level Security)** – duomenų bazės taisyklės, nustatančios, kurias **eilutes** konkretus vartotojas gali matyti ar keisti.
- **RPC** – duomenų bazėje saugoma funkcija, kurią programa iškviečia vienu kreipiniu, o visą tikrinimą atlieka pati duomenų bazė.
- **`SELECT ... FOR UPDATE`** – eilutės užrakinimas: kol vienas veiksmas su ja dirba, kitas laukia, todėl paskutinės vietos negali užimti du žmonės vienu metu.
- **`anon` raktas** – viešas Supabase raktas, skirtas naršyklei; jis pats teisių neduoda, viską sprendžia RLS.
- **`SECURITY DEFINER`** – funkcijos savybė veikti su savo kūrėjo teisėmis, todėl ji gali įrašyti eilutę ten, kur pačiam vartotojui rašyti neleidžiama.
- **Rodinys (view)** – iš anksto paruoštas užklausos rezultatas, kurį galima skaityti tarsi lentelę (pas mus – veiklos kartu su užimtų vietų skaičiumi).
- **Vercel** – paslauga, kuri iš GitHub paima kodą ir paverčia jį veikiančia svetaine internete.
