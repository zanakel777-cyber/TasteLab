"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function OrganizatoriausAtsauktiVeikla({ veiklosId }: { veiklosId: string }) {
  const router = useRouter();
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [cancelled, setCancelled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function atsaukti() {
    if (inFlight.current || refreshing || cancelled) return;
    if (!window.confirm("Atšaukti veiklą? Dalyviai pamatys, kad ji atšaukta.")) return;

    inFlight.current = true;
    setPending(true);
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        setErrorMessage("Nepavyko patikrinti prisijungimo. Bandykite dar kartą.");
        return;
      }
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("activities")
        .update({ status: "cancelled" })
        .eq("id", veiklosId)
        .eq("organizer_id", user.id)
        .eq("status", "active")
        .gt("starts_at", new Date().toISOString())
        .select("id")
        .maybeSingle();

      if (error) {
        setErrorMessage("Nepavyko atšaukti veiklos. Bandykite dar kartą.");
        return;
      }
      if (!data) {
        setErrorMessage("Veiklos atšaukti nepavyko: ji jau prasidėjo, buvo atšaukta arba neturite teisės jos keisti.");
        startTransition(() => router.refresh());
        return;
      }

      setCancelled(true);
      startTransition(() => router.refresh());
    } catch {
      setErrorMessage("Nepavyko atšaukti veiklos. Bandykite dar kartą.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" size="sm" variant="outline" onClick={atsaukti} disabled={pending || refreshing || cancelled}>
        {pending || refreshing || cancelled ? "Atšaukiama…" : "Atšaukti veiklą"}
      </Button>
      {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
}
