# 📥 Installation Guide - Saheb Paper ERP

<div align="center">

![Version](https://img.shields.io/badge/Version-Beta%201.10.6-success?style=flat-square)
![Last Updated](https://img.shields.io/badge/Updated-Nov%202026-blue?style=flat-square)

**Complete Installation Instructions for All Platforms**

</div>

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Android Installation](#android-installation)
3. [Windows Installation](#windows-installation)
4. [Web Access](#web-access)
5. [First-Time Setup](#first-time-setup)
6. [Troubleshooting](#troubleshooting)

---

## 💻 System Requirements

### Android Platform

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **OS Version** | Android 7.0 (Nougat) | Android 10+ |
| **API Level** | API 24+ | API 29+ |
| **RAM** | 2 GB | 4 GB+ |
| **Storage** | 50 MB free | 200 MB+ |
| **Screen** | 5" (480×800) | 6"+ (1080×1920) |
| **Internet** | Optional (offline-first) | WiFi for sync |

### Windows Platform

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **OS** | Windows 10 64-bit | Windows 11 |
| **Processor** | Dual-core 2.0 GHz | Quad-core 2.5 GHz+ |
| **RAM** | 4 GB | 8 GB+ |
| **Storage** | 500 MB free | 1 GB+ |
| **Display** | 1280×720 | 1920×1080+ |
| **Internet** | Required for download | Broadband |

### Web Platform

| Requirement | Details |
|-------------|---------|
| **Browser** | Chrome 90+, Edge 90+, Firefox 88+, Safari 14+ |
| **JavaScript** | Enabled (Required) |
| **Cookies** | Enabled (Required) |
| **Internet** | Stable connection required |

---

## 📱 Android Installation

### Method 1: Direct APK Download (Recommended)

#### Step 1: Download APK File

**Option A - Direct Link**:
```
https://znyvmlwggwckjxxsxiwq.supabase.co/storage/v1/object/public/documents/SahebPaper-Latest.apk
```

**Option B - QR Code**:
1. Open your phone's camera
2. Point at the QR code below
3. Tap the notification to download

```
[QR Code for Android Download]
```

**Option C - GitHub Release**:
1. Visit: `https://github.com/thakordhruv097-spec/saheb-paper-demo`
2. Go to "Releases" section
3. Download `SahebPaper-Latest.apk`

#### Step 2: Enable Unknown Sources

##### For Android 8.0+ (Oreo and above):

1. Open **Settings**
2. Go to **Apps & notifications** (or **Apps**)
3. Tap **Special app access** (or **Advanced**)
4. Select **Install unknown apps**
5. Choose your **Browser** or **File Manager**
6. Toggle **Allow from this source** to ON

##### For Android 7.0-7.1 (Nougat):

1. Open **Settings**
2. Go to **Security** (or **Lock screen and security**)
3. Toggle **Unknown sources** to ON
4. Confirm by tapping **OK**

#### Step 3: Install the APK

1. Open your **File Manager** or **Downloads** folder
2. Locate the downloaded **SahebPaper-Latest.apk** file
3. Tap on the file to begin installation
4. Review the permissions requested by the app:
   - **Storage**: For PDF downloads and file access
   - **Camera**: For barcode/QR scanning
   - **Internet**: For optional cloud sync (offline-first)
5. Tap **Install**
6. Wait for installation to complete
7. Tap **Open** to launch the app

#### Step 4: Verify Installation

1. App icon should appear in your app drawer
2. App name: **Saheb Paper Beta 1.10**
3. Check version in app: Go to Profile → About
4. Should show: **Beta 1.10.6 (Build 25)**

---

### Method 2: Install via ADB (For Developers)

If you have Android Debug Bridge (ADB) installed:

```bash
# Enable USB Debugging on your device first
# Settings → About Phone → Tap Build Number 7 times → Back → Developer Options → USB Debugging

# Connect device to computer via USB
adb devices

# Install APK
adb install SahebPaper-Latest.apk

# Launch app
adb shell am start -n com.sahebpaper.app/.MainActivity
```

---

## 💻 Windows Installation

### Method 1: Portable Executable (Recommended)

#### Step 1: Download Windows Executable

**Direct Download**:
```
https://github.com/thakordhruv097-spec/saheb-paper/releases/latest/download/SahebPaper-Beta-1.10.exe
```

**Alternative Download**:
1. Visit GitHub repository
2. Go to **Releases** section
3. Download **SahebPaper-Beta-1.10.exe**

#### Step 2: Run the Portable App

##### Option A: Direct Run (No Installation)
1. Navigate to your Downloads folder
2. Right-click on **SahebPaper-Beta-1.10.exe**
3. Select **Run as administrator** (recommended)
4. If Windows SmartScreen appears:
   - Click **More info**
   - Click **Run anyway**
5. App will launch directly

##### Option B: Create Desktop Shortcut
1. Right-click on **SahebPaper-Beta-1.10.exe**
2. Select **Create shortcut**
3. Drag shortcut to Desktop
4. Rename to "Saheb Paper ERP"
5. Double-click to launch

#### Step 3: Windows Defender / Antivirus Notice

If Windows Defender blocks the app:

1. Open **Windows Security**
2. Go to **Virus & threat protection**
3. Click **Manage settings**
4. Scroll to **Exclusions**
5. Click **Add or remove exclusions**
6. Click **Add an exclusion** → **File**
7. Browse and select **SahebPaper-Beta-1.10.exe**

#### Step 4: Verify Installation

1. App should launch with loading screen
2. Login screen should appear
3. Check version: **Profile → About**
4. Should show: **Beta 1.10 (Windows)**

---

### Method 2: Install from Source (For Developers)

#### Prerequisites
- Node.js 18+ and npm 9+
- Git

#### Installation Steps

```bash
# Clone repository
git clone https://github.com/thakordhruv097-spec/saheb-paper-demo.git
cd saheb-paper-demo

# Install dependencies
npm install

# Build for production
npm run build

# Run Electron app
npm run electron:dev

# Build Windows executable (optional)
npm run electron:build
```

---

## 🌐 Web Access

### Direct Browser Access

1. **Open your web browser**
2. **Navigate to**:
   ```
   https://saheb-paper-erp.thakordhruv097.workers.dev/
   ```
3. **Bookmark the page** for easy access
4. **No installation required** - works instantly

### Create Desktop Shortcut (Chrome/Edge)

1. Open the web app URL
2. Click the **⋮** menu (top-right)
3. Select **More tools** → **Create shortcut**
4. Name it "Saheb Paper ERP"
5. Check **Open as window**
6. Click **Create**

### Progressive Web App (PWA) Installation

#### On Desktop (Chrome/Edge):
1. Visit the web app URL
2. Look for **Install** button in address bar
3. Click **Install**
4. App will be added to your Start Menu/Applications

#### On Mobile (Chrome):
1. Open web app in Chrome
2. Tap **⋮** menu
3. Select **Add to Home screen**
4. Tap **Add**
5. Icon appears on home screen

---

## 🔧 First-Time Setup

### Initial Configuration

#### Step 1: Launch the App

1. Open the installed app
2. Wait for splash screen
3. Language selection screen will appear

#### Step 2: Select Language

Choose your preferred language:
- 🇬🇧 **English** (Default)
- 🇮🇳 **हिंदी** (Hindi)
- 🇮🇳 **ગુજરાતી** (Gujarati)

> You can change this later in Profile → Settings

#### Step 3: First Login

Use default credentials for your role:

| Username | PIN | Role |
|----------|-----|------|
| `admin` | `1234` | Administrator |
| `plant_manager` | `1234` | Plant Manager |
| `pulper` | `1234` | Pulper Operator |
| `shop` | `1234` | Shop/Store |
| `dispatcher` | `1234` | Dispatcher |
| `viewer` | `1234` | Viewer (Read-Only) |

#### Step 4: Change Default PIN (Recommended)

1. After login, go to **Profile**
2. Tap **Change PIN**
3. Enter current PIN: `1234`
4. Enter new 4-digit PIN
5. Confirm new PIN
6. Save changes

---

## 🛠️ Troubleshooting

### Android Issues

#### Installation Blocked

**Problem**: "App not installed" or "Installation blocked"

**Solution**:
1. Enable "Unknown Sources" (see Step 2 above)
2. Clear package installer cache:
   - Settings → Apps → Show system apps
   - Find "Package Installer"
   - Clear cache and data
3. Retry installation

#### App Crashes on Launch

**Problem**: App closes immediately after opening

**Solution**:
1. Clear app data: Settings → Apps → Saheb Paper → Clear data
2. Reinstall the app
3. Ensure Android version is 7.0+
4. Check if device has at least 2GB RAM

#### QR Scanner Not Working

**Problem**: Camera opens but doesn't scan QR codes

**Solution**:
1. Grant camera permission:
   - Settings → Apps → Saheb Paper → Permissions
   - Enable Camera
2. Ensure good lighting
3. Hold QR code steady in frame
4. Try hardware focus by tapping screen

#### PDF Download Issues

**Problem**: PDFs not downloading or not found

**Solution**:
1. Check storage permission:
   - Settings → Apps → Saheb Paper → Permissions
   - Enable Storage/Files
2. Check Downloads folder: `/storage/emulated/0/Download/`
3. Ensure sufficient free storage (at least 50MB)

---

### Windows Issues

#### SmartScreen Warning

**Problem**: "Windows protected your PC" message

**Solution**:
1. Click **More info**
2. Click **Run anyway**
3. This is normal for unsigned executables

#### Won't Launch / Crashes

**Problem**: App won't open or crashes immediately

**Solution**:
1. Run as administrator (right-click → Run as administrator)
2. Disable antivirus temporarily
3. Install Visual C++ Redistributables:
   - Download from Microsoft
   - Install both x86 and x64 versions
4. Check Windows Event Viewer for error details

#### Blank White Screen

**Problem**: App opens but shows blank white screen

**Solution**:
1. Clear app cache:
   - Delete folder: `%APPDATA%\saheb-paper`
2. Restart the app
3. Check internet connection (first launch needs it)

---

### Web Access Issues

#### Page Won't Load

**Problem**: "Cannot connect" or infinite loading

**Solution**:
1. Check internet connection
2. Try different browser
3. Clear browser cache (Ctrl+Shift+Del)
4. Disable browser extensions
5. Try incognito/private mode

#### Login Not Working

**Problem**: Credentials not accepted

**Solution**:
1. Ensure correct username (lowercase)
2. PIN is exactly 4 digits: `1234`
3. Clear site data: Browser settings → Privacy → Clear data
4. Hard refresh page (Ctrl+Shift+R)

#### Slow Performance

**Problem**: App is laggy or unresponsive

**Solution**:
1. Close other browser tabs
2. Clear browser cache
3. Update browser to latest version
4. Disable browser extensions
5. Try desktop/mobile app instead

---

### General Issues

#### Data Not Syncing

**Problem**: Changes not appearing across devices

**Solution**:
1. Check internet connection
2. Wait 1-2 minutes for sync
3. Refresh app (pull-down on mobile)
4. Re-login to force sync
5. Check if offline mode is enabled

#### Forgot PIN

**Problem**: Cannot remember login PIN

**Solution**:
1. **Admin users**: Contact system administrator
2. **Non-admin users**: Ask admin to reset PIN in Admin Panel
3. **For testing**: Use default `1234` if PIN not changed
4. **Factory reset**: Reinstall app (loses local data)

#### Wrong Language Selected

**Problem**: App in wrong language

**Solution**:
1. Go to Profile (last icon in navigation)
2. Tap Settings/સેટિંગ્સ/सेटिंग
3. Select Language/ભાષા/भाषा
4. Choose correct language
5. App will update immediately

---

## 📞 Additional Support

### Contact Support

If issues persist:

- **Email**: support@sahebpaper.com
- **Phone**: +91 80005 63666
- **GitHub Issues**: [Report technical issues](https://github.com/thakordhruv097-spec/saheb-paper-demo/issues)

### Developer Contact

- **Developer**: Dhruvkumar Niteshkumar Thakor
- **GitHub**: [@thakordhruv097-spec](https://github.com/thakordhruv097-spec)

---

## 🔄 Update Installation

### Automatic Updates (Android)

The app checks for updates on launch. When an update is available:

1. Update notification appears
2. Tap **Download Update**
3. Wait for download to complete
4. Tap **Install** when prompted
5. App restarts with new version

### Manual Update

1. Download latest APK/EXE from links above
2. On Android:
   - Install over existing app (data preserved)
3. On Windows:
   - Replace old .exe with new one

---

<div align="center">

**Installation Complete! 🎉**

[← Back to Product Overview](PRODUCT_OVERVIEW.md) | [User Manual →](USER_MANUAL.md)

</div>
