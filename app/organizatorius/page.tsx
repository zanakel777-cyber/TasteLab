import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  OrganizatoriausVeiklosKortele,
  type Veikla,
} from "@/components/organizatorius-veiklos-kortele";

export default function OrganizatoriusPage() {
  return (
    <section className="flex flex-col gap-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Mano organizuojamos veiklos</h1>
        <Button asChild>
          <Link href="/organizatorius/nauja">Nauja veikla</Link>
        </Button>
      </div>

      <Suspense fallback={<p className="text-foreground/60">Kraunama…</p>}>
        <ManoVeiklos />
      </Suspense>
    </section>
  );
}

/** Duomenų dalis atskirai, nes ji skaito sesijos slapukus (cacheComponents reikalauja Suspense). */
async function ManoVeiklos() {
  const supabase = await createClient();

  // Neprisijungusio čia neturėtų būti, bet tikrinam ir patys.
  const { data: sesija, error: sesijosKlaida } = await supabase.auth.getClaims();
  const vartotojoId = sesija?.claims?.sub;

  if (sesijosKlaida || !vartotojoId) {
    redirect("/auth/login");
  }

  // Vietų skaičius imamas iš rodinio activities_public, ne skaičiuojamas čia.
  const { data, error } = await supabase
    .from("activities_public")
    .select("*")
    .eq("organizer_id", vartotojoId)
    .order("starts_at", { ascending: true });

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Nepavyko įkelti veiklų: {error.message}
      </p>
    );
  }

  const veiklos = (data ?? []) as Veikla[];

  if (veiklos.length === 0) {
    return (
      <p className="text-foreground/70">
        Kol kas neturite sukurtų veiklų. Spauskite „Nauja veikla“ ir sukurkite
        pirmąją.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {veiklos.map((veikla) => (
        <OrganizatoriausVeiklosKortele key={veikla.id} veikla={veikla} />
      ))}
    </div>
  );
}
