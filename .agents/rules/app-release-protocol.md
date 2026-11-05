# App Release & Over-The-Air (OTA) Update Protocol for Saheb Paper ERP

## 1. Absolute Core Rules
- **NEVER generate or build new APKs on git push or routine code changes.**
- **NEVER create GitHub Releases with APK assets on routine updates.**
- **NEVER open Chrome browser or external download links for updates.**
- **The user uses 1 single installed APK on their mobile device.**
- All updates are **Over-The-Air (OTA)**: changes pushed to `main` deploy to GitHub Pages, and the installed app receives the updates directly in-app.

---

## 2. Decoupled Development & Deployments
- **Collaborator Rule (Rudra & Dhruv)**:
  - Both Rudra and Dhruv use Antigravity to make changes to the application (UI, PDF templates, label printing, logic).
  - When committing and pushing changes:
    - Normal bug fixes and tweaks can be pushed to `main` without releasing an update prompt, as long as `public/version.json` is not bumped.
    - GitHub Actions will ONLY run `.github/workflows/deploy.yml` (deploy to GitHub Pages).
    - All APK build workflows (`build-apk.yml`) and scripts (`build_apk.bat`) have been permanently deleted from the repository.
    - Neither Antigravity, Rudra, nor Dhruv should ever recreate APK build scripts or workflows. Updates are strictly web-deployed OTA to GitHub Pages.

---

## 3. How to Release an In-App Update
When the user explicitly asks for an update (e.g. *"Ab update bhej do"* / *"Give me update on 1.10.x"*):

1. **Increment Version & Version Code**:
   - `public/version.json`: bump `versionCode` by +1 and update `version` (e.g., `"Beta 1.10.11"`).
   - `src/config/version.ts`: update `APP_BASE_VERSION` and `APP_BASE_CODE`.
   - `src/services/appUpdateService.ts`: update `DEFAULT_CLIENT_VERSION` and `DEFAULT_CLIENT_VERSION_CODE`.
   - `src/components/AppUpdateModal.tsx`: update `DEFAULT_UPDATE_INFO`.
   - `package.json`: bump version string.
   - `android/app/build.gradle`: keep `versionCode` and `versionName` synchronized.

2. **Verify Clean Production Build**:
   ```bash
   npm run build
   ```

3. **Synchronize Capacitor**:
   ```bash
   npx cap sync android
   ```

4. **Commit & Push to GitHub `main`**:
   ```bash
   git add .
   git commit -m "feat(update): release version <VERSION_NAME>"
   git push origin main
   ```

---

## 4. In-App Update Behavior on Mobile Devices
- The installed app checks `https://thakordhruv097-spec.github.io/saheb-paper/version.json`.
- When an update is detected:
  1. The app displays an in-app banner/modal: `Version <VERSION> Available`.
  2. When the user taps **Install (v <VERSION>)**:
     - The app runs a smooth in-app progress update.
     - Old service worker caches are cleared via `clearAppCaches()`.
     - `markVersionInstalled(...)` stores the new version code in local storage.
     - The app reloads in-place via `window.location.reload()`.
     - **No Chrome browser opens. No APK file is downloaded. No package conflicts occur.**
