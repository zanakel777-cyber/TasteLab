import type { ReactNode } from "react";
import { formatuotiData, vietuZodis } from "@/components/organizatorius-veiklos-kortele";

export type KortelesVeikla = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  starts_at: string;
  capacity: number;
  reserved_count: number;
  free_spots: number;
};

const EMOJI = ["🍷", "🍫", "🍣", "🧁", "🍝", "🧀", "☕", "🥖"];

// `prigesinta` naudojama atšauktoms veikloms: nuotrauka ir tekstas prigesinami,
// bet `children` lizdas lieka ryškus, kad ženklas gerai matytųsi (CSS opacity paveldima,
// todėl prigesinam atskiras dalis, o ne visą kortelę).
export function VeiklosKortele({
  veikla,
  prigesinta = false,
  children,
}: {
  veikla: KortelesVeikla;
  prigesinta?: boolean;
  children: ReactNode;
}) {
  const uzimta = veikla.capacity > 0
    ? Math.max(0, Math.min(100, Math.round((veikla.reserved_count / veikla.capacity) * 100)))
    : 0;
  const emoji = EMOJI[Array.from(veikla.id).reduce((suma, raide) => suma + raide.charCodeAt(0), 0) % EMOJI.length];

  return (
    <article className="tl-card flex flex-col">
      {veikla.image_url?.trim() ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={veikla.image_url} alt={veikla.title} loading="lazy" className={`h-44 w-full object-cover ${prigesinta ? "opacity-60 grayscale" : ""}`} />
      ) : (
        <div className={`tl-image-fallback flex h-44 w-full items-center justify-center ${prigesinta ? "opacity-60 grayscale" : ""}`}>
          <span className="text-5xl" aria-hidden="true">{emoji}</span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className={`flex flex-col gap-3 ${prigesinta ? "opacity-70" : ""}`}>
          <h2 className="break-words text-lg font-semibold leading-snug">{veikla.title}</h2>
          <time dateTime={veikla.starts_at} className="text-sm text-muted-foreground">{formatuotiData(veikla.starts_at)}</time>
          {veikla.description && <p className="line-clamp-3 break-words text-sm text-foreground/80">{veikla.description}</p>}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {veikla.reserved_count} / {veikla.capacity} vietos užimtos → Liko {veikla.free_spots} {vietuZodis(veikla.free_spots)}
            </p>
            <div className="tl-progress" role="progressbar" aria-valuenow={veikla.reserved_count} aria-valuemin={0} aria-valuemax={veikla.capacity} aria-label="Užimtos vietos">
              <div className={`tl-progress-bar ${veikla.free_spots === 0 ? "tl-progress-bar-full" : ""}`} style={{ width: `${uzimta}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-auto pt-2">{children}</div>
      </div>
    </article>
  );
}
