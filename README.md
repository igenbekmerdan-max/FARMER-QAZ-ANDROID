# FARMER QAZ v2.1 — Smart Farm Platform

Қазақстан фермерлеріне арналған Firebase (Hosting, Firestore, Storage, Cloud Functions) және Offline-First IndexedDB негізіндегі цифрлық мал шаруашылығы платформасы.

## Маңызды ескерту (Production дайындығы туралы)
Бұл нұсқада v2 аудитінде анықталған барлық P0 (4) және P1 (6) ақаулар код деңгейінде түзетілді және статикалық/контракттық тексеруден өтті.
**Нақты фермерлер деректерімен өндіріске (Production) шығарар алдында** жергілікті ортада келесі қадамдарды орындау міндетті:
1. `node --check public/app.js && node --check public/sw.js && node --check functions/index.js`
2. `node tests/run_unit_tests.mjs`
3. `firebase emulators:start` арқылы Firestore Rules, Storage Rules және Cloud Functions (`recordVetTreatment`, `analyzeLivestockAI`, `approveMemberRole`, `transferOwnership`) сценарийлерін тікелей сынау.

## Орнату және іске қосу
```bash
cd functions
npm install
firebase functions:secrets:set GEMINI_API_KEY
firebase emulators:start
```


## v2.1.1 mobile preview note
HTML asset references are relative so the stylesheet and manifest resolve from the `public` folder. For full functionality, serve the `public` folder over HTTP(S) (for example Firebase Hosting). Opening `index.html` via Android `content://` is only a limited preview; ES modules, Firebase authentication, IndexedDB, and service-worker behavior must be validated from a served origin.
