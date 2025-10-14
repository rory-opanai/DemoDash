import { Info } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

export function TooltipIcon({ text }: { text: string }) {
  return (
    <Tooltip content={text}>
      <span className="inline-flex h-5 w-5 items-center justify-center text-muted-foreground">
        <Info className="h-4 w-4" />
      </span>
    </Tooltip>
  );
}


