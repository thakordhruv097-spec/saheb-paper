<div align="center">

# SAHEB PAPER PVT. LTD.
### Enterprise Paper Mill Operations, Production & Dispatch ERP System

[![Production](https://img.shields.io/badge/Production-Live-emerald?style=for-the-badge&logo=cloudflare)](https://saheb-paper-erp.thakordhruv097.workers.dev/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-amber?style=for-the-badge)](LICENSE)

**A specialized, end-to-end manufacturing ERP engineered exclusively for kraft, tissue, and duplex paper mills.**

[Launch Production App](https://saheb-paper-erp.thakordhruv097.workers.dev/) • [System Documentation](#core-erp-modules) • [Role Credentials](#system-access--roles)

---

</div>

## Overview

**Saheb Paper Pvt. Ltd.** (Chandisar, Palanpur, Gujarat) is a state-of-the-art paper manufacturing facility. This ERP platform digitizes and unifies the entire plant lifecycle—transitioning shop floor operations from paper logbooks to real-time, touch-optimized, multi-role digital control.

From raw material weighbridge inwards to pulper recipe chemistry, paper machine parent rolls, rewinder slitting, QR traceability, QC lab tear/burst certificates, utilities (boiler, ETP, grid power), finished goods inventory, and dispatch delivery challans with gate passes.

---

## Key Highlights & Capabilities

- **100% QR Traceability**: Complete lineage tracing from raw material lots -> pulper batch recipe -> machine jumbo rolls -> rewound slitted reels -> dispatch delivery challan.
- **Role-Based Access Control (RBAC)**: 6 distinct operational roles with custom accessible modules, auto-redirect routing, worker login simulation for admins, and read-only viewer mode.
- **Hardware & Printer Integration**: Built-in thermal barcode/QR sticker designer with ESC/POS & TSC/Zebra presets (4"x3", 3"x2", 2"x2") and multi-page A4 delivery challan printing.
- **Offline-Resilient Local Persistence**: Zero-latency local caching with reactive state syncing, automatic schema migrations, and cloud-ready data model.
- **Multilingual Support**: Real-time localization in **English**, **Hindi**, and **Gujarati**.
- **Utilities Telemetry**: Shift-by-shift logging for boiler steam pressure/fuel efficiency, ETP effluent chemical parameters, and electricity power factor/kVA demand.

---

## System Access & Roles

Access the system across different shop-floor perspectives using the pre-configured role credentials:

| Role | Username | Default PIN | Default Landing Module | Key Responsibilities |
| :--- | :--- | :---: | :--- | :--- |
| **Admin** | `admin` | `1234` | `/` (Dashboard) | Complete mill oversight, user management, audit logs, system config |
| **Plant Manager** | `plant_manager` | `1234` | `/` (Dashboard) | Shift production, machine scheduling, utility management, reporting |
| **Pulper Operator** | `pulper` | `1234` | `/raw-material-stock` | Raw material inwards, pulp hydrapulper batch formulas, chemical dosing |
| **Shop / Store** | `shop` | `1234` | `/spareparts-management` | Spare parts, V-Belts, Bearings, machine maintenance procurement |
| **Dispatcher** | `dispatcher` | `1234` | `/orders` | Order booking, stock categorization, delivery challans, gate passes |
| **Viewer (Read-Only)** | `viewer` | `1234` | `/` (Dashboard) | Full mill analytics access; all print, export, and edit actions locked |

---

## 📦 Core ERP Modules

### 1. 📊 Executive Dashboard & Analytics
- Live KPI cards: Today's net production (MT), active shift output, pending orders, and dispatched volume.
- Interactive charts: Daily production trends, grade breakdown (Grade A vs Grade B), and dispatch velocity.
- Real-time stock summary across jumbo reels and finished stock inventory.

### 2. 🚛 Raw Material Inward & Stock Ledger
- Inventory tracking for waste paper types (Indian Tissue Waste, Imported Waste, SMK, Broke, Pulp Sheets).
- Chemical stock monitoring (DSR, WSR, Caustic, Peroxide, Hypo, Bleaching Powder, OBA, MG Release).
- Boiler fuels ledger (Wood, Biocoal, Briquettes).
- Batch barcode and QR label generation for incoming raw material lots.

### 3. 🧪 Pulp Mill Operations & Recipe Formulas
- Chemical and raw material recipe batching for Hydrapulpers.
- Moisture compensation and consistency percentage calculations.
- Historical batch formula archive with pulp recipe reuse.

### 4. 🏭 Machine Production & Parent Roll Logging
- Shift-based parent jumbo roll logging (Roll No, Gross Weight, Net Weight, Deckle, GSM).
- Real-time production telemetry: machine speed (MPM), basis weight variations, and wire speeds.
- Shift handover notes and production remarks.

### 5. 🔄 Rewinder & Reel Conversion
- Parent roll to customer reel conversion and precision slitting.
- Real-time calculation of trimmed waste, broke percentage, and roll balance.
- Instant QR code tag generation for every finished reel.
- Batch QR label printing directly to thermal printers.

### 6. 🏷️ Universal Label Studio
- Custom thermal label designer supporting multiple standard mill dimensions:
  - **4" × 3"** Standard Shipping & Warehouse Label
  - **3" × 2"** Compact Reel Barcode Tag
  - **2" × 2"** Batch QR Mini Sticker
- Print preview with live barcode and QR code rendering.

### 7. 🔬 Quality Control (QC) Lab & Paper Testing
- Physical property verification:
  - Average GSM, Moisture %, Tensile Strength (MD/CD), Burst Factor (BF), Tear Factor, Cobb Test, Bulk, and Ash %.
- Quality grading assignment (`GRADE_A`, `GRADE_B`, `REJECTED`).
- One-click branded **Paper Test Certificate PDF** generation.

### 8. 🔥 Utilities: Boiler Operations
- Shift logging of steam pressure, temperature, and feed-water levels.
- Fuel consumption logging (Wood, Biocoal) vs steam generation efficiency ratio.

### 9. 💧 Utilities: Effluent Treatment Plant (ETP)
- Wastewater compliance logging: pH, TSS, COD, BOD, and treated water reuse metrics.
- Chemical dosing records (Alum, Polymer, Lime, Hypo).

### 10. ⚡ Utilities: Electricity & Power Grid
- HT/LT meter readings, active power consumption (kWh), maximum demand (kVA), and power factor (PF).
- Specific power consumption analysis per Metric Ton (MT) of paper manufactured.

### 11. 📋 Customer Order Booking
- Party / client sales order register with paper specification targets (GSM, Size, BF, Shade, Target MT).
- Order status pipeline: `PENDING` → `IN_PRODUCTION` → `ALLOCATED` → `DISPATCHED`.

### 12. 📦 Finished Goods Stock Categorization
- Physical warehouse categorization of reels ready for dispatch.
- Visual status indicators, specification matching against open customer orders.

### 13. 🚚 Delivery Challan & Dispatch Gate Pass
- Multi-page printable Delivery Challans and Official Gate Passes with truck and driver details.
- Real-time gross, tare, and net vehicle weighment capture.
- Digital sign-off records for Consignee, Security Gate, and Plant In-charge.
- Dispatched reels audit vault with historical challan lookup.

### 14. ⚙️ Spare Parts & Store Inventory
- Critical spares stock register (Bearings, V-Belts, Seals, Valves, Motors).
- Minimum threshold alert triggers for maintenance replenishment.

### 15. 📈 Management Reporting & PDF Export
- Date-range filtered analytics for monthly, quarterly, and annual review.
- High-resolution printable PDF export and Excel (`.xlsx`) sheet generation.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Core** | React 19, TypeScript, Vite 6, React Router DOM 7 |
| **Styling & Design** | Tailwind CSS 3.4, Vanilla CSS Design Tokens, Glassmorphism, Dark/Light Theme |
| **Icons & Visuals** | Lucide React |
| **Charts & Analytics**| Recharts |
| **Data Persistence** | Reactive Local Storage Engine with schema versioning & Supabase/Firebase mapping |
| **Printing & PDF** | ESC/POS thermal generation, Browser Native Print Interceptor, HTML-to-PDF engine |
| **Internationalization** | i18next + react-i18next (English, Hindi, Gujarati) |
| **Tooling & Linting** | Oxlint, TypeScript Compiler (`tsc -b`) |

---

## 📂 Project Directory Structure

```text
saheb-paper-demo/
├── src/
│   ├── components/            # Shared UI components (Modals, Headers, Tables, Thermal Prints)
│   ├── config/                # Company branding, modules master & i18n localization
│   ├── data/                  # Core seed data, storage management, schema types & migrations
│   ├── hooks/                 # Custom React hooks (scroll lock, media queries, filters)
│   ├── modules/               # Feature domain modules:
│   │   ├── admin/             # User Management & Admin Master Configurations
│   │   ├── auth/              # Login view, AuthContext, ProtectedRoute, PIN reset
│   │   ├── dashboard/         # Main Executive Dashboard & KPI widgets
│   │   ├── dispatch/          # Finished Stock, Packing Slips, Challan Vault
│   │   ├── lab/               # QC Paper Testing Lab & PDF Certificate Generator
│   │   ├── label-studio/      # Thermal Sticker Barcode/QR Designer
│   │   ├── orders/            # Order Booking & Customer Registry
│   │   ├── profile/           # User Profile & Role Switcher
│   │   ├── pulp-mill/         # Hydrapulper Batch Formulations & Recipes
│   │   ├── raw-material/      # Raw Material Stock Inwards & Barcode Tags
│   │   ├── reports/           # Monthly/Yearly Production PDF & Excel Analytics
│   │   ├── rewinder/          # Rewinder Slitting, Reel Logging & QR Tags
│   │   ├── spareparts/        # Store Inventory & Maintenance Spares
│   │   └── utilities/         # Boiler, ETP & Electricity Shift Logs
│   ├── utils/                 # PDF generator engines, Excel export, print formatters
│   ├── App.tsx                # Master routing and layout shell
│   └── main.tsx               # App entrypoint
├── public/                    # Static assets, company logo, favicons
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite build and development configuration
└── README.md                  # Project documentation
```

---

## 💻 Getting Started Locally

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/thakordhruv097-spec/saheb-paper-demo.git
   cd saheb-paper-demo
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at: `http://localhost:5176/`

4. **Verify TypeScript & Linting**:
   ```bash
   npm run lint -- --quiet
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```
   The compiled production bundle will be generated in the `dist/` directory.

---

## 🏢 Company Information

**SAHEB PAPER PVT. LTD.**  
- **Plant Address**: Chandisar, Palanpur, Gujarat - 385510, India  
- **Phone**: +91 80005 63666  
- **Website**: [www.sahebpaper.com](https://www.sahebpaper.com)  

---

<div align="center">

*Proprietary Paper Mill ERP Software • Developed for Saheb Paper Pvt. Ltd.*

</div>
