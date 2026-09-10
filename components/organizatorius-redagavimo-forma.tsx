"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  veiklosId: string;
  pradinisPavadinimas: string;
  pradinisAprasymas: string;
  vietuSkaicius: number;
  dataTekstu: string;
};

export function OrganizatoriausRedagavimoForma({
  veiklosId,
  pradinisPavadinimas,
  pradinisAprasymas,
  vietuSkaicius,
  dataTekstu,
}: Props) {
  const [title, setTitle] = useState(pradinisPavadinimas);
  const [description, setDescription] = useState(pradinisAprasymas);
  const [klaida, setKlaida] = useState<string | null>(null);
  const [siunciama, setSiunciama] = useState(false);
  const router = useRouter();

  const issaugoti = async (e: React.FormEvent) => {
    e.preventDefault();
    setKlaida(null);

    if (!title.trim()) {
      setKlaida("Įveskite veiklos pavadinimą");
      return;
    }

    setSiunciama(true);

    try {
      const supabase = createClient();

      // Keičiam tik pavadinimą ir aprašymą; ar tai mūsų veikla, patikrina RLS taisyklė.
      const { error } = await supabase
        .from("activities")
        .update({
          title: title.trim(),
          description: description.trim() || null,
        })
        .eq("id", veiklosId);

      if (error) {
        setKlaida(`Nepavyko išsaugoti: ${error.message}`);
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
    <form onSubmit={issaugoti} className="flex flex-col gap-5 max-w-xl">
      <div className="grid gap-2">
        <Label htmlFor="title">Pavadinimas</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Aprašymas</Label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="starts_at_readonly">Data ir laikas</Label>
        <Input id="starts_at_readonly" value={dataTekstu} disabled readOnly />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="capacity_readonly">Vietų skaičius</Label>
        <Input
          id="capacity_readonly"
          value={vietuSkaicius}
          disabled
          readOnly
        />
        <p className="text-xs text-foreground/60">
          Datos ir vietų skaičiaus keisti negalima – jie nustatomi kuriant veiklą.
        </p>
      </div>

      {klaida && <p className="text-sm text-red-500">{klaida}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={siunciama}>
          {siunciama ? "Saugoma…" : "Išsaugoti"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/organizatorius")}
        >
          Atšaukti
        </Button>
      </div>
    </form>
  );
}
