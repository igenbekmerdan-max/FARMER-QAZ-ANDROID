# FARMER QAZ v2.1.2 — Android APK әзірлеу

Бұл архив қолданыстағы веб-қосымшаны Capacitor арқылы Android APK форматына орауға дайындалған.

- Қосымша атауы: FARMER QAZ
- Android application ID: `kz.farmerqaz.app`
- Негізгі код: `public/` (бар функциялары сақталған)
- Қаптама технологиясы: Capacitor 7

## APK құрастыру
Компьютерге Node.js 20+, Android Studio, Android SDK және JDK 17 орнатыңыз. Одан кейін жоба бумасында:

```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

Android Studio Gradle синхрондауын аяқтаған соң **Build > Build Bundle(s) / APK(s) > Build APK(s)** таңдаңыз.

Дайын Debug APK жолы:
`android/app/build/outputs/apk/debug/app-debug.apk`

Толық нұсқа: `ANDROID_BUILD.md`.

Ескерту: бұл архив Android Studio-да APK құрастыруға дайындалған жоба. APK-ның өзі әлі құрастырылған жоқ. Firebase ортасын және нақты Android құрылғысындағы камера, офлайн режим, синхрондау жұмысын бөлек сынау қажет.
