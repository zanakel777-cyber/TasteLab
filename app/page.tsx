import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="flex flex-col gap-6 py-16 max-w-2xl">
      <h1 className="text-4xl font-semibold">TasteLab</h1>
      <div className="flex flex-col gap-3 text-foreground/80">
        <p>
          TasteLab – degustacijų ir maisto dirbtuvių platforma. Čia organizatoriai
          skelbia nedideles gastronomines veiklas: vyno ir šokolado degustacijas,
          makaronų gaminimo ar desertų dekoravimo dirbtuves.
        </p>
        <p>
          Vietų kiekvienoje veikloje ribotai, todėl rezervacija patvirtinama iš
          karto – matai, kiek vietų dar liko. Rezervaciją bet kada gali atšaukti,
          ir vieta grįžta kitiems.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/veiklos">Peržiūrėti veiklas</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/login">Prisijungti</Link>
        </Button>
      </div>
    </section>
  );
}
