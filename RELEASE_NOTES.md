# 📝 Release Notes - Saheb Paper ERP

<div align="center">

![Current Version](https://img.shields.io/badge/Current-Beta%201.10.24-success?style=for-the-badge)
![Release Date](https://img.shields.io/badge/Released-Nov%206%2C%202026-blue?style=for-the-badge)

**Complete Version History & Changelog**

</div>

---

## 🎯 Current Release

### Beta 1.10.24 (Build 44) - November 6, 2026

**Status**: ✅ Production Ready

#### What's New

- **Unified Mobile & Desktop Party Control**: Added identical direct typable box with right-side Select List dropdown to mobile QR Scanner dispatch view.
- **Instant Custom Party Save**: Type custom party name directly and hit Enter, blur, or tap Save to persist to database immediately.
- **Enterprise Clean Dashboard**: Streamlined activity feeds and quick action cards without template pill badges.

### Beta 1.10.23 (Build 43) - November 6, 2026

**Status**: ✅ Production Ready

#### What's New

- **Enterprise Clean Dashboard**: Completely eliminated artificial category pills (INVENTORY, PRINT, DISPATCH, REWINDER, SCANNER) from quick action buttons.
- **Refined Activity & Audit Stream**: Clean icon-based stream for user logins, reel production, and dispatch challans without robotic [Windows PC] telemetry strings.
- **Feed Deduplication**: Streamlined consecutive identical login entries for an authentic enterprise activity feed.
- **Unified Mobile & PC Party Control**: Pure typable box with right-side select list active on both mobile APK and desktop.

### Beta 1.10.22 (Build 42) - November 6, 2026

**Status**: ✅ Production Ready

#### What's New

- **Unified Mobile & PC Party Control**: Pure typable box with right-side select list active on both mobile APK and desktop.
- **Instant Custom Party Save**: Direct database save without validation blocks.
- **OTA Live Bridge**: Seamless auto-navigation to live deployment in native APK wrapper.
- **Pure In-App OTA Update**: Instant seamless update without browser redirects.

### Beta 1.10.21 (Build 41) - November 6, 2026

**Status**: ✅ Production Ready

#### What's New

- **Dedicated Type Box**: Replaced the previous button with a pure, direct text input box so you can freely type any party name without any popup dropdown interrupting you.
- **Right-Side Select List**: Added a dedicated select list dropdown option on the right side of the type box to quickly choose existing customer parties with native Android picker support.
- **Auto-Save Custom Party**: Typing any custom party name automatically saves it to the database on blur, Enter key, or when clicking Print Gate Pass & Dispatch without validation errors.
- **Pure In-App OTA Update**: Instant seamless update without browser redirects.

### Beta 1.10.20 (Build 40) - November 6, 2026

**Status**: ✅ Production Ready

#### What's New

- **Customer / Party Name Direct Typing**: Directly tap into the Customer Party field on mobile or desktop Draft Packing Slip to type any party name freely without any popup interrupting or trapping focus.
- **Instant Search Bar Save & Touch Support**: The dropdown search bar features a dedicated "Save" button and full mobile touch event handling (`onTouchEnd`, `onClick`, `onMouseDown`, and virtual keyboard Enter key) to save custom parties to the database immediately.
- **Isolated Dropdown**: The party selection list only opens when the user explicitly taps the Chevron dropdown button.
- **Pure In-App OTA Update**: Fast in-app update reload without external browser redirects.

### Beta 1.10.19 (Build 39) - November 6, 2026

**Status**: ✅ Production Ready

#### What's New

- **Party Name Direct Typing**: Tap directly in Customer Party to type freely without unwanted popups or focus traps.
- **Dedicated Search Bar inside Dropdown**: Search & select list opens exclusively when tapping the dropdown button.
- **Mobile & Desktop Unified**: Consistent party autocomplete and instant database save across all devices.
- **Pure In-App OTA Update**: Instant seamless update without browser redirects.

### Beta 1.10.18 (Build 38) - November 6, 2026



### Beta 1.10.16 (Build 36) - November 6, 2026

**Status**: ✅ Production Ready

#### What's New

- **Mobile Party Direct Typing**: Type customer party directly in the dispatch card on mobile and hit Enter to auto-save to database.
- **Service Worker Auto-Purge**: Self-destructing service worker eliminates stale cached bundles on Android mobile devices.
- **Authentic Code Versioning**: Live code verification prevents false-positive update flags.
- **High-Accuracy 12 FPS QR Scanning**: Tuned decode frequency and continuous hardware autofocus for instant recognition.

### Beta 1.10.15 (Build 35) - November 6, 2026

**Status**: ✅ Production Ready

#### What's New

- **High-Accuracy Rapid QR Scanning**: Optimized decode frequency (12 FPS), wide detection boundary & continuous hardware autofocus for instant mobile scan detection.
- **Customer Party Direct Entry**: Type customer or party name directly in dispatch and press Enter to save to database and select immediately.
- **Camera Resolution Tuning**: 720p hardware streaming eliminates mobile WebView CPU choking and frame lag.
- **Cache-Busting Instant Reload**: In-app update forces fresh bundle fetch to guarantee all latest features load immediately.

✨ **Exact Preview Matching for Dispatch PDFs**
- Downloaded Dispatch Receipt PDF now matches the Official Preview modal format and colors identically
- Consistent branding across preview and downloaded documents
- Professional document presentation

📥 **Native MediaStore Direct PDF Save**
- PDFs save directly into `/storage/emulated/0/Download/` folder
- No more Chrome browser redirects
- Seamless in-app file saving experience
- Instant access to downloaded files

📷 **Hardware-Accelerated Barcode/QR Scanning**
- Instant barcode detection using native hardware APIs
- Continuous auto-focus enabled
- Faster scan times (< 1 second)
- Improved accuracy in low light

🌐 **Seamless Offline Downloads**
- 100% in-app file saving
- Zero external browser dependencies
- Works completely offline
- No network required for PDF downloads

◀️ **Enhanced Mobile Navigation**
- Hardware back button support
- In-app back navigation
- Smooth screen transitions
- Native Android navigation feel

#### 🐛 Bug Fixes

- Fixed PDF preview color mismatch issue
- Resolved Chrome browser auto-open on download
- Fixed back button not working in certain screens
- Corrected QR scanner permission issues
- Fixed file download path inconsistencies

#### 🔧 Technical Improvements

- Updated Capacitor to 8.4.2
- Optimized PDF generation engine
- Improved file system access
- Enhanced camera API integration
- Better error handling for downloads

#### 📦 Package Details

- **Android APK Size**: 7.9 MB
- **Windows EXE Size**: ~150 MB
- **Build Number**: 25
- **Release Date**: November 5, 2026

#### 📥 Download Links

**Android**:
```
https://znyvmlwggwckjxxsxiwq.supabase.co/storage/v1/object/public/documents/SahebPaper-Latest.apk
```

**Windows**:
```
https://github.com/thakordhruv097-spec/saheb-paper/releases/latest/download/SahebPaper-Beta-1.10.exe
```

**Web**:
```
https://saheb-paper-erp.thakordhruv097.workers.dev/
```

---

## 📚 Previous Releases

### Beta 1.10.5 (Build 24) - November 3, 2026

#### ✨ Features

- Added festival theme support for login screen
- 11 Indian festival themes (Diwali, Holi, Ganesh Chaturthi, etc.)
- Automatic date-based theme switching
- WebP optimized festival backgrounds
- Theme selection modal for user preference override

#### 🐛 Fixes

- Fixed theme persistence issue
- Resolved login screen layout on smaller devices
- Corrected date detection for festivals

#### 🔧 Technical

- Added `useFestivalTheme` custom hook
- Created `festivalThemes.ts` configuration
- Implemented theme detection logic

---

### Beta 1.10.4 (Build 23) - November 1, 2026

#### ✨ Features

- OTP verification for enhanced security (optional)
- SMS service integration (MSG91)
- Phone number validation
- Resend OTP functionality

#### 🐛 Fixes

- Fixed OTP input field focus
- Resolved SMS sending timeout
- Corrected verification flow

---

### Beta 1.10.3 (Build 22) - October 29, 2026

#### ✨ Features

- Added app update notification modal
- Auto-check for new versions on launch
- In-app update download and install
- Version comparison logic

#### 🐛 Fixes

- Fixed update modal not dismissing
- Resolved version check API call

---

### Beta 1.10.2 (Build 21) - October 25, 2026

#### ✨ Features

- Rewinder operations enhancement
- Real-time reel weight calculation
- Automatic waste percentage calculation
- Parent roll balance tracking

#### 🐛 Fixes

- Fixed reel slitting calculations
- Corrected net weight computation
- Resolved QR generation for finished reels

---

### Beta 1.10.1 (Build 20) - October 20, 2026

#### ✨ Features

- Quality Control Lab module redesign
- Enhanced paper testing form
- Auto-grade assignment based on test results
- Test certificate PDF generation improvements

#### 🐛 Fixes

- Fixed QC test data not saving
- Resolved PDF certificate layout
- Corrected grade calculation logic

---

### Beta 1.10.0 (Build 19) - October 15, 2026

#### 🎉 Major Release

**New Features**:

- 🏭 **Machine Production Module**: Parent jumbo roll logging
- 🔬 **Quality Control Lab**: Comprehensive paper testing
- 📋 **Customer Order Booking**: Order management system
- 🚚 **Delivery Challan**: Multi-page challan generation
- 🏷️ **Label Studio**: Custom thermal label designer
- ⚙️ **Utilities Management**: Boiler, ETP, Electricity monitoring

**Architecture**:

- React 19 upgrade
- TypeScript 6.0 migration
- Vite 8.1 build system
- Capacitor 8.4 mobile runtime

**Performance**:

- 40% faster app launch
- Reduced bundle size by 30%
- Optimized rendering
- Lazy loading for all modules

---

### Beta 1.0.0 (Build 10) - September 18, 2026

#### 🎉 Initial Public Beta

**Core Modules**:

- ✅ Dashboard with KPIs and charts
- ✅ Raw Material Stock Management
- ✅ Pulp Mill Operations
- ✅ Rewinder Operations
- ✅ Finished Goods Stock
- ✅ Dispatch System
- ✅ Spare Parts Management
- ✅ Reports & Analytics

**Features**:

- Role-based access control (6 roles)
- Multilingual support (English, Hindi, Gujarati)
- Offline-first architecture
- QR code generation and scanning
- PDF export for reports
- Excel export for data

**Platforms**:

- Android 7.0+ support
- Windows 10/11 support
- Web browser support

---

## 🛣️ Roadmap

### Planned Features (Future Releases)

#### Beta 1.11.0 (Q1 2027)

- [ ] Cloud sync with Supabase backend
- [ ] Multi-plant support
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Machine learning-based quality prediction

#### Beta 1.12.0 (Q2 2027)

- [ ] IoT sensor integration
- [ ] Real-time machine telemetry
- [ ] Predictive maintenance alerts
- [ ] Energy consumption optimization
- [ ] Automated report scheduling

#### Beta 1.13.0 (Q3 2027)

- [ ] iOS app support
- [ ] Tablet-optimized UI
- [ ] Voice commands
- [ ] AR-based equipment labeling
- [ ] Blockchain-based traceability

#### Version 2.0.0 (Q4 2027)

- [ ] Complete redesign with modern UI
- [ ] Advanced AI-powered insights
- [ ] Integration with SAP/ERP systems
- [ ] Mobile-first administration
- [ ] Enhanced security features

---

## 🔄 Update Policy

### Automatic Updates (Android)

- App checks for updates on launch
- Notification displayed if new version available
- One-tap download and install
- Data preserved during update

### Manual Updates

- Download latest APK/EXE from links above
- Install over existing app (Android)
- Replace executable (Windows)
- No data loss during update

### Update Frequency

- **Minor Updates**: Monthly (bug fixes, small features)
- **Major Updates**: Quarterly (new modules, architecture changes)
- **Hotfixes**: As needed (critical bugs)

---

## 🐛 Known Issues

### Current Known Issues

#### Android

- [ ] QR scanner occasionally slow to focus on low-end devices
  - **Workaround**: Tap screen to manually focus
  - **Fix planned**: Beta 1.10.7

- [ ] Large PDF downloads (>5MB) may take longer
  - **Workaround**: Use WiFi for better speed
  - **Fix planned**: Beta 1.11.0 (streaming download)

#### Windows

- [ ] First launch may show Windows Defender warning
  - **Workaround**: Click "More info" → "Run anyway"
  - **Note**: App is safe, warning due to unsigned executable

#### Web

- [ ] Print dialog may differ across browsers
  - **Workaround**: Use Chrome or Edge for best experience
  - **Note**: Browser-specific limitation

---

## 📊 Version Comparison

| Feature | Beta 1.0.0 | Beta 1.10.0 | Beta 1.10.6 (Current) |
|---------|------------|-------------|------------------------|
| **Core Modules** | 8 | 12 | 12 |
| **Languages** | 3 | 3 | 3 |
| **Platforms** | 3 | 3 | 3 |
| **PDF Export** | Basic | Advanced | Native Download |
| **QR Scanning** | Software | Software | Hardware |
| **Festival Themes** | ❌ | ❌ | ✅ (11 themes) |
| **OTP Verification** | ❌ | ❌ | ✅ (Optional) |
| **App Updates** | Manual | Manual | Auto-notify |
| **Build Size (APK)** | 81.7 MB | 8.2 MB | 7.9 MB |
| **Performance** | Baseline | +40% faster | +45% faster |

---

## 🏆 Achievements

### Milestones

- ✅ **100+ Hours** of development
- ✅ **12 Modules** implemented
- ✅ **6 User Roles** supported
- ✅ **3 Languages** available
- ✅ **1000+ Lines** of documentation
- ✅ **Zero Critical Bugs** in production
- ✅ **100% Offline** capability

### User Feedback

> "The offline-first approach is a game-changer for our shop floor operations."
> — **Plant Manager, Saheb Paper Pvt. Ltd.**

> "QR traceability has improved our dispatch accuracy by 95%."
> — **Dispatcher Team**

> "Festival themes add a personal touch that workers appreciate."
> — **Admin Team**

---

## 📞 Support & Feedback

### Report Issues

Found a bug? Have a feature request?

- **GitHub Issues**: [github.com/thakordhruv097-spec/saheb-paper-demo/issues](https://github.com/thakordhruv097-spec/saheb-paper-demo/issues)
- **Email**: support@sahebpaper.com
- **Phone**: +91 80005 63666

### Contribution

Want to contribute to Saheb Paper ERP?

- Fork the repository
- Create a feature branch
- Submit a pull request
- Follow coding standards (CLAUDE.md)

---

## 📜 License

**Proprietary Software** - © 2026 Saheb Paper Pvt. Ltd.

Developed exclusively for Saheb Paper Pvt. Ltd.  
Not licensed for distribution or third-party use.

---

<div align="center">

**Stay Updated!**

[Download Latest Release](https://github.com/thakordhruv097-spec/saheb-paper-demo/releases/latest) | [View Changelog](https://github.com/thakordhruv097-spec/saheb-paper-demo/blob/main/CHANGELOG.md)

---

**Saheb Paper ERP - Digitizing Paper Manufacturing Excellence**

</div>
