import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Viena eilutė iš rodinio activities_public (veikla kartu su vietų skaičiais). */
export type Veikla = {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  starts_at: string;
  capacity: number;
  status: "active" | "cancelled";
  created_at: string;
  reserved_count: number;
  free_spots: number;
};

/** Lietuviška „vieta / vietos / vietų“ forma pagal skaičių. */
export function vietuZodis(skaicius: number) {
  const paskutinis = skaicius % 10;
  const priespaskutiniai = skaicius % 100;

  if (paskutinis === 0 || (priespaskutiniai >= 11 && priespaskutiniai <= 19)) {
    return "vietų";
  }
  if (paskutinis === 1) {
    return "vieta";
  }
  return "vietos";
}

/** Data ir laikas lietuvišku formatu, pvz. „2026 m. rugsėjo 20 d. 18:00“. */
export function formatuotiData(isoData: string) {
  return new Date(isoData).toLocaleString("lt-LT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Vilnius",
  });
}

/** Veiklos būsena: atšaukta, jau įvykusi ar dar aktyvi. */
export function veiklosBusena(veikla: Pick<Veikla, "status" | "starts_at">) {
  if (veikla.status === "cancelled") {
    return { tekstas: "Atšaukta", variantas: "destructive" as const };
  }
  if (new Date(veikla.starts_at) <= new Date()) {
    return { tekstas: "Įvykusi", variantas: "secondary" as const };
  }
  return { tekstas: "Aktyvi", variantas: "default" as const };
}

const EMOJI = ["🍷", "🍫", "🍣", "🧁", "🍝", "🧀", "☕", "🥖"];

/** Kai nuotraukos nuorodos nėra, parenkam pastovų emoji pagal veiklos id. */
function veiklosEmoji(id: string) {
  let suma = 0;
  for (const raide of id) {
    suma += raide.charCodeAt(0);
  }
  return EMOJI[suma % EMOJI.length];
}

export function OrganizatoriausVeiklosKortele({ veikla }: { veikla: Veikla }) {
  const busena = veiklosBusena(veikla);
  const uzimta =
    veikla.capacity > 0
      ? Math.min(100, Math.round((veikla.reserved_count / veikla.capacity) * 100))
      : 0;
  const pilna = veikla.free_spots === 0;

  return (
    <article className="tl-card flex flex-col">
      {veikla.image_url ? (
        // Organizatorių nuotraukų nuorodos gali būti iš bet kurio serverio, todėl paprastas <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={veikla.image_url}
          alt={veikla.title}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="tl-image-fallback flex h-44 w-full items-center justify-center">
          <span className="text-5xl" aria-hidden="true">
            {veiklosEmoji(veikla.id)}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="break-words text-lg font-semibold leading-snug">
            {veikla.title}
          </h3>
          <Badge variant={busena.variantas}>{busena.tekstas}</Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {formatuotiData(veikla.starts_at)}
        </p>

        {veikla.description && (
          <p className="line-clamp-3 text-sm text-foreground/80">
            {veikla.description}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            {veikla.reserved_count} / {veikla.capacity} vietos užimtos → Liko{" "}
            {veikla.free_spots} {vietuZodis(veikla.free_spots)}
          </p>

          <div
            className="tl-progress"
            role="progressbar"
            aria-valuenow={veikla.reserved_count}
            aria-valuemin={0}
            aria-valuemax={veikla.capacity}
            aria-label="Užimtos vietos"
          >
            <div
              className={`tl-progress-bar ${pilna ? "tl-progress-bar-full" : ""}`}
              style={{ width: `${uzimta}%` }}
            />
          </div>
        </div>

        <div className="mt-auto pt-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/organizatorius/${veikla.id}/redaguoti`}>
              Redaguoti
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
