import { createClient } from "@/lib/supabase/server";
import { VeiklosRezervuoti } from "@/components/veiklos-rezervuoti";

export default async function VeiklosPage() {
  const supabase = await createClient();
  const { data: activities, error } = await supabase
    .from("activities_public")
    .select("id, title, description, image_url, starts_at, capacity, reserved_count, free_spots")
    .eq("status", "active")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  return (
    <section className="flex flex-col gap-6 py-10">
      <h1 className="text-3xl font-semibold">Veiklos</h1>
      {error ? (
        <p role="alert" className="text-destructive">Nepavyko įkelti veiklų. Bandykite dar kartą.</p>
      ) : !activities?.length ? (
        <p className="text-muted-foreground">Šiuo metu būsimų veiklų nėra.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {activities.map((activity) => (
            <article key={activity.id} className="flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground">
              {activity.image_url && (
                // Organizatorių nuotraukų nuorodos gali būti iš bet kurio serverio.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activity.image_url} alt={activity.title} loading="lazy" className="h-52 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col gap-4 p-6">
                <h2 className="break-words text-xl font-semibold">{activity.title}</h2>
                <p className="whitespace-pre-line break-words text-muted-foreground">{activity.description}</p>
                <time dateTime={activity.starts_at}>
                  {new Date(activity.starts_at).toLocaleString("lt-LT", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Vilnius" })}
                </time>
                <p>{activity.reserved_count} / {activity.capacity} vietos užimtos → Liko {activity.free_spots} vietos</p>
                <div className="mt-auto"><VeiklosRezervuoti activityId={activity.id} freeSpots={activity.free_spots} /></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
