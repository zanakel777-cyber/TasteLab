import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatuotiData } from "@/components/organizatorius-veiklos-kortele";
import { OrganizatoriausRedagavimoForma } from "@/components/organizatorius-redagavimo-forma";

export default function RedaguotiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <section className="flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/organizatorius"
          className="text-sm text-foreground/70 hover:underline"
        >
          ← Mano organizuojamos veiklos
        </Link>
        <h1 className="text-3xl font-semibold">Veiklos redagavimas</h1>
      </div>

      <Suspense fallback={<p className="text-foreground/60">Kraunama…</p>}>
        <VeiklosRedagavimas params={params} />
      </Suspense>
    </section>
  );
}

/** Duomenų dalis atskirai, nes ji skaito sesijos slapukus (cacheComponents reikalauja Suspense). */
async function VeiklosRedagavimas({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sesija, error: sesijosKlaida } = await supabase.auth.getClaims();
  const vartotojoId = sesija?.claims?.sub;

  if (sesijosKlaida || !vartotojoId) {
    redirect("/auth/login");
  }

  const { data: veikla, error } = await supabase
    .from("activities")
    .select("id, organizer_id, title, description, starts_at, capacity, status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Nepavyko įkelti veiklos: {error.message}
      </p>
    );
  }

  if (!veikla) {
    return <p className="text-foreground/70">Veikla nerasta</p>;
  }

  // Redaguoti gali tik kūrėjas; tą patį duomenų bazėje užtikrina ir RLS taisyklė.
  if (veikla.organizer_id !== vartotojoId) {
    return <p className="text-foreground/70">Tai ne jūsų veikla</p>;
  }

  return (
    <OrganizatoriausRedagavimoForma
      veiklosId={veikla.id}
      pradinisPavadinimas={veikla.title ?? ""}
      pradinisAprasymas={veikla.description ?? ""}
      vietuSkaicius={veikla.capacity}
      dataTekstu={formatuotiData(veikla.starts_at)}
    />
  );
}
