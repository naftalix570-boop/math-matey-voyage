import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useGame } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function DeleteAccountButton() {
  const { deleteAccount, linked } = useGame();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
    } catch {
      setError("לא הצלחנו להשלים את המחיקה. בדקו את החיבור ונסו שוב.");
      setBusy(false);
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={(value) => { if (!busy) { setOpen(value); setError(null); } }}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="h-auto min-h-11 w-full whitespace-normal py-3 font-bold">
          <Trash2 aria-hidden="true" /> {linked ? "מחיקת חשבון" : "איפוס הנתונים שלי"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl" className="max-w-[min(32rem,calc(100%-2rem))] text-right">
        <AlertDialogHeader className="sm:text-right">
          <AlertDialogTitle>למחוק את החשבון והנתונים לצמיתות?</AlertDialogTitle>
          <AlertDialogDescription>
            {linked
              ? "החשבון וכל ההתקדמות המשויכת אליו בענן ובמכשיר הזה יימחקו לצמיתות: מטבעות, גביעים, מדבקות, משימות, הישגים ונתוני המשחק. לא ניתן לבטל את המחיקה או לשחזר את ההתקדמות."
              : "כל ההתקדמות של האורח במכשיר הזה תימחק לצמיתות. לא ניתן לבטל את המחיקה או לשחזר את הנתונים המקומיים. הפעולה אינה מוחקת קוד אורח השמור בענן."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={busy}>ביטול</AlertDialogCancel>
          <Button variant="destructive" disabled={busy} onClick={() => void confirm()} className="h-auto min-h-11 whitespace-normal">
            {busy ? "מוחקים…" : "כן, למחוק לצמיתות"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}