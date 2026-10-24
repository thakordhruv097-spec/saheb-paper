# SAHEB PAPER ERP — PROJECT AUDIT & SYSTEM STATUS REPORT

**Audit Date**: October 22, 2026  
**Project Path**: `E:\ZZZZZZZZSAHEB_DHRUV\saheb-paper-demo`  
**Repository Branch**: `main` (Up to date with origin/main, clean working tree)  
**Audit Type**: Read-Only Comprehensive Diagnostic Audit  

---

## 1. TECH STACK (Exact Versions from `package.json`)

| Dependency Category | Package Name | Exact Version in `package.json` | Purpose |
| :--- | :--- | :--- | :--- |
| **Core Framework** | `react` | `^19.2.7` | UI Component Library |
| | `react-dom` | `^19.2.7` | React DOM Renderer |
| **Routing** | `react-router-dom` | `^7.18.1` | HashRouter & Application Routes |
| **Language & Build** | `typescript` | `~6.0.2` | Type-safety & Static Analysis |
| | `vite` | `^8.1.1` (v8.1.5 runtime) | Build tool & Dev Server |
| | `@vitejs/plugin-react`| `^6.0.3` | Fast Refresh plugin |
| **Styling** | `tailwindcss` | `^4.3.2` | Utility CSS Framework (Tailwind v4) |
| | `@tailwindcss/vite` | `^4.3.2` | Tailwind Vite Plugin |
| **Desktop Platform** | `electron` | `^43.1.1` | Native Windows Runtime wrapper |
| | `electron-builder` | `^26.15.3` | Packaging portable Windows .exe |
| | `electron-packager`| `^17.1.2` | Electron packaging helper |
| **Mobile Platform** | `@capacitor/core` | `^8.4.2` | Capacitor Runtime Bridge |
| | `@capacitor/cli` | `^8.4.2` | Capacitor Command Line Tools |
| | `@capacitor/android`| `^8.4.2` | Native Android Runtime |
| | `@capacitor/app` | `^8.1.1` | App State & Hardware Events |
| | `@capacitor/filesystem` | `^8.1.3` | Native File IO Access |
| | `@capacitor/share` | `^8.0.2` | Native Android Share Sheet |
| **Cloud Database** | `@supabase/supabase-js` | `^2.115.0` | Remote PostgreSQL client & Realtime engine |
| **Internationalization**| `i18next` | `^26.3.6` | Localization framework |
| | `react-i18next` | `^17.0.10` | React hooks for translations |
| **Charts & Analytics**| `recharts` | `^3.9.2` | Composed, Area & Pie charts |
| | `chart.js` | `^4.5.1` | HTML5 Canvas charts |
| | `react-chartjs-2` | `^5.3.1` | React Chart.js wrapper |
| **QR & Barcodes** | `qrcode.react` | `^4.2.0` | SVG QR code generator |
| | `html5-qrcode` | `^2.3.8` | Camera-based QR/Barcode Scanner |
| **Document Export** | `xlsx` | `^0.18.5` | Spreadsheet parser |
| | `xlsx-js-style` | `^1.2.0` | Styled Excel export (Colors, borders, formulas) |
| | `jspdf` | `^4.2.1` | Client-side PDF generation |
| | `docx` | `^9.7.1` | Word (.docx) proposal generation |
| **Utilities** | `date-fns` | `^4.4.0` | Modern Date math & formatting |
| | `lucide-react` | `^1.24.0` | Modern UI icon library |
| | `oxlint` | `^1.71.0` | Rust-based high-speed linter |

---

## 2. FOLDER STRUCTURE OF `src/`

```
src/
├── assets/                          # Static assets and icons
├── components/                      # Shared reusable UI components & modals
│   ├── AppUpdateModal.tsx           # In-app update prompt & changelog modal
│   ├── AutoLockModal.tsx            # Session inactivity lock modal
│   ├── CustomDatePickerModal.tsx    # Custom calendar modal for single-day selection
│   ├── CustomSearchableSelect.tsx   # Searchable dropdown select with keyboard navigation
│   ├── DataFilterBar.tsx            # Standard multi-field filter toolbar
│   ├── DocumentPrintPreviewModal.tsx# PDF & print preview modal for reports/challans
│   ├── Layout.tsx                   # Main app shell (desktop sidebar, mobile navigation, top navbar)
│   ├── MobileNavigationHandler.tsx  # Android hardware back button and scroll listeners
│   ├── MobileToast.tsx              # Touch-optimized mobile toast notifications
│   ├── PrintLabelModal.tsx          # Thermal label configuration & printing modal
│   ├── PrivacyConsentModal.tsx      # First-time DPDP Act 2023 compliance consent modal
│   ├── PrivacyPolicyModal.tsx       # Full mill privacy policy viewer
│   ├── ReelPrintLabel.tsx           # Standardized reel label template (4x6, 4x4, CM diameter)
│   ├── RootErrorBoundary.tsx        # Top-level React error boundary with reload trigger
│   └── WorkflowStepBadge.tsx        # Visual paper manufacturing workflow step indicator
├── config/                          # Static configuration files
│   ├── company.ts                   # Mill corporate identity (Saheb Paper Pvt. Ltd., GSTIN, address)
│   └── version.ts                   # Version single source of truth, build dates, and changelogs
├── context/                         # Global React contexts
│   └── DateFilterContext.tsx        # Global timeframe filter context (Today, Week, Month, All)
├── data/                            # Local storage data layer, schemas, and seeds
│   ├── index.ts                     # CRUD data operations, seeds, localStorage keys, cloud push hooks
│   └── types.ts                     # TypeScript interfaces for all mill entities, roles, and logs
├── hooks/                           # Custom React hooks
│   ├── useBodyScrollLock.ts         # Prevents background scroll when modals/drawers open
│   ├── useDataSync.ts               # Listens for local storage and cloud update events
│   └── useMobileBackHandler.ts      # Intercepts browser/Android back navigation for modal closing
├── i18n/                            # Localization
│   ├── index.ts                     # i18next configuration (English, Hindi, Gujarati)
│   └── locales/                     # Language JSON files (en.json, hi.json, gu.json)
├── lib/                             # Core library wrappers
│   ├── security.ts                  # Salted SHA-256 PIN hashing, token generation, PIN verification
│   ├── supabase.ts                  # Supabase clients for Production & Demo sandboxes
│   └── supabaseSync.ts              # Bidirectional cloud sync engine, realtime bus, and mappers
├── modules/                         # Core ERP operational modules
│   ├── admin/                       # Administration, Masters, Plant Settings, and User Management
│   ├── auth/                        # Auth context, Login view, ProtectedRoute
│   ├── boiler/                      # Boiler steam, fuel, and pressure logs; UtilitiesEtp wrapper
│   ├── dashboard/                   # Role-adaptive executive & departmental dashboards
│   ├── dispatch/                    # Packing slips, Challans, Dispatched vault, Finished stock wrapper
│   ├── electricity/                 # Daily power grid units consumed
│   ├── etp/                         # ETP effluent water treatment & chemicals
│   ├── experiment/                  # Legacy wrapper redirecting to Draft Packing Slip
│   ├── finish-stock/                # Finished reels inventory grouped by Product, GSM, Size
│   ├── lab/                         # Physical & mechanical paper test certificate reporting
│   ├── label-studio/                # Thermal barcode & QR label designer and printer
│   ├── machine/                     # Paper machine jumbo roll production & chemical dosages
│   ├── mindmap/                     # System architecture mindmap view (not registered in routes)
│   ├── orders/                      # Customer order booking wrapper
│   ├── profile/                     # Admin & Operator profiles, Role management, Mobile profile
│   ├── pulp-mill/                   # Waste paper recipe batching, chemical dosing, downtime
│   ├── raw-material/                # Inward raw material shipments, lot numbers, stock ledger
│   ├── reports/                     # Daily production, dispatch, stock statements, Excel export
│   ├── rewinder/                    # Reel conversion, batch slitting, QR scanner & traceability
│   └── store/                       # Spares management (bearings, v-belts) & movement ledger
├── services/                        # Background services
│   ├── appUpdateService.ts          # Cache-busting version checker, APK/EXE update downloader
│   └── telemetryService.ts          # Runtime error and crash telemetry monitor
├── utils/                           # Helper utilities
│   ├── cloudDocumentStorage.ts      # Cloud PDF storage helper
│   ├── deviceHelper.ts              # Platform, screen size, and device detection
│   ├── dispatchReceiptService.ts    # Thermal receipt formatting for dispatch slips
│   ├── excelStyler.ts               # Corporate styling for xlsx-js-style
│   ├── fileDownloader.ts            # Web blob download & Android Native Bridge downloader
│   ├── labPdfGenerator.ts           # jsPDF generation for lab test certificates
│   ├── notificationSound.ts         # Audio beep/chime on scan and actions
│   ├── productUtils.ts              # Grade parsing and product naming normalization
│   ├── storageMonitor.ts            # LocalStorage usage and quota checker
│   ├── themeHelper.ts               # Theme toggling and dark mode DOM synchronization
│   ├── universalPrint.ts            # Cross-platform window and iframe printing
│   └── xlsx-shim.ts                 # SheetJS shim
├── App.css                          # Application level styles
├── App.tsx                          # App root, lazy route definitions, route code splitting
├── index.css                        # Tailwind v4 directives, custom font imports, neumorphic tokens
└── main.tsx                         # App entry point, React root, wheel input preventers
```

---

## 3. MODULES & FEATURES BREAKDOWN

| Module Name | File Path | Functional Description | Implementation Status | Incomplete / Broken / Observations |
| :--- | :--- | :--- | :---: | :--- |
| **Executive Dashboard** | `src/modules/dashboard/DashboardView.tsx` | Role-adaptive dashboard. For Admin/Plant Manager: shows full mill KPIs (Pulp batches, Machine tons, Rewound reels, Lab pass rate, Boiler steam/wood, ETP, Dispatch, Orders). For operators: switches to tailored department overview. Filterable by Today, Week, Month, All. Live activity logs. | **COMPLETE** | None. Fully functional. |
| **Raw Material Stock** | `src/modules/raw-material/RawMaterialView.tsx` | Inward shipments recording with auto-generated Lot Numbers (`LOT-YYYYMMDD-XXXX`), vendor selection, category filtering (Waste Paper, Chemical, Boiler Fuel, ETP), low-stock thresholds, and stock ledger. | **COMPLETE** | None. Fully functional. |
| **Pulp Mill Operations** | `src/modules/pulp-mill/PulpMillView.tsx` | Pulp batch recipe configuration: waste paper blend percentages (Indian Tissue, Imported, Cupstock, SMK, Broke, etc.) and chemical dosing (Caustic, Bleach, Peroxide, Hypo). Pulper downtime tracking with reasons. Formula history & copy feature. | **COMPLETE** | None. Fully functional. |
| **Paper Machine Production** | `src/modules/machine/MachineView.tsx` | Jumbo roll logging (weight, GSM, width, diameter, joints, shift, run time, downtime reason). Real-time raw material deduction linking to Pulp Mill recipe. Chemical formula dosage rates card. Roll deletion & lab status indicators. | **COMPLETE** | Chemical formula inputs for past dates do not enforce read-only status in UI (see Section 11). |
| **Rewinder Reel Conversion** | `src/modules/rewinder/RewinderView.tsx` | Parent roll to cut reels conversion. Multi-reel batch slitting table (Size mm, Dia cm, Weight kg, Joint auto-propagation, QC Grade A/B). Reel yield vs roll weight calculation. Consumed parent roll tracking. | **COMPLETE** | None. Fully functional. |
| **Lab Quality Control** | `src/modules/lab/LabView.tsx` | Physical & mechanical test report certificates (13 parameters: GSM result, Moisture %, Caliper mm, Bulk cc/gm, Breaking Length MD/CD, Brightness %, Tear MD/CD, Tensile Dry MD/CD, Stretch Dry MD/CD, QC status, Remarks, Inspector). Section 2: 14 GSM sample profiling with real-time average calculation and auto-syncing into Section 3 GSM Result. PDF generation & Excel export. | **COMPLETE** | None. Fully functional. |
| **Customer Orders** | `src/modules/orders/OrdersView.tsx` & `src/modules/dispatch/DispatchView.tsx` | Customer order booking: Party, Product, GSM, Size, Ply, Quantity, Weight in tons, Due date, Order number. Real-time fulfillment tracking (Pending, Partially Fulfilled, Fulfilled) based on generated packing slips. | **COMPLETE** | `OrdersView.tsx` is a 13-line wrapper rendering `DispatchView initialTab="orders" hideTabs={true}`. |
| **Dispatch & Challans** | `src/modules/dispatch/DispatchView.tsx` | Draft Packing Slip builder, vehicle assignment, reel barcode scanning/selection, tare/gross weight calculation, canvas digital signature for driver & receiver, official Delivery Challan generation (`PS-YYYYMMDD-XXXX`), thermal receipt & A4 PDF printing. | **COMPLETE** | Dispatched slip deletion soft-deletes and syncs to Supabase. |
| **Dispatched Reels Vault** | `src/modules/dispatch/DispatchedReelsVault.tsx` & `DispatchView.tsx` | Permanent register of all reels ever dispatched. Searchable by reel number, challan number, party name, date range. Full lineage linkage. | **COMPLETE** | Functional both as embedded tab inside `DispatchView` and standalone component. |
| **Finished Stock Inventory** | `src/modules/finish-stock/FinishStockView.tsx` & `src/modules/dispatch/FinishedStockDispatchView.tsx` | Warehouse inventory of cut reels grouped by Product, Grade (A/B), GSM, Size mm. Status filters (All, In Stock, Pending QC, Dispatched). Manual QC grade assignment modal. | **COMPLETE** | `FinishedStockDispatchView.tsx` acts as tab wrapper for `FinishStockView` and `QRScannerView`. |
| **Boiler Operations** | `src/modules/boiler/BoilerView.tsx` & `UtilitiesEtpView.tsx` | Shift logging for boiler: steam pressure, firewood/biocoal used (kg), water consumed (L), temperature, RO chemical dosing (L), operator name. | **COMPLETE** | None. Fully functional. |
| **ETP Water & Chemicals** | `src/modules/etp/EtpView.tsx` & `UtilitiesEtpView.tsx` | Effluent Treatment Plant logs: flock liquid (L), flock master (kg), RO chemical, treated effluent volume, operator. | **COMPLETE** | None. Fully functional. |
| **Electricity & Power Grid** | `src/modules/electricity/ElectricityView.tsx` & `UtilitiesEtpView.tsx` | Daily grid power unit consumption logging, meter reading entries, operator attribution. | **COMPLETE** | None. Fully functional. |
| **Store & Spare Parts** | `src/modules/store/StoreView.tsx` | Maintenance spare parts inventory: Bearings (by number & machine location), V-Belts (by size & target machine), other spares. Minimum stock threshold alerts. Stock In / Stock Out movement logging (`logSparesMovement`). | **COMPLETE** | None. Fully functional. |
| **Monthly & Yearly Reporting** | `src/modules/reports/ReportsView.tsx` | 8 dedicated reports (Daily Production, Daily Dispatch, Stock Statement, Available Reels, Sold Reels, Vehicle-wise, Party-wise, Raw Material). Recharts visual trend graphs. Corporate Excel (.xlsx) export styled with `xlsx-js-style`. | **COMPLETE** | None. Fully functional. |
| **User & Role Management** | `src/modules/admin/UserManagementView.tsx` & `src/modules/profile/RoleManagementView.tsx` | User administration, custom role creator, module permission matrix, 5-attempt failed login lockouts with countdown timer, security question recovery, PIN reveal, Admin simulation of worker sessions (`simulateWorkerLogin`). | **COMPLETE** | None. Fully functional. |
| **Admin Masters & Backup** | `src/modules/admin/AdminMasters.tsx` | Product masters, raw material masters, parties, vendors, vehicles, JSON database backup & restore, Factory Reset (wipes cloud tables + local storage), audit transaction log. | **COMPLETE** | None. Fully functional. |
| **Plant / Company Settings** | `src/modules/admin/CompanySettingsView.tsx` | Mill name, address, GSTIN, contact numbers, logo, print settings, live database target switcher (Prod vs Demo). | **COMPLETE** | None. Fully functional. |
| **Label Studio** | `src/modules/label-studio/LabelStudioView.tsx` | Thermal sticker designer (4"x6", 4"x4", custom mm), multi-copy printing, live preview with QR code generation. Strictly enforces CM for reel diameter. | **COMPLETE** | None. Fully functional. |
| **QR Scanner & Traceability** | `src/modules/rewinder/QRScannerView.tsx` & `QRTraceabilityView.tsx` | Camera QR scanner (`html5-qrcode`) with torch, camera flip, audio beep. QR Traceability traces any scanned reel back through parent roll, pulp formula, raw material lots, QC test report, and dispatch challan. | **COMPLETE** | None. Fully functional. |
| **System Mind Map** | `src/modules/mindmap/SystemMindMapView.tsx` | Visual tree map showing ERP module relationships. | **PARTIAL** | File exists (22 KB), but is not linked to any route in `App.tsx` or sidebar menu. |

---

## 4. DATA LAYER

### Storage Engine: Local-First Hybrid Architecture
The application uses a **dual-layer Local-First architecture**:
1. **Local Layer (`localStorage`)**: Every read and immediate UI state transition occurs synchronously against `localStorage`. This guarantees instant, zero-latency rendering and 100% offline functionality across mill workstations and mobile devices.
2. **Cloud Layer (`Supabase PostgreSQL`)**: Every mutation asynchronously pushes changes to Supabase via `pushUpsertToCloud()`, `pushDeleteToCloud()`, or `pushClearTableToCloud()`.

### Is Supabase Actually Connected and Live?
**YES, LIVE AND CONNECTED.** Supabase is not merely code-prepared; it has active, live project endpoints with hardcoded fallback keys in `src/lib/supabase.ts` and environment variables in `.env` / `.env.development`:
- **Production Factory Database**: `https://znyvmlwggwckjxxsxiwq.supabase.co` (Active for builds and Cloudflare/GitHub/APK/EXE).
- **Demo Sandbox Database**: `https://scyiwfqkknuphzhvklok.supabase.co` (Used for localhost testing).
- **Environment Switcher**: Order of precedence: `localStorage.getItem('saheb_database_target')` -> `VITE_DATABASE_TARGET` -> auto-detect (localhost uses Demo; production builds use Prod).

### Table & Storage Key Mapping

| Entity / Domain | LocalStorage Key | Supabase Table Name | Primary Key |
| :--- | :--- | :--- | :--- |
| Users | `saheb_users` | `users` | `username` |
| Custom Roles | `saheb_custom_roles` | `custom_roles` | `key` |
| Deleted Roles | `saheb_deleted_roles` | `deleted_roles` | `role_key` |
| Raw Materials | `saheb_raw_materials` | `raw_materials` | `id` |
| Raw Material Lots | `saheb_raw_material_lots` | `raw_material_lots` | `lot_no` |
| Product Masters | `saheb_products` | `products` | `id` |
| Customer Parties | `saheb_parties` | `parties` | `id` |
| Supplier Vendors | `saheb_vendors` | `vendors` | `id` |
| Vehicles | `saheb_vehicles` | `vehicles` | `id` |
| Pulp Mill Formulas | `saheb_formulas` | `pulp_formulas` | `id` |
| Machine Jumbo Rolls | `saheb_rolls` | `machine_rolls` | `roll_no` |
| Cut Reels | `saheb_reels` | `reels` | `reel_no` |
| Transaction Logs | `saheb_logs` | `transaction_logs` | `id` |
| Boiler Logs | `saheb_boiler_logs` | `boiler_logs` | `id` |
| ETP Logs | `saheb_etp_logs` | `etp_logs` | `id` |
| Electricity Logs | `saheb_electricity_logs` | `electricity_logs` | `id` |
| Pending Orders | `saheb_pending_orders` | `pending_orders` | `id` |
| Packing Slips | `saheb_packing_slips` | `packing_slips` | `id` |
| Store Items | `saheb_store_items` | `store_items` | `id` |
| Store Activity Logs | `saheb_store_logs` | *Stored locally* | `id` |
| Lab QC Test Reports | `saheb_lab_reports` | `paper_test_reports` | `id` |

### How Synchronization Works
1. **Startup Pull**: On application boot (`App.tsx`), `initSupabaseSync()` is dispatched via `requestIdleCallback` (or 300ms timeout) to run `syncAllTables(true)`, querying all Supabase tables with a 4-second race timeout.
2. **Outbound Push**: When any record is created or updated, `setJSON()` writes to localStorage, emits `saheb_data_updated`, and immediately schedules an asynchronous `pushUpsertToCloud()`.
3. **Inbound Realtime Updates**:
   - Subscribes to Supabase Realtime channel `saheb_cloud_realtime_stream` (`broadcast` events).
   - Subscribes to Postgres database changes (`postgres_changes` on schema `public`).
4. **Heartbeat Polling**: When tab is active/visible, runs `syncAllTables(false)` every 5 seconds (throttled to a maximum of once every 15 seconds to prevent spamming).
5. **Foreground Wake-up Sync**: Triggers immediate full re-sync whenever `visibilitychange` fires, window receives focus, or device comes online.
6. **Conflict Resolution**: Generic merge function `mergeByUniqueKey` merges remote and local lists by unique Primary Key (`username`, `id`, `roll_no`, `reel_no`, `lot_no`, `key`).

---

## 5. AUTH & ROLES

### Login Mechanism
- **Credentials**: Username + 4-digit PIN (numbers only).
- **Security & Hashing**: `src/lib/security.ts` implements salted SHA-256 cryptographic hashing (`hashPin`, `verifyPin`). PINs are verified using constant-time comparison.
- **Account Lockout Policy**:
  - 5 consecutive failed PIN attempts automatically lock the user account for 15 minutes.
  - While locked, the PIN input field is hidden and replaced by a lockout warning showing remaining minutes.
  - Users can self-unlock using their registered Security Question and Answer, with an option to create a new 4-digit PIN.
  - Admins can immediately unlock any account from `UserManagementView.tsx`.
- **Worker Simulation**: Admin can click "Simulate Worker Login" on any user to view the ERP exactly as that operator would, with a floating top bar allowing 1-click exit back to Admin.

### Default Users and PINs (from `src/data/index.ts`)

| Username | Role | Assigned Roles | Default PIN | Display Name | Employee ID | Default Accessible Modules |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `admin` | `Admin` | `['Admin']` | `1234` | Saheb Paper Admin | EMP-001 | All 15 operational & admin modules |
| `pulper` | `PulpOperator` | `['PulpOperator']`| `1122` | Pulper Operator | EMP-002 | `dashboard`, `raw_material_stock`, `pulp_mill_operations`, `boiler`, `etp` |
| `plant_manager` | `PlantManager`| `['PlantManager']`| `1234` | Plant Manager | EMP-003 | `dashboard`, `lab`, `raw_material_stock`, `pulp_mill_operations`, `machine_production`, `rewinding_reel_conversion`, `boiler`, `etp`, `electricity`, `dispatch`, `finished_stock_dispatch` |
| `dispatcher` | `Dispatcher` | `['Dispatcher']` | `1234` | Dispatcher | EMP-004 | `dashboard`, `orders`, `finished_stock_dispatch`, `dispatch` |
| `shop` | `Shopper` | `['Shopper']` | `1234` | Shop / Procurement | EMP-005 | `dashboard`, `spareparts_management` |
| `viewer` | `Viewer` | `['Viewer']` | `1234` | Viewer | EMP-006 | All 13 operational modules (Excludes Admin Masters) |

### Role Hierarchy & Module Access Table

| Role | Dashboard | Raw Material | Pulp Mill | Machine | Rewinder | Lab QC | Utilities / ETP | Orders | Finished Stock | Dispatch | Store | Reports | Label Studio | Admin Masters |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin** | YES | YES | YES | YES | YES | YES | YES | YES | YES | YES | YES | YES | YES | **YES** |
| **PlantManager** | YES | YES | YES | YES | YES | YES | YES | NO | YES | YES | NO | NO | NO | NO |
| **PulpOperator** | YES | YES | YES | NO | NO | NO | YES (Boiler/ETP) | NO | NO | NO | NO | NO | NO | NO |
| **MachineOperator** | YES | YES | NO | YES | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| **RewinderOperator**| YES | NO | NO | YES | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| **LabOperator** | YES | YES | YES | NO | NO | YES | NO | NO | NO | NO | NO | NO | NO | NO |
| **UtilitiesOperator**| YES | NO | NO | NO | NO | NO | YES | NO | NO | NO | NO | NO | NO | NO |
| **Dispatcher** | YES | NO | NO | NO | NO | NO | NO | YES | YES | YES | NO | NO | NO | NO |
| **Shopper / Store** | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO | YES | NO | NO | NO |
| **Viewer** | YES (R/O)| YES (R/O) | YES (R/O)| YES (R/O)| YES (R/O)| YES (R/O)| YES (R/O)| YES (R/O)| YES (R/O)| YES (R/O)| YES (R/O)| YES (R/O)| YES (R/O)| **NO** |

*Note: Custom modules assigned by Admin to any individual user override default role modules.*

### Viewer / Read-Only Locks: Where Applied
In `AuthContext.tsx`, `isViewer` is true when `role === 'Viewer'` or `roles.includes('Viewer')`.
1. **Global Keyboard & Window Lockdown**:
   - Intercepts and blocks `Ctrl+P` and `Cmd+P`.
   - Intercepts `window.print()` and turns it into a console warning.
2. **Component & Module Enforcements**:
   - `DocumentPrintPreviewModal`: Disables "Download PDF" and "Print", badges as "Locked for Viewer".
   - `PrintLabelModal`: Disables "Print Label Now", displays `<Lock>` icon.
   - `RawMaterialView`: Disables "Confirm Inward" button.
   - `PulpMillView`: Disables "Save Recipe Formula" and downtime logging.
   - `MachineView`: Disables "Save Machine Roll" and "Save Chemical Rates".
   - `RewinderView`: Disables "Save Reel Entry", batch editing, and print labels.
   - `LabView`: Disables "Save Report" and PDF certificate download.
   - `DispatchView`: Disables "Create Delivery Challan", reel removal, and slip cancellation.
   - `StoreView`: Disables "Log Spares Movement", "Save Bearing", and "Save V-Belt".
   - `ReportsView`: Disables "Export Excel" and "Print Report".
   - `AdminMasters`: Viewer is strictly denied access by `ProtectedRoute.tsx`.

---

## 6. UI & DESIGN

- **Theme Engine**:
  - Full Light and Dark theme supported.
  - Active theme saved in `localStorage.getItem('saheb_theme')` (`'dark'` or `'light'`).
  - Helper `applyTheme` in `src/utils/themeHelper.ts` toggles class `dark` on `document.documentElement` and dispatches `saheb_theme_changed`.
- **Design Language**:
  - Neumorphic & glassmorphism aesthetic: soft inner shadows, subtle purple/indigo brand accents (`#5E3BE8`, `#6C4FE0`).
  - Font Typography: Google Fonts `Plus Jakarta Sans` / `Inter` / heading typography.
  - Micro-animations: Smooth transitions, subtle pulse spinners (`Loader2`), active state scale-downs (`active:scale-95`).
- **Modal Design**:
  - Centered backdrop modals with backdrop blur.
  - `useBodyScrollLock` locks document scrolling whenever modals open.
  - `useMobileBackHandler` ensures pressing Android back button dismisses open modals instead of exiting the app.
- **Charts**:
  - `Recharts` ComposedChart, AreaChart, PieChart with custom dark/light tooltips.
  - `Chart.js` integrated for analytics widgets.
- **Languages (i18n)**:
  - English (`en`), Hindi (`hi`), Gujarati (`gu`) via `i18next`.
  - JSON dictionaries located in `src/i18n/locales/`.

---

## 7. PLATFORMS & BUILD

### 1. Web Application
- **Status**: **COMPLETE & PRODUCTION READY**
- Configured for Vite + Vercel (`vercel.json`) and Cloudflare Workers (`wrangler.jsonc`).
- Dev Server: `npm run dev` (Vite 8).

### 2. Electron Desktop (.exe)
- **Status**: **COMPLETE & PACKAGED**
- Configured with `main.cjs` and `preload.cjs`.
- Portable Windows target specified in `package.json` build section:
  ```json
  "win": {
    "target": ["portable"],
    "artifactName": "SahebPaper-Beta-1.9.${ext}"
  }
  ```
- Previous release binaries exist in `release/`:
  - `release/SahebPaper-Beta-1.7.exe` (104.9 MB)
  - `release/SahebPaper-Beta-1.0.exe` (104.7 MB)
- Scripts: `npm run electron:dev`, `npm run electron:build`.

### 3. Capacitor Android (APK)
- **Status**: **COMPLETE & PACKAGED**
- App ID: `com.sahebpaper.erp` in `capacitor.config.ts`, `webDir: "dist"`.
- Complete Android Studio project under `android/` with Gradle wrapper.
- Built debug binary exists in `release/`:
  - `release/SahebPaper-Preview-Debug.apk` (8.34 MB, built 28-09-2026).
- Scripts: `npm run android:sync`, `npm run android:build`, and root `build_apk.bat`.

### 4. In-App Update System (`appUpdateService.ts` & `version.json`)
- **How It Works**:
  - Application checks remote endpoints with cache-busting timestamp:
    1. GitHub raw `version.json`
    2. GitHub Pages `version.json`
    3. Local `/version.json?_t=${timestamp}`
  - Compares remote `versionCode` against local `getInstalledVersionCode()` stored in `localStorage.getItem('saheb_installed_version_code')`.
  - If remote `versionCode > installedVersionCode`, prompts user via `AppUpdateModal.tsx`.
  - On update confirmation, clears service worker caches (`clearAppCaches()`), sets `saheb_installed_version_code`, and reloads page or launches APK download.
- **Current Version Identifiers**:
  - `public/version.json`: `versionName = "Beta 1.9"`, `versionCode = 15`.
  - `src/config/version.ts`: `APP_BASE_VERSION = "Beta 1.9"`, `APP_BASE_CODE = 15`.
  - `package.json`: `"version": "1.9.0"`.
  - `src/services/appUpdateService.ts`: `DEFAULT_CLIENT_VERSION = 'Beta 1.8'`, `DEFAULT_CLIENT_VERSION_CODE = 14`.

### 5. Build Verification
- Command: `npm run build` (`tsc -b && vite build`)
- Result: **PASSED WITH ZERO ERRORS (Exit code 0)**.
- Modules transformed: 2,720 modules in 26.56s. All TypeScript types valid.

---

## 8. RECENT CHANGES (Last 15 Git Commits)

| Commit Hash | Author | Date | Summary |
| :--- | :--- | :--- | :--- |
| `f029c91` | RudraCoding2006 | 2026-10-06 | Reapply "feat: add LabView, DispatchView, MachineView, BoilerView, RewinderView, and DashboardView modules with Supabase sync and utilities" |
| `cbf1045` | RudraCoding2006 | 2026-10-06 | Revert "feat: add LabView, DispatchView, MachineView, BoilerView, RewinderView, and DashboardView modules with Supabase sync and utilities" |
| `006fddf` | RudraCoding2006 | 2026-10-06 | feat: add LabView, DispatchView, MachineView, BoilerView, RewinderView, and DashboardView modules with Supabase sync and utilities |
| `ef16a1f` | RudraCoding2006 | 2026-10-04 | Merge branch 'main' of https://github.com/thakordhruv097-spec/saheb-paper |
| `13f5414` | RudraCoding2006 | 2026-10-04 | feat: add custom searchable select component and core module views |
| `b94ee53` | RudraCoding2006 | 2026-10-04 | feat(rewinder): propagate 1st reel joints value to all reels by default |
| `5f29bef` | RudraCoding2006 | 2026-10-04 | feat(rewinder,machine,lab): update batch table header to SIZE, show CM in reel specs, and enhance lab & chemical formula workflows |
| `25dbb0b` | RudraCoding2006 | 2026-10-03 | 12 |
| `d8f90f7` | RudraCoding2006 | 2026-10-03 | fix(label-studio): remove printer emoji from print button text |
| `ed2ebfe` | RudraCoding2006 | 2026-10-03 | fix: resolve merge conflicts in DispatchView and LabelStudioView |
| `0298ca4` | RudraCoding2006 | 2026-10-03 | fix(ui): disable mouse wheel value changes on number inputs globally |
| `e0734cd` | RudraCoding2006 | 2026-10-03 | fix(rewinder,label-studio): enforce non-negative cut reel values and CM diameter formatting |
| `c8c2a36` | RudraCoding2006 | 2026-10-02 | feat(dispatch): add Quick Reel Specs modal and 1-click label printing on reel eye button |
| `9eaa423` | RudraCoding2006 | 2026-10-02 | fix(labels): format reel diameter strictly in CM and optimize thermal label layout |
| `fb4b981` | RudraCoding2006 | 2026-10-02 | feat: add core data store, raw material view, and rewinder view components |

---

## 9. KNOWN ISSUES & CODE OBSERVATIONS

1. **TODO / FIXME Comments**:
   - Zero `TODO` or `FIXME` comments found anywhere in `src/`.
2. **Version Code & Name Discrepancies**:
   - `src/services/appUpdateService.ts` specifies `DEFAULT_CLIENT_VERSION = 'Beta 1.8'` and `DEFAULT_CLIENT_VERSION_CODE = 14`.
   - `performFactoryReset()` in `src/data/index.ts` sets `saheb_installed_version_code = '14'` and `saheb_installed_version_name = 'Beta 1.8'`.
   - `main.cjs` sets window title to `"Saheb Paper Pvt. Ltd. (Beta 1.8)"`.
   - However, `package.json` is at `"1.9.0"`, `public/version.json` has `Beta 1.9` / code `15`, and `src/config/version.ts` has `Beta 1.9` / code `15`. If a factory reset is executed or a fresh browser loads, `appUpdateService` may consider Beta 1.8 installed and prompt for an update to Beta 1.9.
3. **Orphaned / Unrouted Modules**:
   - `src/modules/mindmap/SystemMindMapView.tsx` (22.2 KB) exists but is not registered in `src/App.tsx` routes.
   - `src/modules/experiment/ExperimentView.tsx` (256 bytes) is a dummy wrapper redirecting to `DispatchView`.
4. **Thin Module Wrappers**:
   - `OrdersView.tsx` (290 bytes) does not contain independent order logic; it renders `<DispatchView initialTab="orders" hideTabs={true} />`.
   - `RewindingReelConversionView.tsx` (217 bytes) simply renders `<RewinderView />`.
   - `FinishedStockDispatchView.tsx` renders tabs for `FinishStockView` and `QRScannerView`.

---

## 10. DISCREPANCIES (Code vs Documentation)

1. **Tech Stack Versions in `README.md`**:
   - `README.md` badges claim: React 19.0.0, TypeScript 5.7, Vite 6.2, Tailwind 3.4.
   - Code reality (`package.json`): React `^19.2.7`, TypeScript `~6.0.2`, Vite `^8.1.1` (Vite 8 runtime), and Tailwind `^4.3.2` with `@tailwindcss/vite` (Tailwind v4, not v3.4).
2. **Pulper Default PIN & Module**:
   - `README.md` documentation claims `pulper` PIN is `1234` and landing module is `/raw-material-stock`.
   - Code reality (`src/data/index.ts` line 128): `pulper` default PIN is `1122`, role is `PulpOperator`, and default landing module in `getFirstAccessibleRoute()` is `/` (Dashboard).
3. **Offline vs Cloud Database Documentation**:
   - Older docs in `AUDIT_REPORT.md` (dated 2026-09-09) mentioned Supabase had table alias mismatches and plain text PINs.
   - Code reality: Salted SHA-256 PIN hashing (`src/lib/security.ts`), RLS policies, table alias mappings (`TABLE_ALIASES` in `supabaseSync.ts`), and bidirectional WebSocket sync are all implemented in active code.

---

## 11. PENDING ITEMS CHECK

### a) Lab form: Number input boxes should be empty, not forced "0" (typing after delete should not leave a leading 0)
- **Status**: **YES (Fully Implemented)**
- **Verification in Code**:
  - In `src/modules/lab/LabView.tsx` (lines 249–269), all input states are initialized to empty string `''`:
    ```ts
    setSpeed('');
    setCrepingPct('');
    setGsmSamples(Array(14).fill(''));
    setBreakageCount('');
    setLabResultGsm('');
    setMoisturePct('');
    setCaliperMm('');
    setBulkCcGm('');
    setBreakingLengthMd('');
    setBreakingLengthCd('');
    setBrightnessPct('');
    setTearMd('');
    setTearCd('');
    setTensileDryMd('');
    setTensileDryCd('');
    setStretchDryMd('');
    setStretchDryCd('');
    ```
  - Input fields bind to `value={val === '' ? '' : val}`, select text on focus with `onFocus={e => e.target.select()}`, and set empty string on delete:
    ```tsx
    onChange={e => setMoisturePct(e.target.value === '' ? '' : parseFloat(e.target.value))}
    ```
  - In `handleGsmSampleChange` (lines 209–220):
    ```ts
    if (val === '' || val.trim() === '') {
      updated[index] = '';
    } else {
      const num = parseFloat(val);
      updated[index] = isNaN(num) ? '' : num;
    }
    ```
  - Global listener in `src/main.tsx` prevents mouse wheel scrolling from altering number values.

---

### b) Lab form: GSM average (Section 2, 14 samples) should auto-fill the GSM Result field (Section 3)
- **Status**: **YES (Fully Implemented)**
- **Verification in Code**:
  - In `src/modules/lab/LabView.tsx` (lines 175–181):
    ```ts
    // Real-time sync: Section 2 GSM Average directly updates Section 3 "1. GSM Result (g/m²)"
    useEffect(() => {
      if (gsmStats.avg > 0) {
        setLabResultGsm(gsmStats.avg);
      }
    }, [gsmStats.avg]);
    ```
  - Section 3 UI also displays a real-time badge:
    ```tsx
    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
      Auto: Avg {gsmStats.avg > 0 ? `${gsmStats.avg}` : '—'}
    </span>
    ```

---

### c) Machine Chemical Formula modal (`MachineView.tsx`): Date picker to view past dates' saved formula, read-only for past dates
- **Status**: **PARTIAL**
- **Verification in Code**:
  - **Date Picker to view past dates' formula**: **YES (Implemented)**. In `MachineView.tsx` (lines 780–840), there is a dedicated date picker `<CustomDatePickerModal>` and chevron navigation (`<ChevronLeft>` / `<ChevronRight>`) on the chemical formula card (`chemicalDateStr`). Operators can navigate to any past date and view the exact chemical dosages saved on that day.
  - **Copy past rates to today button**: **YES (Implemented)**. A `<button onClick={handleCopyRatesToToday}>` appears whenever `chemicalDateStr !== todayStr` allowing operators to copy past rates into today's formula.
  - **Read-only restriction for past dates**: **NO (Not Enforced)**:
    - The chemical input fields (lines 870–885) do NOT have `disabled={chemicalDateStr < todayStr}` or `readOnly={chemicalDateStr < todayStr}`. Operators can still type and edit dosages when looking at a past date.
    - The save button (lines 940–960) remains active on past dates and displays `"Save for DD-MM-YYYY"`, allowing past formula overwrite rather than locking it as read-only.
