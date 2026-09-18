import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/app-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "תנאי שימוש — מסע המתמטיקס" },
      { name: "description", content: "תנאי השימוש באפליקציית מסע המתמטיקס." },
      { property: "og:title", content: "תנאי שימוש — מסע המתמטיקס" },
      { property: "og:description", content: "הכללים לשימוש באפליקציה, מטבעות המשחק ואחריות." },
    ],
  }),
  component: TermsPage,
});

function P({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-1 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function TermsPage() {
  return (
    <Screen title="תנאי שימוש">
      <div className="mt-2 grid gap-3 pb-28">
        <p className="text-sm text-muted-foreground">עודכן לאחרונה: ספטמבר 2026</p>

        <P title="השימוש באפליקציה">
          <p>
            האפליקציה ניתנת לשימוש אישי ולא מסחרי. אין להעתיק, לשכפל, לבצע הנדסה לאחור או להפיץ
            את התוכן ללא אישור בכתב.
          </p>
        </P>

        <P title="חשבון משתמש">
          <p>
            אתם אחראים לשמירת פרטי הכניסה שלכם. אסור להתחזות לאחרים, להשתמש בשמות פוגעניים או
            לנסות לשנות נתונים בדרכים שאינן דרך המשחק. חשבון שיפר את הכללים עלול להיחסם.
          </p>
        </P>

        <P title="מטבעות ופריטים במשחק">
          <p>
            מטבעות, גביעים, מדבקות, תיבות וכרטיסים הם פריטים וירטואליים ללא ערך כספי אמיתי. אין
            להם שער המרה לכסף, ואי אפשר להחזירם או להמירם.
          </p>
        </P>

        <P title="תוכן לימודי">
          <p>
            התרגילים וההסברים נועדו לתרגול ולהנאה בלבד ואינם מחליפים לימוד פורמלי או ייעוץ
            חינוכי מקצועי.
          </p>
        </P>

        <P title="הגבלת אחריות">
          <p>
            השירות ניתן כמות שהוא ("AS IS"). איננו מתחייבים לזמינות רציפה, להיעדר תקלות או
            לשמירה מוחלטת של נתונים, ואיננו אחראים לנזק עקיף, תוצאתי או לאובדן נתונים הנובע
            מהשימוש. מומלץ לשמור גיבוי דרך מסך ההגדרות.
          </p>
        </P>

        <P title="שינויים בשירות">
          <p>
            נוכל לעדכן, לשנות או להפסיק פיצ׳רים בכל עת, לרבות הוספת פיצ׳רים בתשלום בגרסאות
            עתידיות. המשך שימוש לאחר שינוי מהווה הסכמה לתנאים המעודכנים.
          </p>
        </P>

        <P title="דין וסמכות שיפוט">
          <p>על תנאים אלה יחולו דיני מדינת ישראל, וסמכות השיפוט הבלעדית נתונה לבתי המשפט בישראל.</p>
        </P>
      </div>
    </Screen>
  );
}
