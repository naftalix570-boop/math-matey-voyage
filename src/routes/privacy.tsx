import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountPrivacyLinks } from "@/components/account-privacy-links";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "מדיניות פרטיות — מסע המתמטיקס" },
    { name: "description", content: "פרטיות ילדים במסע המתמטיקס: המידע שנשמר, שמירת התקדמות בענן וזכויות הורים לעיון, תיקון ומחיקת נתונים." },
    { property: "og:title", content: "מדיניות פרטיות — מסע המתמטיקס" },
    { property: "og:description", content: "מידע על נתוני המשחק, פרטיות ילדים ומחיקת חשבון." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main dir="rtl" className="screen-pad mx-auto min-h-screen max-w-lg bg-background text-ink">
      <h1 className="py-4 text-center text-[22px] font-bold">מדיניות פרטיות</h1>
      <div className="space-y-5 text-sm leading-relaxed">
        <p className="text-muted-foreground">עודכן לאחרונה: 22 באוקטובר 2026</p>
        <section>
          <h2 className="text-lg font-bold">מי אנחנו</h2>
          <p>מסע המתמטיקס היא אפליקציה לילדים הלומדים חשבון באמצעות משחקים. אנו ממליצים שההורה או האפוטרופוס ילווה את ההרשמה והשימוש.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold">איזה מידע נשמר</h2>
          <p>נשמרים כינוי השחקן, האייקון והמדינה שנבחרו, והתקדמות המשחק: מטבעות, גביעים, מדבקות, משימות, הישגים, נתוני תשובות וזמן משחק.</p>
          <p>בהתחברות עם Google, כתובת האימייל משמשת לזיהוי החשבון ולשמירת ההתקדמות בענן. כך נשמרת התקדמות גם בחיבור מחשבון זה במכשיר אחר. כך גם באפשרויות ההתחברות האחרות הקיימות באפליקציה.</p>
          <p>שחקני אורח מקבלים קוד אקראי ללא כתובת אימייל. ההתקדמות נשמרת במכשיר, וכאשר נוצר קוד אורח היא נשמרת גם בענן לצורך שחזור והצגת ניקוד.</p>
          <p>לא נאספים מיקום מדויק, אנשי קשר, תמונות או מידע מהמיקרופון. אם נשלח דיווח תקלה, נשמרים גם תוכן הדיווח ומידע טכני על המכשיר והגרסה. לצורך אבטחה עשויים להישמר רישומי בקשות וכתובת IP.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold">שימוש במידע ושיתוף</h2>
          <p>המידע משמש לשמירת התקדמות ולפעולת המשחק. בטבלת המובילים מוצגים כינוי, אייקון, מדינה וניקוד; כתובת האימייל אינה מוצגת שם.</p>
          <p>הנתונים אינם נמכרים ואינם משותפים לצורכי פרסום. כיום אין באפליקציה פרסומות או רכישות בתוך האפליקציה בכסף אמיתי; החנות הפנימית משתמשת במטבעות משחק בלבד.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold">אחסון ואבטחה</h2>
          <p>הנתונים נשמרים במכשיר ובמסד נתונים בענן, ומועברים בחיבורים מוצפנים. הגישה לנתוני החשבון מוגבלת באמצעות אימות והרשאות.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold">זכויות הורים ומחיקת נתונים</h2>
          <p>הורים ואפוטרופוסים יכולים לבקש לעיין בנתונים, לתקן אותם או למחוק אותם. למחיקה ישירה פתחו את ההגדרות או אזור ההורים ולחצו „מחיקת חשבון ונתונים”; הפעולה דורשת אישור ומוחקת לצמיתות את החשבון וההתקדמות המשויכת אליו.</p>
          <p>לאורח, הכפתור מוחק רק את הנתונים במכשיר הנוכחי. למחיקת נתוני קוד אורח בענן, או לבקשת עיון ותיקון, פנו באימייל אל <bdi>[CONTACT_EMAIL_PLACEHOLDER]</bdi>.</p>
          <p className="text-muted-foreground">כתובת יצירת הקשר טרם הוגדרה; פנייה באימייל עדיין אינה זמינה.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold">עדכונים למדיניות</h2>
          <p>המדיניות תעודכן בעמוד זה, והגרסה העדכנית תוצג כאן.</p>
        </section>
        <AccountPrivacyLinks />
        <Link to="/" className="inline-block py-2 text-primary underline">חזרה למסך ההתחלה</Link>
      </div>
    </main>
  );
}