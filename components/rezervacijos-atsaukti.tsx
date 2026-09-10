"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RezervacijosAtsaukti({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  async function cancel() {
    if (inFlight.current || refreshing) return;
    inFlight.current = true;
    setPending(true);
    setErrorMessage("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      const { error } = await supabase.from("reservations").delete().eq("id", reservationId).eq("user_id", user.id);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setErrorMessage("Nepavyko atšaukti rezervacijos. Bandykite dar kartą.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={cancel} disabled={pending || refreshing} className="rounded-md border px-4 py-2 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
        {pending || refreshing ? "Atšaukiama…" : "Atšaukti rezervaciją"}
      </button>
      <p role="alert" className="text-sm text-destructive">{errorMessage}</p>
    </div>
  );
}
