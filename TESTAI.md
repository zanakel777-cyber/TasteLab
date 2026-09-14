# TasteLab – testavimo žurnalas

Bandymus atliekame dviese, dviem skirtingomis paskyromis (antra – naršyklės inkognito lange), vietoje (`npm run dev`) ir Vercel adresu.

## Atlikti bandymai

| Ką darėme | Ko tikėjomės | Kas nutiko | Rezultatas |
|---|---|---|---|
| Užsiregistravome ir prisijungėme dviem skirtingomis paskyromis | Registracija be el. pašto patvirtinimo, iškart galima prisijungti; meniu rodo prisijungusio el. paštą | Abi paskyros sukurtos, po registracijos puslapis pasiūlė prisijungti, prisijungimas pavyko | ✅ |
| Sukūrėme veiklą ir tikrinome, ar ji matoma viešame sąraše `/veiklos` | Nauja veikla iškart matoma ir sąraše, ir „Mano organizuojamos veiklos“ | Veikla pasirodė abiejose vietose su teisingu vietų skaičiumi | ✅ |
| Rezervavome vietą veikloje per Vercel adresą | Užimtumas pasikeičia į „1 / 1 vietos užimtos → Liko 0 vietų“, rezervacija atsiranda „Mano rezervacijos“ | Būtent taip ir įvyko – laisvų vietų neliko | ✅ |
| Atšaukėme rezervaciją | Rezervacija dingsta iš sąrašo, vieta grįžta į laisvų vietų skaičių | Vieta grįžo, veiklą vėl galima rezervuoti | ✅ |
| Stebėjome, kas nutinka veikloms, kurių data jau praėjo | Praėjusios veiklos viešame sąraše nebematomos | Pastebėta natūraliai, kai bandomųjų veiklų datos praėjo – iš `/veiklos` jos dingo | ✅ |
| **Paskutinė vieta – pasenęs ekranas.** Ingrida neatnaujino `/veiklos` puslapio (jame dar rodė „0 / 1“), tuo metu Jeanne rezervavo vienintelę vietą; tada Ingrida paspaudė „Rezervuoti“ | Mygtukas iš pasenusio ekrano nieko neįrašo – duomenų bazė atmeta, nes vietų nebėra | Ingrida gavo „Vietų nebeliko“; `reservations` lentelėje liko 1 eilutė | ✅ |
| **Paskutinė vieta – vienu metu.** Abi spaudėme „Rezervuoti“ tą pačią 1 vietos veiklą tuo pačiu metu; kartota 2 kartus | Pavyksta tik vienai, kita gauna „Vietų nebeliko“; lentelėje viena eilutė | Kaskart pavyko tik vienai – pirmą kartą Ingridai, antrą Jeanne; `reservations` abu kartus liko 1 eilutė | ✅ |

## Dar neatlikti bandymai

| Ką darėme | Ko tikėjomės | Kas nutiko | Rezultatas |
|---|---|---|---|
| A) Tiesioginis įrašymas į `reservations` apeinant `reserve_seat` | Duomenų bazė neleidžia – `reservations` neturi INSERT taisyklės ir teisė atimta |  |  |
| B) `reserve_seat` su svetimu `user_id` | Neįmanoma – funkcija priima tik `activity_id`, vartotoją ima iš `auth.uid()` |  |  |
| C) `reserve_seat` iškvietimas neprisijungus | Neprisijungusiam funkcija neprieinama („Reikia prisijungti“ arba teisių klaida) |  |  |
| Organizatorius atšaukia veiklą, kurioje yra dalyvio rezervacija | Veikla dingsta iš `/veiklos`; dalyvis mato „Veikla atšaukta organizatoriaus“; rezervacija lieka |  |  |
| Bandymas redaguoti svetimą veiklą (tiesiogiai per adresą ir per `update`) | Puslapis rodo „Tai ne jūsų veikla“, o duomenų bazė pakeitimo neleidžia (RLS) |  |  |

Bandymai **A, B ir C** atliekami skriptu – jo nereikia kartoti ranka naršyklės konsolėje:

```
node scripts/apsaugos-testas.mjs el.pastas slaptazodis
```

Skriptas prisijungia nurodyta paskyra, susiranda vyno degustaciją ir atlieka visus tris bandymus. ✅ reiškia, kad duomenų bazė veiksmą **atmetė**; į duomenų bazę neįrašoma nieko.

## Saugumo vertinimas (9 žingsnis)

Tai kodo peržiūra, o ne bandymas naršyklėje: perskaityti `supabase/schema.sql` (funkcija `reserve_seat`, RLS taisyklės, `UNIQUE`, trigeris) ir dalyvio komponentai `components/veiklos-kortele.tsx`, `components/veiklos-rezervuoti.tsx`, `components/rezervacijos-atsaukti.tsx`. Lentelėje aukščiau surašyti bandymai tas pačias išvadas dar patikrins praktiškai.

**Bendra išvada: rezervacijos įrašymas apsaugotas duomenų bazės lygiu, ne naršyklėje.**

### 1. Du žmonės vienu metu, veikla su 1 vieta

Kiekvienas `.rpc("reserve_seat", …)` kvietimas duomenų bazėje vyksta savo atskiroje operacijoje (tranzakcijoje). Tarkim, Jeanne (A) ir Ingrida (B) paspaudžia beveik vienu metu:

1. **A** įeina į funkciją, patikrina `auth.uid()` – ne tuščias.
2. **A** paima veiklos eilutę su `select … for update` → **užrakina** tą eilutę.
3. **B** įeina į funkciją, prieina prie to paties `select … for update` → **sustoja ir laukia**. Čia ir yra visa esmė: B toliau nė vienos patikros neatlieka, tiesiog stovi eilėje.
4. **A** patikrina: veikla yra, ne atšaukta, dar neprasidėjusi, A dar neužsiregistravęs, užimta 0 iš 1 → įrašo rezervaciją, grąžina jos `id`.
5. **A** operacija baigiasi, pakeitimas patvirtinamas, **užraktas atlaisvinamas**.
6. **B** pabunda ir mato jau atnaujintą eilutę. Suskaičiuoja rezervacijas: dabar jų **1**, o `capacity` = 1, todėl `1 >= 1` → `raise exception 'Vietų nebeliko'`.
7. B naršyklėje gauna klaidą, o `components/veiklos-rezervuoti.tsx` ją parodo raudonai („Vietų nebeliko“). Nieko neįrašoma.

Svarbu, kad **skaičiavimas ir įrašymas yra viduje užrakto** – todėl „abu suskaičiavo 0 ir abu įrašė“ situacija neįmanoma. Rezultatas nepriklauso nuo to, kas greitesnis internetas: laimi tas, kas pirmas gavo užraktą.

### 2. Ar galima apeiti mygtuką ir įrašyti tiesiai į `reservations`?

Ne, ir tai uždaryta **dviem nepriklausomais sluoksniais**:

- `reservations` lentelėje RLS įjungtas, bet **INSERT taisyklės nėra visai**. Kai RLS įjungtas, o taisyklės nėra, veiksmas draudžiamas automatiškai.
- Be to, atimta pati teisė: `revoke insert, update on public.reservations from anon, authenticated`.

Funkcija įrašyti gali todėl, kad ji `SECURITY DEFINER` – veikia su savo kūrėjo teisėmis, o ne su vartotojo.

### 3. Ar galima paduoti svetimą `user_id`?

Ne. Funkcija priima **tik `activity_id`** – vietos svetimam `user_id` tiesiog nėra. Vartotoją ji pasiima pati: `v_user_id := auth.uid()`, t. y. iš pasirašyto prisijungimo raktelio, kurio naršyklėje suklastoti neįmanoma. O įrašyti eilutę aplenkiant funkciją neleidžia 2 punktas.

Tas pats galioja ir atšaukimui: `components/rezervacijos-atsaukti.tsx` trina su `.eq("user_id", user.id)`, bet net jei kas nors tą sąlygą pašalintų, DELETE taisyklė `using (auth.uid() = user_id)` svetimos rezervacijos ištrinti neleis.

### 4. Ar galima kviesti `reserve_seat` neprisijungus?

Ne, irgi dviem sluoksniais:

- Teisė vykdyti atimta iš visų ir iš `anon`, palikta tik `authenticated` – neprisijungęs gauna „permission denied for function reserve_seat“.
- Net jei teisė būtų, pirmas funkcijos sakinys yra `if v_user_id is null then raise exception 'Reikia prisijungti'`.

Naršyklės pusėje mygtukas dar prieš tai nukreipia į prisijungimą, bet tai tik patogumas, ne apsauga.

### 5. Ar yra spraga, kurios plane nenumatėm?

Saugumo spragos nerasta. Dvi pastabos, kurios **nėra** pavojingos, bet verta jas žinoti:

- **Datos keitimas.** Trigeris saugo `capacity` ir `organizer_id`, bet ne `starts_at`. Redagavimo formoje data pilka ir nekeičiama, tačiau organizatorius per API galėtų savo veiklos datą pastumti. Tai jo paties veikla, tad svetimų duomenų tai neliečia – tik nesutampa su tuo, ką žada sąsaja. Jei norėsis, į trigerį pridėti `starts_at` – vienas `if`.
- **Atšauktą veiklą galima grąžinti.** Savininkas gali `status` iš `cancelled` pakeisti atgal į `active` (kitų reikšmių `check` neleidžia). Rezervacijos tuo metu būna išlikusios, tad viskas susidėlioja teisingai, bet plane šito varianto neaprašėm.

Papildomai patikrinta, ko klausimuose nebuvo: veiklų niekas negali ištrinti (teisė atimta ir DELETE taisyklės nėra), svetimos veiklos redaguoti negalima (`using (auth.uid() = organizer_id)`), o rodinys `activities_public` viešai rodo tik skaičius – kas rezervavo, iš jo nesimato.

## Rastos ir ištaisytos klaidos

### 1. Vercel „Secret“ tipo `NEXT_PUBLIC_` kintamieji build metu tušti (`Invalid supabaseUrl`)

**Kaip pakartoti.** Vercel projekte sukurti `NEXT_PUBLIC_SUPABASE_URL` ir `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` kaip **Secret** tipo kintamuosius ir paleisti diegimą.

**Kas buvo.** Diegimas lūžo su klaida `Invalid supabaseUrl`. `NEXT_PUBLIC_` kintamieji įrašomi į naršyklės kodą statybos metu, o Secret tipo reikšmė tuo momentu programai nepasiekiama – todėl Supabase klientas gaudavo tuščią adresą. Vietiniame kompiuteryje to nesimatė, nes ten reikšmės imamos iš `.env.local`.

**Kaip pataisyta.** Kintamieji Vercel'yje perkurti kaip paprasti **Config** tipo kintamieji (Production aplinkai) ir paleistas naujas diegimas. Taip pat patikrinta, kad pavadinimai sutampa su kodu: šablonas naudoja `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, ne `..._ANON_KEY`.

### 2. Vercel'yje `/rezervacijos` nukreipdavo prisijungusį vartotoją į `/auth/login`

**Kaip pakartoti.** Prisijungti Vercel adresu ir paspausti „Mano rezervacijos“. Vietiniame kompiuteryje tas pats puslapis veikė normaliai.

**Kas buvo.** Pirmasis įtarimas: puslapis su `cacheComponents: true` paruošiamas iš anksto (be sesijos), todėl nukreipimas į prisijungimą galėjo būti įrašytas į statinį puslapį. Patikrinus statybos rezultatą paaiškėjo, kad **taip nebuvo**: `.next/server/app/rezervacijos.meta` rodė `"status": 200`, o paruoštame HTML buvo tik antraštė ir „Kraunama…“, jokios nuorodos į `/auth/login` (patikrinta ir su `connection()`, ir be jo). Tikroji priežastis buvo ta pati kaip 1 klaidoje – be veikiančių aplinkos kintamųjų serveris negalėjo perskaityti sesijos, todėl kiekvienas lankytojas atrodė neprisijungęs.

**Kaip pataisyta.** Sutvarkius Vercel kintamuosius (žr. 1 klaidą) ir perdiegus, puslapis pradėjo veikti. Papildomai kode sesijos skaitymas aiškiai perkeltas į užklausos laiką: duomenis skaitantys komponentai iškelti į `<Suspense>` vidų ir jų pradžioje pridėtas `await connection()` (`app/veiklos`, `app/rezervacijos`, `app/organizatorius`, `app/organizatorius/[id]/redaguoti`). Tai apsauga ateičiai, o ne šio gedimo priežasties pašalinimas.

**Ko išmokome.** Prieš taisant kodą verta patikrinti, ar problema apskritai jame: statybos rezultatų failai (`.next/server/app/*.meta` ir `*.html`) parodo, kas iš tikrųjų buvo paruošta iš anksto.
