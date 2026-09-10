import Link from "next/link";
import { OrganizatoriausNaujaForma } from "@/components/organizatorius-nauja-forma";

export default function NaujaVeiklaPage() {
  return (
    <section className="flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/organizatorius"
          className="text-sm text-foreground/70 hover:underline"
        >
          ← Mano organizuojamos veiklos
        </Link>
        <h1 className="text-3xl font-semibold">Nauja veikla</h1>
      </div>

      <OrganizatoriausNaujaForma />
    </section>
  );
}
