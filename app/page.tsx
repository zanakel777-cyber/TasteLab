import Link from "next/link";
import { Button } from "@/components/ui/button";

const kaipVeikia = [
  {
    emoji: "🧑‍🍳",
    title: "Organizatorius skelbia",
    text: "Sukuri veiklą: pavadinimą, datą, aprašymą ir vietų skaičių.",
  },
  {
    emoji: "🎟️",
    title: "Dalyvis rezervuoja",
    text: "Prisijungęs dalyvis vienu paspaudimu užsiima vietą ir ją mato savo sąraše.",
  },
  {
    emoji: "⏳",
    title: "Vieta ribota",
    text: "Likusios vietos skaičiuojamos gyvai – paskutinę vietą gauna tik vienas.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-16 py-14">
      <section className="flex flex-col gap-6 max-w-2xl">
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight">
          Taste<span className="tl-wine">Lab</span>
        </h1>

        <p className="text-xl text-foreground/90">
          Skonio dirbtuvės su labai ribotu vietų skaičiumi.
        </p>

        <div className="flex flex-col gap-3 text-muted-foreground">
          <p>
            TasteLab – degustacijų ir maisto dirbtuvių platforma. Organizatoriai
            skelbia nedideles gastronomines veiklas: vyno ir šokolado
            degustacijas, makaronų gaminimo ar desertų dekoravimo dirbtuves.
          </p>
          <p>
            Vietų kiekvienoje veikloje nedaug, todėl rezervacija patvirtinama iš
            karto ir visada matai, kiek vietų dar liko. Rezervaciją gali atšaukti
            – vieta tą pačią akimirką grįžta kitiems.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/veiklos">Peržiūrėti veiklas</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/auth/login">Prisijungti</Link>
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Kaip tai veikia
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {kaipVeikia.map((zingsnis) => (
            <div key={zingsnis.title} className="tl-soft-panel flex flex-col gap-2">
              <span className="text-2xl" aria-hidden="true">
                {zingsnis.emoji}
              </span>
              <h3 className="text-base font-semibold">{zingsnis.title}</h3>
              <p className="text-sm text-muted-foreground">{zingsnis.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
