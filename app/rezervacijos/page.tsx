import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { RezervacijosAtsaukti } from "@/components/rezervacijos-atsaukti";

type Reservation = {
  id: string;
  activity: { title: string; starts_at: string; status: string } | null;
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
    .select("id, activity:activities(title, starts_at, status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Reservation[]>();
  const now = Date.now();

  return (
    <>
      {error ? (
        <p role="alert" className="text-destructive">Nepavyko įkelti rezervacijų. Bandykite dar kartą.</p>
      ) : !reservations?.length ? (
        <p className="text-muted-foreground">Dar neturite rezervacijų. <Link href="/veiklos" className="underline">Peržiūrėti veiklas</Link></p>
      ) : (
        <div className="grid gap-4">
          {reservations.map(({ id, activity }) => (
            <article key={id} className="flex flex-col items-start gap-4 rounded-xl border bg-card p-6 text-card-foreground">
              <h2 className="break-words text-xl font-semibold">{activity?.title ?? "Veiklos duomenys nepasiekiami"}</h2>
              {activity && (
                <time dateTime={activity.starts_at}>
                  {new Date(activity.starts_at).toLocaleString("lt-LT", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Vilnius" })}
                </time>
              )}
              {activity?.status === "cancelled" ? (
                <span className="rounded-md bg-muted px-3 py-2 text-sm font-medium">Veikla atšaukta organizatoriaus</span>
              ) : (
                <>
                  {activity && <p className="text-sm text-muted-foreground">{new Date(activity.starts_at).getTime() < now ? "Veikla įvykusi" : "Veikla aktyvi"}</p>}
                  <RezervacijosAtsaukti reservationId={id} />
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
