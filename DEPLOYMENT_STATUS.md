# FARMER QAZ v2.1.2 — Deployment status

## Repository update
- Firebase Web configuration for project `farmer-qaz` is embedded in `public/index.html`.
- Firebase CLI default project is set to `farmer-qaz` in `.firebaserc`.
- Hosting, Firestore rules/indexes, Storage rules, and Cloud Functions deployment configuration are present in the repository.
- Local source validation and 10 included contract/unit tests passed for the supplied v2.1.2 archive.

## Not yet deployed to Firebase
This GitHub commit does not publish the app to Firebase. Firebase Hosting, Firestore rules/indexes, Storage rules, and Cloud Functions still require an authenticated Firebase deployment and live smoke tests.

## Remaining production actions
1. Enable Email/Password in Firebase Authentication.
2. Create the Cloud Firestore database in the intended region.
3. Confirm Firebase Storage is enabled.
4. Set `GEMINI_API_KEY` using Firebase Secret Manager before deploying Functions that use it.
5. Deploy Hosting, Firestore rules/indexes, Storage, and Functions.
6. Test registration/login, farm creation, animal create/read, photo upload, and AI analysis in the live project.

Do not treat local tests as proof that the production Firebase project is live.
