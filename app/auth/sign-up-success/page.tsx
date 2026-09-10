import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Paskyra sukurta – galite prisijungti
              </CardTitle>
              <CardDescription>Registracija sėkminga</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                El. pašto patvirtinti nereikia – prisijunkite tuo pačiu el. paštu
                ir slaptažodžiu.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login">Prisijungti</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
