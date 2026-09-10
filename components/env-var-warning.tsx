import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function EnvVarWarning() {
  return (
    <div className="flex gap-4 items-center">
      <Badge variant={"outline"} className="font-normal">
        Trūksta Supabase aplinkos kintamųjų
      </Badge>
      <div className="flex gap-2">
        <Button size="sm" variant={"outline"} disabled>
          Prisijungti
        </Button>
        <Button size="sm" variant={"default"} disabled>
          Registruotis
        </Button>
      </div>
    </div>
  );
}
