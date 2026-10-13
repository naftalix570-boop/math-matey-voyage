import { Clover } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChestLuckToggle({ count, selected, onChange }: {
  count: number;
  selected: boolean;
  onChange: (selected: boolean) => void;
}) {
  return (
    <Button
      variant={selected ? "default" : "outline"}
      aria-pressed={selected}
      disabled={count <= 0}
      onClick={() => onChange(!selected)}
      className="min-h-11 w-full whitespace-normal"
    >
      <Clover aria-hidden="true" />
      {selected ? "אקסטרה מזל נבחר לתיבה הבאה" : "הוספת אקסטרה מזל"} · {count}
    </Button>
  );
}