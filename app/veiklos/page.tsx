import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { VeiklosKortele } from "@/components/veiklos-kortele";
import { VeiklosRezervuoti } from "@/components/veiklos-rezervuoti";

export default function VeiklosPage() {
  return (
    <section className="flex flex-col gap-6 py-10">
      <h1 className="text-3xl font-semibold">Veiklos</h1>
      <Suspense fallback={<p className="text-muted-foreground">Kraunama…</p>}>
        <VeiklosSarasas />
      </Suspense>
    </section>
  );
}

// Duomenų dalis atskirai, nes ji skaito sesijos slapukus (cacheComponents reikalauja Suspense).
async function VeiklosSarasas() {
  // Sąrašas skaitomas tik gyvos užklausos metu, kad nebūtų rodomi statybos metu paruošti duomenys.
  await connection();

  const supabase = await createClient();
  const { data: activities, error } = await supabase
    .from("activities_public")
    .select("id, title, description, image_url, starts_at, capacity, reserved_count, free_spots")
    .eq("status", "active")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  return (
    <>
      {error ? (
        <p role="alert" className="text-destructive">Nepavyko įkelti veiklų. Bandykite dar kartą.</p>
      ) : !activities?.length ? (
        <p className="text-muted-foreground">Šiuo metu būsimų veiklų nėra.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {activities.map((activity) => (
            <VeiklosKortele key={activity.id} veikla={activity}>
              <VeiklosRezervuoti activityId={activity.id} freeSpots={activity.free_spots} />
            </VeiklosKortele>
          ))}
        </div>
      )}
    </>
  );
}
