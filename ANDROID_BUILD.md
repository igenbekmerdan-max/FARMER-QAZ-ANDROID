# FARMER QAZ Android APK build guide

## Project
- App ID: `kz.farmerqaz.app`
- App name: `FARMER QAZ`
- Web source: `public/` (existing v2.1.2 app preserved)
- Wrapper: Capacitor 7

## Requirements
- Node.js 20+
- Android Studio (current stable)
- Android SDK Platform + Build Tools (installed via SDK Manager)
- JDK 17 (Android Studio bundled JBR is recommended)

## Build on a computer with internet access
1. Extract this archive.
2. Open a terminal in the extracted project folder.
3. Run `npm install`.
4. Run `npx cap add android` (first time only).
5. Run `npx cap sync android`.
6. Run `npx cap open android`.
7. In Android Studio, allow Gradle sync and install any prompted SDK components.
8. For a test APK: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
9. APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.

For a release APK, create a signing key in Android Studio (Build > Generate Signed Bundle / APK), choose APK, and keep the keystore/private key secure. Do not commit signing secrets.

## Backend note
This wrapper packages the web frontend only. Firebase Hosting / Firestore / Storage / Cloud Functions still need a correctly configured Firebase project and deployment. The APK does not automatically create Firebase credentials or deploy backend resources.

## Validation still required
- Android device camera/gallery permissions and image capture.
- Firebase Authentication, Firestore, Storage and Cloud Functions against the real Firebase project.
- IndexedDB persistence, offline queue/retry and reconnect behavior in Android WebView.
- Service Worker behavior inside the Capacitor WebView (PWA service-worker assumptions may differ).
- Physical-device smoke test on at least one supported Android version.
