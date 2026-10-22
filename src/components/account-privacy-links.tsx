import { Link } from "@tanstack/react-router";

export function AccountPrivacyLinks() {
  return (
    <div dir="rtl" className="flex flex-wrap justify-center gap-x-5 gap-y-2 py-3 text-sm text-primary">
      <Link to="/privacy" className="underline">מדיניות פרטיות</Link>
      <Link to="/delete-account" className="underline">מחיקת חשבון ונתונים</Link>
    </div>
  );
}