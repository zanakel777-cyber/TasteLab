# TasteLab – pristatymo scenarijus (5–7 min.)

Dalyvauja abi. Ne skaidrės – veikianti programa, GitHub istorija ir po vieną sakinį apie kolegės kodą.

---

## Pasiruošimas (10 min. prieš)

| Kas | Ką |
|-----|----|
| Jeanne | Įprastame lange prisijungusi savo paskyra: `https://taste-lab-two.vercel.app` → „Mano veiklos“. Antrame skirtuke – `github.com/zanakel777-cyber/TasteLab` → Commits. Trečiame – Supabase → Table Editor → `reservations`. |
| Ingrida | Savo kompiuteryje (arba antroje naršyklėje) prisijungusi savo paskyra: `/veiklos`. |
| Abi | Patikrinti, kad „Bandomoji – pristatymui“ egzistuoja, aktyvi, 3 vietos, **0 rezervacijų**, data ateityje. Ir kad vyno degustacija (1 vieta) yra **laisva**. Jei datos praėjo – SQL: `update public.activities set starts_at = starts_at + interval '30 days' where starts_at < now();` |
| Abi | Susitarti, kas sako pirmą sakinį. Praktikuoti vieną kartą su laikmačiu. |

---

## 1. Kas tai (30 s) – Jeanne

> „TasteLab – degustacijų ir maisto dirbtuvių platforma. Organizatorius paskelbia veiklą su ribotu vietų skaičiumi, dalyvis rezervuoja vietą. Svarbiausia programos dalis – ne išvaizda, o tai, kad paskutinės vietos negali gauti du žmonės vienu metu ir kad atšaukus veiklą dalyvis supranta, kas nutiko.“

Ekrane: pradžios puslapis, poraštėje „v1.1“.

---

## 2. Produktas – pilnas kelias (1,5 min.)

**Jeanne** (organizatorė): „Mano veiklos“ → **„Nauja veikla“** → pavadinimas „Pristatymo degustacija“, 2 vietos, rytojaus data → išsaugoti.
> „Veikla įrašyta į Supabase, `organizer_id` – mano paskyros id. RLS taisyklė leidžia ją redaguoti tik man.“

**Ingrida** (dalyvė): atnaujina `/veiklos` → nauja veikla, „0 / 2 → Liko 2“ → **„Rezervuoti“** → „Vieta rezervuota“ → `/rezervacijos` rodo įrašą.
> „Mygtukas nekuria rezervacijos pats – jis kviečia duomenų bazės funkciją `reserve_seat`. Į lentelę `reservations` tiesiogiai įrašyti negali niekas.“

**Jeanne**: atnaujina „Mano veiklos“ → „1 / 2 → Liko 1“, juostelė.
> „Užimtumas neskaičiuojamas ir nesaugomas atskirai – tai `capacity` minus rezervacijų skaičius, per rodinį `activities_public`. Todėl skaičius negali „nuvažiuoti“.“

**Ingrida**: „Atšaukti rezervaciją“ → **Jeanne** atnaujina → „0 / 2“.
> „Rezervacijos atšaukimas – eilutės ištrynimas, kad tas pats žmogus galėtų registruotis vėl. Veiklos atšaukimas – kitas dalykas, parodysim.“

---

## 3. Sudėtinga situacija A – paskutinė vieta dviem (1,5 min.)

Abi atsidaro vyno degustaciją (1 vieta), matot „Liko 1“. **Ingrida puslapio neatnaujina.**

**Jeanne**: „Rezervuoti“ → „Vieta rezervuota“.
**Ingrida** (sename ekrane vis dar „Liko 1“): „Rezervuoti“ → **„Vietų nebeliko“**.

**Jeanne** (Supabase skirtukas): `reservations` → vyno degustacijai viena eilutė.
> „Ingridos ekranas melavo, duomenų bazė – ne. `reserve_seat` užrakina veiklos eilutę (`SELECT … FOR UPDATE`), suskaičiuoja rezervacijas ir tik tada įrašo. Antras žmogus laukia prie užrakto, o kai pabunda, mato jau naują skaičių ir gauna klaidą. Tai patikrinom ir spaudžiant abi vienu metu, ir skriptu, kuris bando apeiti mygtuką – trys bandymai, trys atmetimai. Viskas TESTAI.md.“

---

## 4. Sudėtinga situacija B – „Veiklą reikia atšaukti“ (1 min.)

**Ingrida**: rezervuoja „Bandomoji – pristatymui“ → palieka `/veiklos` langą **neatnaujintą**, atsidaro antrą.
**Jeanne**: „Mano veiklos“ → prie bandomosios **„Atšaukti veiklą“** → patvirtinti → kortelė „Atšaukta“, mygtukų nėra.
**Ingrida**: antrame lange `/rezervacijos` → prigesinta kortelė, **„Veikla atšaukta organizatoriaus“**, rezervacija liko. Sename lange „Rezervuoti“ → „Veikla atšaukta“, mygtukas neaktyvus.

> **Ingrida:** „Veiklos netrinam – ją pažymim `cancelled`. Rezervacijos lieka, kad dalyvis matytų, kas nutiko. Trigeris duomenų bazėje neleidžia atšauktos veiklos grąžinti atgal ir neleidžia keisti datos ar vietų skaičiaus – net per SQL.“

---

## 5. Komandinis darbas – GitHub (1,5 min.)

**Jeanne** (GitHub → Commits): rodo `git shortlog`: Jeanne 22+, Ingrida 6+.

Po vieną commit'ą kiekviena:
- **Jeanne** – „DB schema, RLS, reserve_seat“: „Čia visa apsauga – lentelės, taisyklės ir funkcija su užraktu.“
- **Ingrida** – „Dalyvio dalis: veiklų sąrašas, rezervavimas, mano rezervacijos“: „Mano pusė – viešas sąrašas iš rodinio ir mygtukas per RPC.“

Konfliktas: parodyti „Sujungtas šūkis po konflikto“ su dviem šakelėmis (GitHub Network arba VS Code Graph).
> „Abi pakeitėm tą pačią README eilutę, Git sustojo, sprendėm VS Code ir užbaigėm sujungimo commit'u.“

**Kolegės kodas – po vieną sakinį:**
- **Ingrida:** „10 žingsnyje dirbau Jeanne organizatoriaus kortelėje – pridėjau mygtuką „Atšaukti veiklą“ (`components/organizatorius-atsaukti-veikla.tsx`). Turėjau suprasti, kaip jos kortelė gauna būseną ir kada rodyti mygtuką.“
- **Jeanne:** „Aš dirbau Ingridos rezervacijų sąraše – pridėjau ženklą „Veikla atšaukta organizatoriaus“ ir jos „Rezervuoti“ mygtuke apsaugą nuo pasenusio puslapio (`components/veiklos-rezervuoti.tsx`).“

---

## 6. Kas kur gyvena (30 s) – Ingrida

> „**GitHub** saugo kodą ir istoriją – kas ką kada pakeitė, plius PLANAS.md ir TESTAI.md. **Supabase** saugo duomenis – vartotojus, veiklas, rezervacijas – ir taisykles, kas ką gali. **Vercel** paima kodą iš GitHub ir paskelbia jį internete; kiekvienas push į `main` – naujas diegimas, v1.1 atitinka commit'ą `1f92131`. Raktai į GitHub nekeliauja – jie `.env.local` ir Vercel nustatymuose.“

---

## Jei paklaus

- **Kodėl funkcija, o ne tikrinimas naršyklėje?** Naršyklę galima apeiti (skriptas tai parodė). Duomenų bazės – ne.
- **Kas, jei du žmonės spaudžia tą pačią milisekundę?** Užraktas – vienas įeina, kitas laukia. Nėra „abu suskaičiavo nulį“.
- **Kodėl rezervacijos atšaukimas trina, o veiklos – žymi?** UNIQUE(activity_id, user_id) neleistų registruotis iš naujo, jei atšaukta rezervacija liktų. Veiklai reikia istorijos.
- **Kokią klaidą radot?** Vercel „Secret“ tipo `NEXT_PUBLIC_` kintamieji build metu tušti → „Invalid supabaseUrl“. Įtarėm kešavimą, patikrinom – ne; tikroji priežastis – kintamųjų tipas. TESTAI.md aprašyta.
- **Ką darytumėt kitaip?** Nuotraukų įkėlimą, laukiančiųjų eilę – v1.2. Bet pirma versija sąmoningai be jų.

---

## Laikas

| Dalis | Min. |
|-------|------|
| 1. Kas tai | 0,5 |
| 2. Pilnas kelias | 1,5 |
| 3. Paskutinė vieta | 1,5 |
| 4. Atšaukimas | 1 |
| 5. GitHub + kolegės kodas | 1,5 |
| 6. GitHub / Supabase / Vercel | 0,5 |
| **Iš viso** | **6,5** |

Atsarga: jei trūksta laiko – 4 dalį sutrumpinti iki „Atšaukti“ + Ingridos ekrano, be seno lango.
