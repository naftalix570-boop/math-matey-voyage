import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountPrivacyLinks } from "@/components/account-privacy-links";

export const Route = createFileRoute("/delete-account")({
  head: () => ({ meta: [
    { title: "מחיקת חשבון ונתונים — מסע המתמטיקס" },
    { name: "description", content: "כיצד למחוק את החשבון והתקדמות המשחק במסע המתמטיקס, באפליקציה או באמצעות בקשת הורה באימייל." },
    { property: "og:title", content: "מחיקת חשבון ונתונים — מסע המתמטיקס" },
    { property: "og:description", content: "הנחיות למחיקת חשבון והתקדמות המשחק לצמיתות." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <main dir="rtl" className="screen-pad mx-auto min-h-screen max-w-lg bg-background text-ink">
      <h1 className="py-4 text-center text-[22px] font-bold">מחיקת חשבון ונתונים</h1>
      <div className="space-y-5 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold">מחיקה מתוך מסע המתמטיקס</h2>
          <ol className="list-inside list-decimal space-y-2">
            <li>התחברו לחשבון שברצונכם למחוק.</li>
            <li>פתחו את ההגדרות או את אזור ההורים.</li>
            <li>לחצו על „מחיקת חשבון ונתונים”.</li>
            <li>קראו את האזהרה ואשרו „כן, למחוק לצמיתות”.</li>
          </ol>
          <p className="mt-2">החשבון, הפרופיל, הניקוד, מימושי קודים, פרסי האלבום וקודי האורח המשויכים לחשבון יימחקו לצמיתות. ההתקדמות במכשיר הנוכחי תימחק ותוחזרו למסך ההתחלה. לא ניתן לשחזר את הנתונים.</p>
          <p className="mt-2">לאורח ללא חשבון, הכפתור מוחק רק את הנתונים המקומיים במכשיר; הוא אינו מוחק קוד אורח בענן.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold">בקשה באימייל</h2>
          <p>הורה או אפוטרופוס יכולים לבקש מחיקת חשבון או נתוני אורח באימייל אל <bdi>naftalix570@gmail.com</bdi>. ציינו את הכינוי וקוד האורח, או פנו מכתובת האימייל המשויכת לחשבון. אל תשלחו סיסמה או קוד מעבר חד־פעמי. לפני המחיקה נבקש לאמת שהנתונים שייכים לכם.</p>
        </section>
        <Link to="/settings" className="inline-block py-2 font-bold text-primary underline">פתיחת ההגדרות</Link>
        <AccountPrivacyLinks />
        <Link to="/" className="inline-block py-2 text-primary underline">חזרה למסך ההתחלה</Link>
      </div>
    </main>
  );
}