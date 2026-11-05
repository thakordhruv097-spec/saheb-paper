# 🔧 Technical Documentation - Saheb Paper ERP

<div align="center">

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Capacitor-blue?style=flat-square)
![Build](https://img.shields.io/badge/Build-Vite%208.1-purple?style=flat-square)

**Developer & Integration Guide**

</div>

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [Data Management](#data-management)
6. [API Integration](#api-integration)
7. [Build & Deployment](#build--deployment)
8. [Development Guide](#development-guide)
9. [Testing](#testing)
10. [Performance Optimization](#performance-optimization)

---

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │  Android    │   Windows   │     Web     │    PWA      │ │
│  │  (Capacitor)│  (Electron) │  (Browser)  │  (Service   │ │
│  │             │             │             │   Worker)   │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React 19 + TypeScript 6.0                 │ │
│  │  ┌──────────┬──────────┬──────────┬──────────────┐   │ │
│  │  │ Auth     │ Modules  │ Utils    │ Components   │   │ │
│  │  │ Context  │ (12)     │ (PDF,    │ (Shared UI)  │   │ │
│  │  │          │          │  Excel)  │              │   │ │
│  │  └──────────┴──────────┴──────────┴──────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌────────────────┬──────────────────┬──────────────────┐  │
│  │  Local Storage │   IndexedDB      │  Supabase (Opt)  │  │
│  │  (Reactive)    │  (Large Data)    │  (Cloud Sync)    │  │
│  └────────────────┴──────────────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    Native/Hardware Layer                     │
│  ┌──────────┬──────────┬────────────┬──────────────────┐   │
│  │ Camera   │ Storage  │ Printer    │ Network          │   │
│  │ (QR/Bar) │ (Files)  │ (Thermal)  │ (HTTP/WebSocket) │   │
│  └──────────┴──────────┴────────────┴──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

- **Component-Based Architecture**: Modular React components
- **Context API**: Global state management (AuthContext, ThemeContext)
- **Offline-First**: Local data persistence with optional cloud sync
- **Reactive State**: Real-time UI updates on data changes
- **Role-Based Access Control (RBAC)**: Route guards and permission checks
- **Factory Pattern**: PDF and Excel generators
- **Observer Pattern**: Event-driven printing and file operations

---

## 💻 Technology Stack

### Frontend Core

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.7 | UI framework |
| **TypeScript** | 6.0.2 | Type-safe development |
| **Vite** | 8.1.1 | Build tool & dev server |
| **React Router DOM** | 7.18.1 | Client-side routing |

### UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.3.2 | Utility-first CSS |
| **Lucide React** | 1.24.0 | Icon library |
| **Vanilla CSS** | - | Custom design tokens |

### Data & Charts

| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | 3.9.2 | Data visualization |
| **Chart.js** | 4.5.1 | Additional charting |
| **react-chartjs-2** | 5.3.1 | Chart.js React wrapper |

### Utilities & Features

| Technology | Version | Purpose |
|------------|---------|---------|
| **date-fns** | 4.4.0 | Date manipulation |
| **i18next** | 26.3.6 | Internationalization |
| **react-i18next** | 17.0.10 | i18n React integration |
| **qrcode.react** | 4.2.0 | QR code generation |
| **html5-qrcode** | 2.3.8 | QR/Barcode scanning |
| **jsPDF** | 4.2.1 | PDF generation |
| **xlsx** | 0.18.5 | Excel file generation |
| **xlsx-js-style** | 1.2.0 | Excel styling |
| **docx** | 9.7.1 | Word document generation |

### Mobile & Desktop

| Technology | Version | Purpose |
|------------|---------|---------|
| **@capacitor/core** | 8.4.2 | Native mobile runtime |
| **@capacitor/android** | 8.4.2 | Android platform |
| **@capacitor/app** | 8.1.1 | App lifecycle |
| **@capacitor/filesystem** | 8.1.3 | File operations |
| **@capacitor/share** | 8.0.2 | Native sharing |
| **electron** | 43.1.1 | Desktop app runtime |
| **electron-builder** | 26.15.3 | Desktop app packaging |

### Backend & Cloud (Optional)

| Technology | Version | Purpose |
|------------|---------|---------|
| **@supabase/supabase-js** | 2.115.0 | Cloud database & auth |
| **Cloudflare Workers** | - | Edge hosting |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **oxlint** | 1.71.0 | Fast linter |
| **puppeteer** | 25.16.0 | Automated testing |
| **ffmpeg-static** | 5.3.0 | Video processing |

---

## 📁 Project Structure

```
saheb-paper-demo/
│
├── src/
│   ├── components/              # Shared UI components
│   │   ├── AppUpdateModal.tsx   # App update notification
│   │   ├── BottomNavBar.tsx     # Bottom navigation
│   │   ├── Header.tsx           # Top header bar
│   │   ├── Layout.tsx           # Main layout wrapper
│   │   ├── LoadingSpinner.tsx   # Loading indicator
│   │   ├── Modal.tsx            # Generic modal component
│   │   ├── RootErrorBoundary.tsx # Error handling
│   │   └── ThermalLabel.tsx     # Thermal printer templates
│   │
│   ├── config/
│   │   ├── company.ts           # Company branding constants
│   │   ├── i18n.ts              # Internationalization config
│   │   └── modules.ts           # Module definitions & permissions
│   │
│   ├── data/
│   │   ├── index.ts             # Main data management
│   │   ├── storage.ts           # LocalStorage wrapper
│   │   ├── types.ts             # TypeScript interfaces
│   │   └── migrations.ts        # Schema migrations
│   │
│   ├── hooks/
│   │   ├── useScrollLock.ts     # Scroll lock utility
│   │   ├── useMediaQuery.ts     # Responsive hooks
│   │   └── useFilters.ts        # Data filtering
│   │
│   ├── modules/
│   │   ├── admin/               # Admin panel & user management
│   │   │   ├── AdminPanel.tsx
│   │   │   └── UserManagement.tsx
│   │   │
│   │   ├── auth/                # Authentication
│   │   │   ├── LoginView.tsx
│   │   │   ├── OtpVerificationView.tsx
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── festivalThemes.ts
│   │   │   ├── useFestivalTheme.ts
│   │   │   └── ThemeSelectionModal.tsx
│   │   │
│   │   ├── dashboard/           # Executive dashboard
│   │   │   ├── Dashboard.tsx
│   │   │   ├── KPICards.tsx
│   │   │   └── ProductionCharts.tsx
│   │   │
│   │   ├── dispatch/            # Dispatch & delivery
│   │   │   ├── FinishedGoodsStock.tsx
│   │   │   ├── DeliveryChallan.tsx
│   │   │   ├── DispatchedReelsVault.tsx
│   │   │   └── ChallanPreview.tsx
│   │   │
│   │   ├── lab/                 # Quality control
│   │   │   ├── QualityControlLab.tsx
│   │   │   ├── PaperTestForm.tsx
│   │   │   └── TestCertificatePDF.tsx
│   │   │
│   │   ├── label-studio/        # Label designer
│   │   │   ├── LabelStudio.tsx
│   │   │   └── LabelTemplates.tsx
│   │   │
│   │   ├── orders/              # Customer orders
│   │   │   ├── OrdersView.tsx
│   │   │   └── OrderForm.tsx
│   │   │
│   │   ├── profile/             # User profile
│   │   │   ├── ProfileView.tsx
│   │   │   └── Settings.tsx
│   │   │
│   │   ├── pulp-mill/           # Pulp operations
│   │   │   ├── PulpMillView.tsx
│   │   │   └── RecipeManager.tsx
│   │   │
│   │   ├── raw-material/        # Raw material stock
│   │   │   ├── RawMaterialStock.tsx
│   │   │   └── StockEntry.tsx
│   │   │
│   │   ├── reports/             # Reports & analytics
│   │   │   ├── ReportsView.tsx
│   │   │   └── ExportManager.tsx
│   │   │
│   │   ├── rewinder/            # Rewinder operations
│   │   │   ├── RewinderView.tsx
│   │   │   └── ReelLogging.tsx
│   │   │
│   │   ├── spareparts/          # Spare parts inventory
│   │   │   └── SparePartsView.tsx
│   │   │
│   │   └── utilities/           # Utilities monitoring
│   │       ├── BoilerView.tsx
│   │       ├── ETPView.tsx
│   │       └── ElectricityView.tsx
│   │
│   ├── services/                # External services
│   │   └── smsService.ts        # SMS/OTP service
│   │
│   ├── utils/
│   │   ├── pdfGenerator.ts      # PDF generation utilities
│   │   ├── excelExport.ts       # Excel export utilities
│   │   ├── printHelpers.ts      # Printing utilities
│   │   └── qrGenerator.ts       # QR code utilities
│   │
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # App entry point
│   └── index.css                # Global styles
│
├── public/
│   ├── index.html               # HTML template
│   ├── version.json             # App version info
│   ├── logo.png                 # Company logo
│   └── login_bg_*.webp          # Festival backgrounds
│
├── android/                     # Android Capacitor project
│   ├── app/
│   │   ├── src/
│   │   └── build.gradle
│   └── gradle/
│
├── capacitor.config.ts          # Capacitor configuration
├── vite.config.ts               # Vite build config
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind CSS config
├── package.json                 # Dependencies
├── main.cjs                     # Electron main process
├── preload.cjs                  # Electron preload script
└── README.md                    # Project documentation
```

---

## ⚙️ Core Features

### 1. Authentication & Authorization

**Implementation**: `src/modules/auth/`

```typescript
// AuthContext.tsx - Global auth state
interface AuthContextType {
  user: User | null;
  login: (username: string, pin: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  userRole: UserRole;
  hasPermission: (module: string) => boolean;
}

// ProtectedRoute.tsx - Route guards
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, hasPermission } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (!hasPermission(requiredRole)) return <AccessDenied />;
  
  return children;
};
```

**Features**:
- PIN-based authentication (4 digits)
- Role-based access control
- Session persistence
- Worker login simulation (admin)
- PIN reset functionality

---

### 2. Data Persistence

**Implementation**: `src/data/`

```typescript
// Reactive LocalStorage wrapper
class DataStore {
  private listeners: Map<string, Function[]> = new Map();
  
  save<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
    this.notify(key);
  }
  
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  
  subscribe(key: string, callback: Function): () => void {
    // Observer pattern implementation
  }
}
```

**Data Structure**:
```typescript
interface AppData {
  users: User[];
  rawMaterialStock: RawMaterialEntry[];
  pulpBatches: PulpBatch[];
  machineProduction: ProductionRoll[];
  rewinderJobs: RewinderJob[];
  finishedReels: FinishedReel[];
  qcTests: QCTest[];
  customerOrders: CustomerOrder[];
  deliveryChallans: DeliveryChallan[];
  utilities: {
    boiler: BoilerLog[];
    etp: ETPLog[];
    electricity: PowerLog[];
  };
  spareParts: SparePart[];
}
```

---

### 3. QR Code & Barcode System

**Implementation**: `src/utils/qrGenerator.ts`

```typescript
// QR code generation
export const generateReelQR = (reel: FinishedReel): string => {
  const data = {
    type: 'REEL',
    id: reel.id,
    reelNumber: reel.reelNumber,
    parentRoll: reel.parentRollId,
    weight: reel.netWeight,
    gsm: reel.gsm,
    deckle: reel.deckle,
    grade: reel.grade,
    productionDate: reel.createdAt,
  };
  return JSON.stringify(data);
};

// Hardware-accelerated scanning (Android)
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

export const scanQRCode = async (): Promise<string> => {
  await BarcodeScanner.checkPermission({ force: true });
  const result = await BarcodeScanner.startScan();
  if (result.hasContent) {
    return result.content;
  }
  throw new Error('No QR code detected');
};
```

---

### 4. PDF Generation

**Implementation**: `src/utils/pdfGenerator.ts`

```typescript
import jsPDF from 'jspdf';

export const generateDeliveryChallan = (challan: DeliveryChallan): jsPDF => {
  const doc = new jsPDF();
  
  // Page 1: Delivery Challan
  doc.setFontSize(20);
  doc.text('DELIVERY CHALLAN', 105, 20, { align: 'center' });
  
  // Company details
  doc.setFontSize(10);
  doc.text('SAHEB PAPER PVT. LTD.', 20, 40);
  doc.text('Chandisar, Palanpur, Gujarat - 385510', 20, 45);
  
  // Challan details
  doc.text(`Challan No: ${challan.challanNumber}`, 20, 60);
  doc.text(`Date: ${formatDate(challan.date)}`, 20, 65);
  
  // Reel table
  const reelData = challan.reels.map(r => [
    r.reelNumber,
    r.gsm,
    r.deckle,
    r.netWeight,
  ]);
  
  doc.autoTable({
    head: [['Reel No', 'GSM', 'Deckle', 'Weight (KG)']],
    body: reelData,
    startY: 80,
  });
  
  // Page 2: Gate Pass
  doc.addPage();
  doc.text('GATE PASS', 105, 20, { align: 'center' });
  // ... gate pass content
  
  return doc;
};
```

**PDF Features**:
- Multi-page documents
- Tables with auto-layout
- QR code embedding
- Company branding
- Custom fonts and styling
- Direct download (Android: native MediaStore)

---

### 5. Excel Export

**Implementation**: `src/utils/excelExport.ts`

```typescript
import * as XLSX from 'xlsx';
import * as XLSXStyle from 'xlsx-js-style';

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Apply styling
  const range = XLSX.utils.decode_range(worksheet['!ref']!);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!worksheet[address]) continue;
    worksheet[address].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center' },
    };
  }
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
```

---

### 6. Internationalization (i18n)

**Implementation**: `src/config/i18n.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: require('./locales/en.json') },
    hi: { translation: require('./locales/hi.json') },
    gu: { translation: require('./locales/gu.json') },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Usage in components
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button onClick={() => i18n.changeLanguage('hi')}>
        हिंदी
      </button>
    </div>
  );
};
```

**Supported Languages**:
- English (en)
- Hindi (hi)
- Gujarati (gu)

---

### 7. Thermal Printing

**Implementation**: `src/components/ThermalLabel.tsx`

```typescript
// ESC/POS command generation
export const generateESCPOS = (label: Label): Uint8Array => {
  const commands: number[] = [];
  
  // Initialize printer
  commands.push(0x1B, 0x40); // ESC @
  
  // Set alignment center
  commands.push(0x1B, 0x61, 0x01); // ESC a 1
  
  // Print title (large text)
  commands.push(0x1B, 0x21, 0x30); // ESC ! 48 (double width+height)
  commands.push(...stringToBytes(label.title));
  commands.push(0x0A); // Line feed
  
  // Print QR code
  const qrData = label.qrData;
  commands.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00); // QR model
  commands.push(0x1D, 0x28, 0x6B, qrData.length + 3, 0x00, 0x31, 0x50, 0x30); // Store data
  commands.push(...stringToBytes(qrData));
  commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30); // Print QR
  
  // Cut paper
  commands.push(0x1D, 0x56, 0x00); // GS V 0
  
  return new Uint8Array(commands);
};
```

**Supported Label Sizes**:
- 4" × 3" (Standard shipping)
- 3" × 2" (Compact reel tag)
- 2" × 2" (Mini QR sticker)

---

## 🔄 Data Management

### Schema Versioning

```typescript
// src/data/migrations.ts
const migrations = [
  {
    version: 1,
    up: (data: any) => {
      // Initial schema
      return { ...data, version: 1 };
    },
  },
  {
    version: 2,
    up: (data: any) => {
      // Add festival theme support
      return {
        ...data,
        users: data.users.map((u: any) => ({
          ...u,
          festivalTheme: 'default',
        })),
        version: 2,
      };
    },
  },
];

export const runMigrations = (data: any): any => {
  const currentVersion = data.version || 0;
  let migratedData = data;
  
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      migratedData = migration.up(migratedData);
    }
  }
  
  return migratedData;
};
```

---

### Cloud Sync (Optional)

```typescript
// src/data/sync.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const syncToCloud = async (data: AppData) => {
  try {
    await supabase.from('app_data').upsert({
      id: data.plantId,
      data: data,
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    return false;
  }
};

export const syncFromCloud = async (plantId: string): Promise<AppData> => {
  const { data, error } = await supabase
    .from('app_data')
    .select('data')
    .eq('id', plantId)
    .single();
    
  if (error) throw error;
  return data.data;
};
```

---

## 🚀 Build & Deployment

### Development Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5176

# Type checking
npm run lint

# Build for production
npm run build
```

---

### Android Build

```bash
# Sync Capacitor
npm run android:sync

# Build APK (Debug)
npm run android:build
# → android/app/build/outputs/apk/debug/app-debug.apk

# Build APK (Release - requires keystore)
cd android
./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

**Android Signing** (for production):

```bash
# Generate keystore
keytool -genkey -v -keystore saheb-paper.keystore \
  -alias saheb-paper-key -keyalg RSA -keysize 2048 \
  -validity 10000

# Add to android/app/build.gradle:
signingConfigs {
  release {
    storeFile file("saheb-paper.keystore")
    storePassword "YOUR_PASSWORD"
    keyAlias "saheb-paper-key"
    keyPassword "YOUR_PASSWORD"
  }
}
```

---

### Windows Build

```bash
# Build Electron executable
npm run electron:build
# → release/SahebPaper-Beta-1.10.exe
```

**Electron Builder Config** (package.json):

```json
{
  "build": {
    "appId": "com.sahebpaper.app",
    "productName": "SahebPaper Beta 1.10",
    "directories": {
      "output": "release"
    },
    "win": {
      "target": ["portable"],
      "artifactName": "SahebPaper-Beta-1.10.${ext}"
    }
  }
}
```

---

### Web Deployment

#### Cloudflare Workers (Current)

```bash
# Install Wrangler CLI
npm install -g wrangler

# Deploy
npx wrangler deploy
# → https://saheb-paper-erp.thakordhruv097.workers.dev/
```

**wrangler.jsonc**:

```jsonc
{
  "name": "saheb-paper-erp",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "dist"
}
```

#### Alternative: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy --prod
```

#### Alternative: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication**:
- [ ] Login with all roles
- [ ] PIN change
- [ ] Logout
- [ ] Session persistence

**Data Operations**:
- [ ] Create entries (all modules)
- [ ] Edit entries
- [ ] Delete entries
- [ ] Data persistence after app restart

**QR/Barcode**:
- [ ] Generate QR codes
- [ ] Scan QR codes (hardware camera)
- [ ] Print QR labels

**PDF/Excel**:
- [ ] Generate delivery challan PDF
- [ ] Download PDF (Android native folder)
- [ ] Export data to Excel
- [ ] Print documents

**Offline Mode**:
- [ ] All features work without internet
- [ ] Data persists locally
- [ ] Sync when online (if enabled)

**Mobile Specific**:
- [ ] Hardware back button
- [ ] Portrait/landscape orientation
- [ ] Native file downloads
- [ ] Camera permissions
- [ ] Storage permissions

---

### Automated Testing (Future)

```bash
# Unit tests (to be implemented)
npm run test

# E2E tests with Puppeteer
npm run test:e2e
```

---

## ⚡ Performance Optimization

### Build Optimization

**Vite Configuration** (vite.config.ts):

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts', 'chart.js', 'react-chartjs-2'],
          'utils': ['date-fns', 'qrcode.react', 'jspdf', 'xlsx'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### Code Splitting

```typescript
// Lazy load modules
const Dashboard = lazy(() => import('./modules/dashboard/Dashboard'));
const RewinderView = lazy(() => import('./modules/rewinder/RewinderView'));

// Usage
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Suspense>
```

### Image Optimization

- **Festival backgrounds**: WebP format (90% smaller than PNG)
- **Logo**: SVG for scalability
- **Icons**: Lucide React (tree-shakeable)

### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze

# Check bundle composition
npx vite-bundle-visualizer
```

---

## 🔌 API Integration

### Supabase Integration (Optional)

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Example: Fetch customer orders from cloud
export const fetchOrders = async () => {
  const { data, error } = await supabase
    .from('customer_orders')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};
```

### SMS Service Integration

```typescript
// src/services/smsService.ts
export const sendOTP = async (phone: string): Promise<string> => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  const response = await fetch('https://api.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template_id: 'YOUR_TEMPLATE_ID',
      mobile: phone,
      otp: otp,
    }),
  });
  
  if (!response.ok) throw new Error('SMS send failed');
  return otp;
};
```

---

## 📦 Environment Variables

Create `.env` file:

```bash
# App Config
VITE_APP_VERSION=1.10.6
VITE_APP_BUILD=25

# Supabase (Optional)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# SMS Service (Optional)
VITE_SMS_API_KEY=your-sms-api-key

# Feature Flags
VITE_ENABLE_CLOUD_SYNC=false
VITE_ENABLE_SMS_OTP=false
```

---

## 🔐 Security Best Practices

1. **Authentication**:
   - PIN-based (4 digits) - sufficient for shop floor
   - Session expiry after 8 hours
   - Automatic logout on device lock

2. **Data Storage**:
   - Local storage encrypted (Capacitor Secure Storage for sensitive data)
   - No sensitive data in logs
   - Automatic data backup

3. **API Security**:
   - HTTPS only for cloud sync
   - API keys in environment variables (never in code)
   - Rate limiting on cloud endpoints

4. **Code Security**:
   - No hardcoded credentials
   - Input validation on all forms
   - SQL injection prevention (parameterized queries)
   - XSS protection (React auto-escaping)

---

## 📞 Developer Support

### Contact

- **Developer**: Dhruvkumar Niteshkumar Thakor
- **Email**: thakordhruv097@gmail.com
- **GitHub**: [@thakordhruv097-spec](https://github.com/thakordhruv097-spec)

### Contributing

```bash
# Fork the repository
git clone https://github.com/thakordhruv097-spec/saheb-paper-demo.git

# Create feature branch
git checkout -b feature/your-feature-name

# Commit changes
git commit -m "feat: add your feature"

# Push to GitHub
git push origin feature/your-feature-name

# Open Pull Request
```

---

<div align="center">

**Technical Documentation - Saheb Paper ERP**

[← Installation Guide](INSTALLATION_GUIDE.md) | [User Manual](USER_MANUAL.md) | [Release Notes →](RELEASE_NOTES.md)

</div>
