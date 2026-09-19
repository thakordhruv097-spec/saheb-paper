# App Release & Version Update Protocol for Saheb Paper ERP

## 1. Core Rule: Decoupled Development & App Updates
- **Do NOT release an application update on routine code changes or git pushes.**
- Normal bug fixes, design adjustments, and new features must be developed, tested, and pushed to GitHub `main` WITHOUT triggering an update alert on workers' installed devices.
- As long as `public/version.json` is not modified, workers will continue using the installed app smoothly without any interruption, sound, or notification.

---

## 2. When to Release an Application Update
- **ONLY** release an update when the user **explicitly commands** it, for example:
  - *"Ab application me update bhej do"*
  - *"App update release karo: vBeta 1.3"*
  - *"Update send kardo workers ke liye"*
- If the user says *"Git pe push kardo par update mat bhejna"*, simply commit and push your code without touching `public/version.json`.

---

## 3. Mandatory Steps for Releasing an App Update
When the user explicitly commands to release an update:

1. **Increment Version & Version Code in `public/version.json`**:
   - Increase `versionCode` by +1 (e.g., from `8` to `9`).
   - Update `version` string (e.g., `"Beta 1.3"`).
   - Set current `releaseDate`.
   - Add concise highlights of what changed in the `highlights` array.
   - Update `apkUrl` and `exeUrl` versions if applicable.

2. **Update Fallback Info in `src/components/AppUpdateModal.tsx`**:
   - Update `DEFAULT_UPDATE_INFO` with matching `version` and `versionCode`.
   - Update fallback version in `markVersionInstalled(...)` inside `handleStartUpdate`.

3. **Verify Build & Sync Android**:
   ```bash
   cmd.exe /c "npm run build"
   cmd.exe /c "npx cap sync android"
   cmd.exe /c "cd android && gradlew.bat assembleDebug"
   ```

4. **Commit and Push to GitHub `main`**:
   ```bash
   git add public/version.json src/components/AppUpdateModal.tsx
   git commit -m "release: release version <VERSION_NAME>"
   git push origin main
   ```

---

## 4. What Happens on Workers' Devices After Release
- The app checks for updates in the background (and when the worker opens the app).
- When `versionCode` increases on GitHub, the app:
  1. 🔊 Plays the audible dual-tone chime (E5 $\to$ A5).
  2. 📳 Triggers gentle haptic pulse vibration.
  3. 📲 Displays a non-intrusive floating toast: `Update Available: v<VERSION> — Tap to view & install`.
  4. 🔔 Lights up the notification badge on the top bar Bell icon.
  5. In Update Center, changes the action button to `Install (v <VERSION>)`.
