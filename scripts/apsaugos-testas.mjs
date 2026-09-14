// TasteLab – apsaugos testas.
//
// Patikrina, ar rezervacijų įrašymą saugo duomenų bazė, o ne naršyklės mygtukas.
// Skriptas NIEKO neįrašo į duomenų bazę: visi trys bandymai turi būti atmesti.
//
// Paleidimas:
//   node scripts/apsaugos-testas.mjs el.pastas slaptazodis

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SVETIMAS_ID = "00000000-0000-0000-0000-000000000000";

// --- Aplinkos kintamieji iš .env.local -------------------------------------

function skaitytiEnv(kelias = ".env.local") {
  let turinys;

  try {
    turinys = readFileSync(kelias, "utf8");
  } catch {
    nutraukti(`Nerastas failas ${kelias}. Paleiskite skriptą iš projekto šaknies.`);
  }

  const reiksmes = {};

  for (const eilute of turinys.split("\n")) {
    const svari = eilute.trim();
    if (!svari || svari.startsWith("#")) continue;

    const lygybe = svari.indexOf("=");
    if (lygybe === -1) continue;

    const raktas = svari.slice(0, lygybe).trim();
    const reiksme = svari.slice(lygybe + 1).trim().replace(/^["']|["']$/g, "");
    reiksmes[raktas] = reiksme;
  }

  return reiksmes;
}

function nutraukti(zinute) {
  console.error(`\n❌ ${zinute}\n`);
  process.exit(1);
}

// --- Pagalbininkai ---------------------------------------------------------

let praejo = 0;
let neprajo = 0;

/** Bandymas laikomas praėjusiu, kai duomenų bazė jį ATMETA. */
function ivertinti(pavadinimas, klaida, laukiamasPaaiskinimas) {
  console.log(`\n${pavadinimas}`);

  if (klaida) {
    praejo += 1;
    console.log(`   ✅ ${laukiamasPaaiskinimas}`);
    console.log(`   Klaida: ${klaida.message}`);
    if (klaida.code) console.log(`   Kodas: ${klaida.code}`);
  } else {
    neprajo += 1;
    console.log("   ❌ SPRAGA: veiksmas pavyko, nors neturėjo");
  }
}

// --- Pradžia ---------------------------------------------------------------

const [, , elPastas, slaptazodis] = process.argv;

if (!elPastas || !slaptazodis) {
  nutraukti(
    "Trūksta argumentų.\n   Naudojimas: node scripts/apsaugos-testas.mjs el.pastas slaptazodis",
  );
}

const env = skaitytiEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const viesasRaktas = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !viesasRaktas) {
  nutraukti(
    ".env.local trūksta NEXT_PUBLIC_SUPABASE_URL arba NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
}

console.log("TasteLab – apsaugos testas");

// Sesijos Node'e nesaugom – po paleidimo jokių raktelių diske neliks.
const nustatymai = { auth: { persistSession: false, autoRefreshToken: false } };

const prisijunges = createClient(url, viesasRaktas, nustatymai);

const { data: sesija, error: prisijungimoKlaida } =
  await prisijunges.auth.signInWithPassword({
    email: elPastas,
    password: slaptazodis,
  });

if (prisijungimoKlaida || !sesija?.user) {
  nutraukti(`Nepavyko prisijungti: ${prisijungimoKlaida?.message ?? "nežinoma klaida"}`);
}

console.log(`Prisijungta: ${sesija.user.email}`);

// Ieškom vyno degustacijos – jos capacity yra 1, todėl ji naudojama apsaugos bandymams.
const { data: veiklos, error: veikluKlaida } = await prisijunges
  .from("activities_public")
  .select("id, title, capacity, free_spots")
  .ilike("title", "%vyno degustacija%")
  .limit(1);

if (veikluKlaida) {
  nutraukti(`Nepavyko gauti veiklų sąrašo: ${veikluKlaida.message}`);
}

const veikla = veiklos?.[0];

if (!veikla) {
  nutraukti(
    "Nerasta veikla, kurios pavadinime būtų „vyno degustacija“.\n" +
      "   Sukurkite ją per /organizatorius/nauja ir paleiskite iš naujo.",
  );
}

console.log(
  `Veikla: „${veikla.title}“ (${veikla.capacity} vt., laisvų ${veikla.free_spots})`,
);

// --- A) Tiesioginis įrašymas į reservations --------------------------------

const { data: iraseIrasa, error: aKlaida } = await prisijunges
  .from("reservations")
  .insert({ activity_id: veikla.id, user_id: sesija.user.id })
  .select("id")
  .maybeSingle();

ivertinti(
  "A) Tiesioginis įrašymas į reservations (apeinant reserve_seat)",
  aKlaida,
  "Duomenų bazė neleido – nėra nei INSERT taisyklės, nei teisės",
);

// Jei įrašymas netikėtai pavyko, tvarkomės po savęs, kad DB liktų švari.
if (!aKlaida && iraseIrasa?.id) {
  const { error: valymoKlaida } = await prisijunges
    .from("reservations")
    .delete()
    .eq("id", iraseIrasa.id);

  console.log(
    valymoKlaida
      ? `   ⚠️ Sukurtos eilutės ištrinti nepavyko: ${valymoKlaida.message}`
      : "   ⚠️ Netyčia sukurta eilutė ištrinta",
  );
}

// --- B) Svetimas user_id per reserve_seat ----------------------------------

const { error: bKlaida } = await prisijunges.rpc("reserve_seat", {
  activity_id: veikla.id,
  user_id: SVETIMAS_ID,
});

ivertinti(
  "B) reserve_seat su svetimu user_id",
  bKlaida,
  "Tokio parametro funkcija neturi – vartotojas visada imamas iš auth.uid()",
);

// --- C) reserve_seat be sesijos --------------------------------------------

const neprisijunges = createClient(url, viesasRaktas, nustatymai);

const { error: cKlaida } = await neprisijunges.rpc("reserve_seat", {
  activity_id: veikla.id,
});

ivertinti(
  "C) reserve_seat be prisijungimo",
  cKlaida,
  "Neprisijungusiam funkcija neprieinama",
);

// --- Santrauka -------------------------------------------------------------

await prisijunges.auth.signOut();

const isViso = praejo + neprajo;
console.log(
  `\nRezultatas: ${praejo} iš ${isViso} bandymų praėjo ${neprajo === 0 ? "✅" : "❌"}`,
);

if (neprajo > 0) {
  console.log("Bent vienas veiksmas pavyko, nors neturėjo – patikrinkite supabase/schema.sql.");
}

process.exit(neprajo === 0 ? 0 : 1);
