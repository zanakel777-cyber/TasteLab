"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrganizatoriausNaujaForma() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState("8");
  const [klaida, setKlaida] = useState<string | null>(null);
  const [siunciama, setSiunciama] = useState(false);
  const router = useRouter();

  const kurti = async (e: React.FormEvent) => {
    e.preventDefault();
    setKlaida(null);

    const vietuSkaicius = Number(capacity);

    if (!title.trim()) {
      setKlaida("Įveskite veiklos pavadinimą");
      return;
    }
    if (!startsAt) {
      setKlaida("Nurodykite datą ir laiką");
      return;
    }
    if (!Number.isInteger(vietuSkaicius) || vietuSkaicius < 1) {
      setKlaida("Vietų skaičius turi būti sveikas skaičius, ne mažesnis už 1");
      return;
    }

    setSiunciama(true);

    try {
      const supabase = createClient();

      // organizer_id imamas iš prisijungusio vartotojo – to paties reikalauja ir RLS taisyklė.
      const { data: sesija } = await supabase.auth.getClaims();
      const vartotojoId = sesija?.claims?.sub;

      if (!vartotojoId) {
        setKlaida("Reikia prisijungti");
        return;
      }

      const { error } = await supabase.from("activities").insert({
        organizer_id: vartotojoId,
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        capacity: vietuSkaicius,
      });

      if (error) {
        setKlaida(`Nepavyko sukurti veiklos: ${error.message}`);
        return;
      }

      router.push("/organizatorius");
      router.refresh();
    } catch (error: unknown) {
      setKlaida(error instanceof Error ? error.message : "Įvyko klaida");
    } finally {
      setSiunciama(false);
    }
  };

  return (
    <form onSubmit={kurti} className="flex flex-col gap-5 max-w-xl">
      <div className="grid gap-2">
        <Label htmlFor="title">Pavadinimas</Label>
        <Input
          id="title"
          required
          value={title}
          placeholder="Šokolado degustacija"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Aprašymas</Label>
        <textarea
          id="description"
          rows={4}
          value={description}
          placeholder="Ką veiksime, kiek truks, ko atsinešti"
          onChange={(e) => setDescription(e.target.value)}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="image_url">Nuotraukos nuoroda (neprivaloma)</Label>
        <Input
          id="image_url"
          type="url"
          value={imageUrl}
          placeholder="https://..."
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="starts_at">Data ir laikas</Label>
        <Input
          id="starts_at"
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="capacity">Vietų skaičius</Label>
        <Input
          id="capacity"
          type="number"
          min={1}
          step={1}
          required
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <p className="text-xs text-foreground/60">
          Vėliau vietų skaičiaus pakeisti nebus galima.
        </p>
      </div>

      {klaida && <p className="text-sm text-red-500">{klaida}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={siunciama}>
          {siunciama ? "Kuriama…" : "Sukurti veiklą"}
        </Button>
      </div>
    </form>
  );
}
