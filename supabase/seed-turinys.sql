-- TasteLab – BANDOMASIS TURINYS (ne schema).
--
-- ⚠️ Paleisti tik kuriant naują DB – perrašo esamus aprašymus ir nuotraukas.
--
-- Šis failas NEKURIA veiklų: jis tik papildo jau sukurtas veiklas aprašymais ir
-- nuotraukų nuorodomis. Jei kurios nors veiklos duomenų bazėje dar nėra, tas
-- UPDATE tiesiog nieko nepakeičia (0 eilučių) – klaidos nebus.
--
-- Failą galima paleisti kelis kartus – rezultatas visada tas pats.
-- Veiklos randamos pagal pavadinimą (ILIKE = didžiosios/mažosios raidės nesvarbu).
-- Nuotraukos imamos iš loremflickr.com, todėl paveikslėlis gali kaskart skirtis.


-- Itališkų makaronų gamyba
update public.activities
set
  description = 'Nuo miltų kalnelio iki lėkštės: minkysime tešlą, kočiosime ir pjaustysime tagliatelle rankomis, o pabaigoje visi kartu vakarieniausime su naminiu pomidorų padažu.',
  -- Nuotraukos nuorodos neturim, todėl paliekam tuščią: kortelėje rodomas emoji fonas.
  image_url   = null
where title ilike '%makaron%';


-- Šokolado degustacija
update public.activities
set
  description = 'Šeši šokoladai iš trijų žemynų: nuo 40 % pieninio iki 85 % juodojo. Išmoksite atskirti kakavos kilmę ir kodėl „kartus“ nereiškia „geras“.',
  image_url   = 'https://cdn.laisvalaikiodovanos.lt/storage/photos/products/000413/71933.jpg'
where title ilike '%šokolado degustacija%';


-- Sušių dirbtuvės
update public.activities
set
  description = 'Ryžių virimas, žuvies pjaustymas ir sukimas bambukiniu kilimėliu. Kiekvienas pasigamina 12 maki ir 4 nigiri.',
  image_url   = 'https://www.dovanusala.lt/131347-thickbox_default/56-vnt-susiu-rinkinys-sushi-lover-s-.jpg'
where title ilike '%sušių%';


-- Desertų dekoravimas
update public.activities
set
  description = 'Švirkšto technikos, glajaus temperatūros ir šokolado dekoro pagrindai. Dekoruosite šešis keksiukus ir vieną mažą tortą.',
  -- Nuotraukos nuorodos neturim, todėl paliekam tuščią: kortelėje rodomas emoji fonas.
  image_url   = null
where title ilike '%desertų dekoravimas%';


-- Privati vyno degustacija su someljė
update public.activities
set
  description = 'Vienas svečias, vienas someljė, penki vynai ir pusantros valandos pokalbio apie tai, ką jaučiate taurėje.',
  image_url   = 'https://www.dovanusala.lt/88047-thickbox_default/vyno-degustacija-su-somelje-uzkandziai-vilniuje.jpg'
where title ilike '%vyno degustacija%';


-- Patikra: ką turim duomenų bazėje po atnaujinimo.
select title, image_url
from public.activities
order by starts_at;
