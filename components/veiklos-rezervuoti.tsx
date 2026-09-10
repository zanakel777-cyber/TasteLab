"use client";

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

  async function reserve() {
    if (inFlight.current || refreshing || freeSpots <= 0) return;
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
      <button type="button" onClick={reserve} disabled={pending || refreshing || freeSpots <= 0} className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
        {pending || refreshing ? "Rezervuojama…" : freeSpots <= 0 ? "Vietų nebeliko" : "Rezervuoti"}
      </button>
      <p role={failed ? "alert" : "status"} className={failed ? "text-sm text-destructive" : "text-sm text-foreground"}>{message}</p>
    </div>
  );
}
