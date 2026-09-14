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

## Dar neatlikti bandymai

| Ką darėme | Ko tikėjomės | Kas nutiko | Rezultatas |
|---|---|---|---|
| Dvi naršyklės vienu metu rezervuoja tą pačią 1 vietos veiklą („Privati vyno degustacija su someljė“) | Pavyksta tik vienai; kita gauna „Vietų nebeliko“; lentelėje viena eilutė |  |  |
| Bandymas įrašyti rezervaciją tiesiogiai: `supabase.from('reservations').insert(...)` naršyklės konsolėje | Duomenų bazė neleidžia – `reservations` neturi INSERT taisyklės |  |  |
| Bandymas per `reserve_seat` perduoti svetimą `user_id` | Neįmanoma – funkcija priima tik `activity_id`, vartotoją ima iš `auth.uid()` |  |  |
| `reserve_seat` iškvietimas neprisijungus | Grąžina klaidą „Reikia prisijungti“, nieko neįrašo |  |  |
| Organizatorius atšaukia veiklą, kurioje yra dalyvio rezervacija | Veikla dingsta iš `/veiklos`; dalyvis mato „Veikla atšaukta organizatoriaus“; rezervacija lieka |  |  |
| Bandymas redaguoti svetimą veiklą (tiesiogiai per adresą ir per `update`) | Puslapis rodo „Tai ne jūsų veikla“, o duomenų bazė pakeitimo neleidžia (RLS) |  |  |

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
