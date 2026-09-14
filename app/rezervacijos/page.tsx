import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { VeiklosKortele, type KortelesVeikla } from "@/components/veiklos-kortele";
import { RezervacijosAtsaukti } from "@/components/rezervacijos-atsaukti";

type Reservation = {
  id: string;
  activity_id: string;
};

export default function RezervacijosPage() {
  return (
    <section className="flex flex-col gap-6 py-10">
      <h1 className="text-3xl font-semibold">Mano rezervacijos</h1>
      <Suspense fallback={<p className="text-muted-foreground">Kraunama…</p>}>
        <ManoRezervacijos />
      </Suspense>
    </section>
  );
}

// Duomenų dalis atskirai, nes ji skaito sesijos slapukus (cacheComponents reikalauja Suspense).
async function ManoRezervacijos() {
  // Sesija ir nukreipimas turi būti skaičiuojami tik gyvos užklausos metu,
  // kitaip statybos metu (be sesijos) įvykęs redirect patektų į iš anksto paruoštą puslapį.
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, activity_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Reservation[]>();
  const activityIds = [...new Set(reservations?.map(({ activity_id }) => activity_id) ?? [])];
  const { data: activities, error: activitiesError } = !error && activityIds.length
    ? await supabase.from("activities_public")
      .select("id, title, description, image_url, starts_at, capacity, reserved_count, free_spots, status")
      .in("id", activityIds)
      .returns<(KortelesVeikla & { status: string })[]>()
    : { data: null, error: null };
  const activitiesById = new Map(activities?.map((activity) => [activity.id, activity]));
  const now = Date.now();

  return (
    <>
      {error || activitiesError ? (
        <p role="alert" className="text-destructive">Nepavyko įkelti rezervacijų. Bandykite dar kartą.</p>
      ) : !reservations?.length ? (
        <p className="text-muted-foreground">Dar neturite rezervacijų. <Link href="/veiklos" className="underline">Peržiūrėti veiklas</Link></p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {reservations.map(({ id, activity_id }) => {
            const activity = activitiesById.get(activity_id);
            if (!activity) {
              return (
                <article key={id} className="tl-card flex flex-col gap-3 p-5">
                  <h2 className="text-lg font-semibold">Veiklos duomenys nepasiekiami</h2>
                  <RezervacijosAtsaukti reservationId={id} />
                </article>
              );
            }
            return (
              <VeiklosKortele key={id} veikla={activity} prigesinta={activity.status === "cancelled"}>
                {activity.status === "cancelled" ? (
                  <span className="tl-wine inline-block rounded-md border border-current px-3 py-2 text-sm font-semibold">Veikla atšaukta organizatoriaus</span>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">{new Date(activity.starts_at).getTime() < now ? "Veikla įvykusi" : "Veikla aktyvi"}</p>
                    <RezervacijosAtsaukti reservationId={id} />
                  </div>
                )}
              </VeiklosKortele>
            );
          })}
        </div>
      )}
    </>
  );
}
