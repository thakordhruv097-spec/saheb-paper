# Instructions for Antigravity & Collaborators (Dhruv & Rudra)

## Saheb Paper ERP Core Rules

### 1. Single APK Architecture (No APK Building)
- The user uses a **single installed APK** on their mobile device.
- **NEVER** build APKs locally or in CI/CD.
- **NEVER** create GitHub release workflows that build or release APK files (`.github/workflows/build-apk.yml` and `build_apk.bat` are permanently removed).
- **NEVER** open Chrome browser or trigger external browser downloads (`window.open` with APK download links is forbidden).

### 2. Over-The-Air (OTA) Updates Only
- The installed Android APK loads from GitHub Pages (`https://thakordhruv097-spec.github.io/saheb-paper/`).
- Whenever changes are made (UI, PDF layout, formulas, reports):
  1. Test locally: `npm run build`
  2. Sync Capacitor assets: `npx cap sync android` (or run `sync_web.bat`)
  3. Commit and push to `main`
  4. GitHub Actions deploys the web build to GitHub Pages (`.github/workflows/deploy.yml`).
  5. The mobile app automatically receives the updates in-app without needing to install an APK or open Chrome.

### 3. Version Bump Guidelines
- Only bump version in `public/version.json` and `src/components/AppUpdateModal.tsx` when an explicit user-facing update release is requested.
- Keep `apkUrl` in `public/version.json` pointing to `https://thakordhruv097-spec.github.io/saheb-paper/#/` (internal app path) to prevent older clients from launching external browser intents.
