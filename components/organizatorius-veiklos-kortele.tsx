import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

export function OrganizatoriausVeiklosKortele({ veikla }: { veikla: Veikla }) {
  const busena = veiklosBusena(veikla);

  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">{veikla.title}</CardTitle>
          <Badge variant={busena.variantas}>{busena.tekstas}</Badge>
        </div>
        <p className="text-sm text-foreground/70">
          {formatuotiData(veikla.starts_at)}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 flex-1">
        {veikla.description && (
          <p className="text-sm text-foreground/80 line-clamp-3">
            {veikla.description}
          </p>
        )}

        <p className="text-sm font-medium">
          {veikla.reserved_count} / {veikla.capacity} vietos užimtos → Liko{" "}
          {veikla.free_spots} {vietuZodis(veikla.free_spots)}
        </p>

        <div className="mt-auto pt-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/organizatorius/${veikla.id}/redaguoti`}>
              Redaguoti
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
