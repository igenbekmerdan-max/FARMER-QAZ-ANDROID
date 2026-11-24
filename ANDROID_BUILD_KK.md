# FARMER QAZ v2.1.2 — Android APK дайындау

Бұл жоба Capacitor арқылы Android WebView қосымшасына оралады. Веб-қосымшаның `public/` файлдары APK ішіне бірге салынады. Сондықтан бастапқы экран интернетсіз ашылады; Firebase-тің онлайн функциялары үшін Firebase Web Config және интернет қажет.

## APK алу (GitHub Actions)

1. Осы архивті GitHub-тағы өз репозиторийіңе жүкте.
2. Репозиторийдің әдепкі тармағы `main` болсын.
3. GitHub → **Actions** → **Build FARMER QAZ Android APK** → **Run workflow** таңда.
4. Жасыл аяқталған workflow ішінен **Artifacts** бөліміндегі `FARMER-QAZ-v2.1.2-debug-APK` архивін жүкте.
5. Архивті ашып, `app-debug.apk` файлын Android телефонына көшіріп орнат.

`push` болған сайын `main` тармағында да автоматты құрастыру басталады.

## Маңызды

- Бұл workflow **debug APK** жасайды. Ол құрылғыда сынауға арналған; Google Play-ге жариялау үшін бөлек release signing қажет.
- APK-ны нақты Firebase жобасымен тексеру керек. Firebase конфигурациясы қолданба ішіндегі баптау терезесіне енгізіледі.
- Gemini API кілтін APK ішіне салма. Ол Firebase Cloud Functions Secret Manager ішінде қалуы керек.
- Android құрылғысында камера/галерея, кіру, тіркелу, IndexedDB, синхрондау және офлайн сценарийлерін бөлек тексер.
- PWA Service Worker native Capacitor WebView ішінде әдейі тіркелмейді: бастапқы web-файлдар APK ішінде сақталады. Браузердегі PWA нұсқасы бұрынғыдай Service Worker қолданады.
