"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function VeiklosRezervuoti({ activityId, freeSpots }: { activityId: string; freeSpots: number }) {
  const router = useRouter();
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  // Veikla atšaukta, nors puslapyje ji dar rodoma (pasenęs ekranas) – mygtukas užrakinamas.
  const [atsaukta, setAtsaukta] = useState(false);

  async function reserve() {
    if (inFlight.current || refreshing || atsaukta || freeSpots <= 0) return;
    inFlight.current = true;
    setPending(true);
    setMessage("");
    setFailed(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      const { error } = await supabase.rpc("reserve_seat", { activity_id: activityId });
      if (error) {
        setFailed(true);
        setMessage(error.message);
        // Sprendimą priima duomenų bazė (reserve_seat), sąsaja tik parodo rezultatą.
        if (error.message.includes("Veikla atšaukta")) setAtsaukta(true);
        return;
      }
      setMessage("Vieta rezervuota");
      startTransition(() => router.refresh());
    } catch {
      setFailed(true);
      setMessage("Nepavyko rezervuoti vietos. Bandykite dar kartą.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="sm" variant="outline" type="button" onClick={reserve} disabled={pending || refreshing || atsaukta || freeSpots <= 0} className="self-start">
        {pending || refreshing
          ? "Rezervuojama…"
          : atsaukta
            ? "Veikla atšaukta"
            : freeSpots <= 0
              ? "Vietų nebeliko"
              : "Rezervuoti"}
      </Button>
      <p role={failed ? "alert" : "status"} className={failed ? "text-sm text-destructive" : "text-sm text-foreground"}>{message}</p>
    </div>
  );
}
