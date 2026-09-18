import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "מדיניות פרטיות — מסע המתמטיקס" },
      { name: "description", content: "איך מסע המתמטיקס אוסף, שומר ומגן על נתוני המשתמשים." },
      { property: "og:title", content: "מדיניות פרטיות — מסע המתמטיקס" },
      { property: "og:description", content: "מידע על איסוף ושמירת נתונים באפליקציה." },
    ],
  }),
  component: PrivacyPage,
});

function P({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-1 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <Screen title="מדיניות פרטיות">
      <div className="mt-2 grid gap-3 pb-28">
        <p className="text-sm text-muted-foreground">עודכן לאחרונה: ספטמבר 2026</p>

        <P title="מי אנחנו">
          <p>
            "מסע המתמטיקס" היא אפליקציית משחקי חשבון לילדים. השימוש באפליקציה מהווה הסכמה
            למדיניות זו ולתנאי השימוש.
          </p>
        </P>

        <P title="איזה מידע נאסף">
          <p>• שם תצוגה, אימוג׳י ומדינה שהוזנו על ידכם.</p>
          <p>• נתוני התקדמות במשחק: שלב, גביעים, מטבעות, מדבקות והישגים.</p>
          <p>• כתובת אימייל — רק אם בחרתם להתחבר עם אימייל או עם חשבון גוגל.</p>
          <p>• איננו אוספים מיקום מדויק, אנשי קשר, תמונות או נתוני בריאות.</p>
        </P>

        <P title="למה המידע משמש">
          <p>
            לשמירת ההתקדמות בין מכשירים, להצגת טבלת המובילים (שם, אימוג׳י, מדינה ומספר גביעים
            בלבד), ולשיפור המשחק. איננו מוכרים מידע לצדדים שלישיים.
          </p>
        </P>

        <P title="שמירה ואבטחה">
          <p>
            הנתונים נשמרים במכשיר וגם בשרת מאובטח. הגישה לנתוני חשבון מוגבלת לבעל החשבון בלבד
            באמצעות הרשאות בצד השרת. עדכון גרסה אינו מוחק את ההתקדמות.
          </p>
        </P>

        <P title="ילדים">
          <p>
            האפליקציה מיועדת ללמידה לילדים. אנו ממליצים שההרשמה תתבצע על ידי הורה או אפוטרופוס.
            אפשר לשחק גם ללא הרשמה, כאורח, ואז הנתונים נשמרים במכשיר בלבד.
          </p>
        </P>

        <P title="מחיקת נתונים">
          <p>
            אפשר לאפס את ההתקדמות במסך ההגדרות. למחיקת חשבון ונתוניו מהשרת, שלחו בקשה לכתובת
            התמיכה ונטפל בה בתוך 30 יום.
          </p>
        </P>

        <P title="שינויים ויצירת קשר">
          <p>
            ייתכנו עדכונים למדיניות זו; הגרסה העדכנית תוצג תמיד במסך זה. לשאלות ולבקשות:
            <span dir="ltr"> support@math-matey-voyage.lovable.app</span>
          </p>
        </P>
      </div>
    </Screen>
  );
}
