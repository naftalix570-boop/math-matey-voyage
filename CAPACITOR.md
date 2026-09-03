# בניית אפליקציה לחנויות (Capacitor) — מסע המתמטיקס

האפליקציה עוטפת את האתר המפורסם `https://math-matey-voyage.lovable.app`.
**לא צריך דומיין משלך ולא צריך אחסון** — הכל כבר רץ אצל Lovable.
כל החיבורים לשרת, ההתחברות וטבלת הניקודים העולמית ממשיכים לעבוד בדיוק כמו באתר.

## מה כבר מוכן בפרויקט

- `capacitor.config.json` — appId `app.lovable.mathjourney`, שם עברי, ספלאש, סטטוס בר, וטעינה מהאתר המפורסם.
- תוספי Capacitor: App, Browser, SplashScreen, StatusBar.
- `src/components/native-bridge.tsx` — כפתור "חזור" של אנדרואיד, הסתרת ספלאש, וקליטת ההתחברות מגוגל.
- התחברות גוגל מותאמת לאפליקציה (ראו למטה).

## שלבי בנייה (על המחשב שלך)

1. יצוא הפרויקט ל-GitHub ואז `git clone` למחשב.
2. `npm install`
3. `npx cap add android` (ואם רוצים iOS, על מק: `npx cap add ios`)
4. `npm run build`
5. `npx cap sync`
6. `npx cap open android` → Android Studio → Build > Build APK / Generate Signed Bundle (AAB לחנות).
   ל-iOS: `npx cap open ios` → Xcode (דורש מק + חשבון Apple Developer, 99$ לשנה).

## התחברות עם גוגל באפליקציה

גוגל חוסמת התחברות בתוך WebView, לכן באפליקציה הכפתור פותח את הדפדפן של המכשיר,
ואחרי ההתחברות המערכת מחזירה את הסשן לאפליקציה דרך קישור `mathjourney://auth`.

כדי שזה יעבוד צריך להוסיף פעם אחת ב-Android Studio, בתוך
`android/app/src/main/AndroidManifest.xml`, בתוך ה-`<activity>` הראשי:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="mathjourney" />
</intent-filter>
```

ב-iOS (Xcode): Info > URL Types > URL Schemes = `mathjourney`.

התחברות עם אימייל וסיסמה עובדת באפליקציה ללא כל הגדרה נוספת.

## עדכונים

כי האפליקציה טוענת את האתר החי — כל שינוי שתפרסם ב-Lovable מופיע מיד למשתמשים,
בלי להעלות גרסה חדשה לחנות. גרסה חדשה לחנות צריך רק כשמשנים אייקון/שם/הרשאות.

## שים לב לתשלומים

אם תמכור בעתיד מטבעות/פרימיום בתוך אפליקציית Play או App Store,
החנויות מחייבות שימוש במערכת התשלומים שלהן (עמלה ~15%).
