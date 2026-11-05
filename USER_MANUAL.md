# 📖 User Manual - Saheb Paper ERP

<div align="center">

![Version](https://img.shields.io/badge/Version-Beta%201.10.6-success?style=flat-square)
![Users](https://img.shields.io/badge/Target-Shop%20Floor%20%26%20Management-blue?style=flat-square)

**Complete Guide for All Users and Roles**

</div>

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Dashboard Overview](#dashboard-overview)
4. [Module-by-Module Guide](#module-by-module-guide)
5. [Common Tasks](#common-tasks)
6. [Tips & Best Practices](#tips--best-practices)
7. [FAQ](#faq)

---

## 🚀 Getting Started

### First Login

1. **Launch the App**
2. **Select your language** (English / Hindi / Gujarati)
3. **Enter credentials**:
   - Username (provided by admin)
   - 4-digit PIN
4. **Tap Login**

### Changing Your PIN

🔒 **Recommended for security**

1. Go to **Profile** (bottom navigation)
2. Tap **Change PIN**
3. Enter **current PIN**
4. Enter **new 4-digit PIN**
5. **Confirm** new PIN
6. Tap **Save**

### Navigation Basics

#### Bottom Navigation Bar

| Icon | Module | Description |
|------|--------|-------------|
| 🏠 | Dashboard | Overview and analytics |
| 📦 | Main Work | Your primary module (role-based) |
| ➕ | Quick Actions | Fast access to common tasks |
| 👤 | Profile | Account settings and info |

#### Top Header

- **Menu** (☰): Opens side navigation
- **Theme Toggle** (🌙/☀️): Switch dark/light mode
- **Language** (🌐): Change language
- **Notifications** (🔔): System alerts

### Understanding Icons

| Icon | Meaning |
|------|---------|
| ✅ | Success / Completed |
| ⏳ | In Progress / Pending |
| ❌ | Error / Rejected |
| 📄 | Document / Report |
| 🖨️ | Print |
| 📥 | Download |
| 📤 | Upload / Dispatch |
| 🔍 | Search |
| ✏️ | Edit |
| 🗑️ | Delete |
| 🔐 | Locked / Restricted |

---

## 👥 User Roles & Permissions

### 1. 👨‍💼 Admin (Administrator)

**Access Level**: Full System Access

**Main Dashboard**: Executive Overview
**Can Access**:
- All modules
- User management
- System configuration
- Audit logs
- Reports and analytics
- Worker login simulation

**Primary Responsibilities**:
- System administration
- User account management
- Access control
- System configuration
- Data backup and recovery
- Overall mill oversight

---

### 2. 👨‍🏭 Plant Manager

**Access Level**: Production & Management

**Main Dashboard**: Production Overview
**Can Access**:
- Dashboard
- Machine production
- Pulp mill operations
- Utilities (Boiler, ETP, Electricity)
- Raw material stock
- Rewinder operations
- Quality control lab
- Reports

**Primary Responsibilities**:
- Shift production monitoring
- Machine scheduling
- Utility management
- Quality oversight
- Production reporting

---

### 3. 👨‍🔧 Pulper Operator

**Access Level**: Raw Material & Pulp Operations

**Main Dashboard**: Raw Material Stock
**Can Access**:
- Raw material stock
- Pulp mill operations
- Chemical inventory
- Batch recipe management

**Primary Responsibilities**:
- Raw material receiving
- Stock management
- Pulp batch preparation
- Chemical dosing
- Recipe execution

---

### 4. 👨‍💼 Shop / Store Manager

**Access Level**: Inventory Management

**Main Dashboard**: Spare Parts Management
**Can Access**:
- Spare parts inventory
- Store management
- Maintenance supplies
- Stock alerts

**Primary Responsibilities**:
- Spare parts tracking
- Maintenance inventory
- Stock level monitoring
- Procurement requests
- Minimum threshold alerts

---

### 5. 🚚 Dispatcher

**Access Level**: Orders & Dispatch

**Main Dashboard**: Customer Orders
**Can Access**:
- Customer orders
- Finished goods stock
- Dispatch operations
- Delivery challans
- Gate passes
- Weighment records

**Primary Responsibilities**:
- Order booking
- Stock allocation
- Dispatch planning
- Challan generation
- Vehicle weighment
- Gate pass management

---

### 6. 👁️ Viewer (Read-Only)

**Access Level**: View Only (No Edit/Delete)

**Main Dashboard**: Executive Dashboard
**Can Access** (View Only):
- All dashboards
- All reports
- All stock levels
- Production data
- Quality records

**Cannot Do**:
- Create/Edit/Delete records
- Generate transactions
- Modify data
- Export sensitive data

**Primary Responsibilities**:
- Data review
- Analytics viewing
- Audit trail monitoring

---

## 📊 Dashboard Overview

### Key Performance Indicators (KPIs)

#### Today's Production
- **Total MT**: Total metric tons produced today
- **Shift Output**: Current shift production
- **Target**: Daily production target
- **Achievement %**: Target completion percentage

#### Stock Summary
- **Jumbo Rolls**: Parent rolls available
- **Finished Reels**: Ready for dispatch
- **In Process**: Currently in rewinder
- **Rejected**: Quality failures

#### Orders Status
- **Pending**: Open customer orders
- **In Production**: Currently manufacturing
- **Allocated**: Stock assigned to orders
- **Dispatched**: Completed deliveries

#### Utilities
- **Boiler**: Steam pressure and fuel
- **ETP**: Effluent treatment status
- **Power**: Current load and consumption

### Charts & Graphs

#### Production Trend
- **X-axis**: Last 7/15/30 days
- **Y-axis**: Production in MT
- **Line**: Daily production volume
- **Target Line**: Production target

#### Grade Distribution
- **Pie Chart**: Grade A vs Grade B vs Rejected
- **Percentages**: Quality distribution

#### Dispatch Velocity
- **Bar Chart**: Daily dispatch volumes
- **Colors**: By customer/order

---

## 🗂️ Module-by-Module Guide

### 1. 📦 Raw Material Stock Management

#### Purpose
Track and manage all incoming raw materials, chemicals, and fuels

#### Adding New Stock Entry

1. **Tap** "📦 Raw Material Stock"
2. **Select** material category:
   - Waste Paper
   - Chemicals
   - Boiler Fuels
3. **Tap** "➕ Add Stock"
4. **Fill details**:
   - Material name (from dropdown)
   - Quantity received
   - Unit (KG/Ton/Liters)
   - Supplier name
   - Vehicle number
   - Date & time (auto-filled)
5. **Optional**: Add remarks
6. **Tap** "💾 Save"
7. **Print QR label** if needed

#### Viewing Stock Levels

- **Current Stock**: Total available quantity
- **Usage Today**: Today's consumption
- **Minimum Alert**: Shows if below threshold
- **Last Receipt**: Date of last stock entry

#### Printing Stock Labels

1. **Select** stock entry
2. **Tap** 🖨️ Print Label
3. **Choose** label size:
   - 4" × 3" (Standard)
   - 3" × 2" (Compact)
   - 2" × 2" (Mini QR)
4. **Preview** label
5. **Tap** Print (connects to thermal printer)

---

### 2. 🧪 Pulp Mill Operations

#### Purpose
Manage hydrapulper batches and chemical recipes

#### Creating New Batch

1. **Go to** "🧪 Pulp Mill"
2. **Tap** "➕ New Batch"
3. **Fill Recipe**:
   - Batch number (auto-generated)
   - Raw materials (select multiple)
   - Quantities per material
   - Moisture % adjustment
   - Chemicals required
   - Chemical dosing amounts
4. **Review** total dry content
5. **Calculate** consistency %
6. **Tap** "🚀 Start Batch"
7. **Print** batch card

#### Using Saved Recipes

1. **Tap** "📋 Saved Recipes"
2. **Select** recipe template
3. **Review** recipe details
4. **Adjust** quantities if needed
5. **Tap** "Use Recipe"
6. Creates new batch with pre-filled data

#### Batch History

- View all past batches
- Filter by date range
- Search by batch number
- Export to Excel/PDF

---

### 3. 🏭 Machine Production

#### Purpose
Log parent jumbo rolls produced by the paper machine

#### Logging New Roll

1. **Go to** "🏭 Machine Production"
2. **Tap** "➕ Add Roll"
3. **Enter details**:
   - Roll number (auto-incremented)
   - Shift (Day/Night/Morning)
   - Gross weight (KG)
   - Drum/Core weight (auto-calculated)
   - Net weight (auto-calculated)
   - Deckle width (mm)
   - GSM (grams per square meter)
4. **Optional**:
   - Add remarks (machine issues, quality notes)
   - Tag batch number
5. **Tap** "💾 Save Roll"
6. Roll appears in production log

#### Shift Summary

- Total rolls produced this shift
- Total MT this shift
- Average GSM
- Machine efficiency %
- Downtime (if any)

#### Viewing Production Log

- **Filter** by:
  - Date range
  - Shift
  - GSM range
  - Roll number
- **Sort** by date, roll#, weight
- **Export** to PDF/Excel

---

### 4. 🔄 Rewinder Operations

#### Purpose
Convert parent jumbo rolls into customer-specific finished reels

#### Starting Rewinder Job

1. **Go to** "🔄 Rewinder"
2. **Tap** "➕ New Job"
3. **Select Parent Roll**:
   - Scan QR code, OR
   - Select from available rolls
4. **Enter Cutting Plan**:
   - Number of reels
   - Width per reel (mm)
   - Trimming waste estimate
5. **System calculates**:
   - Total reels possible
   - Waste percentage
   - Balance remaining
6. **Confirm** and start job

#### Logging Finished Reels

1. **Job opens** → "Add Reels"
2. **For each reel**:
   - Reel number (auto)
   - Gross weight
   - Core weight
   - Net weight (auto)
3. **Tap** "➕ Add Reel"
4. **Repeat** for all reels
5. **Complete Job** when done
6. **Print QR labels** for reels

#### QR Code Generation

Each finished reel gets unique QR code containing:
- Reel ID
- Parent roll number
- Net weight
- GSM
- Deckle width
- Production date
- Grade (after QC)

**Print Options**:
- Single reel QR
- Batch print (all reels)
- Custom label size

---

### 5. 🔬 Quality Control Lab

#### Purpose
Test paper properties and generate quality certificates

#### Testing Procedure

1. **Go to** "🔬 QC Lab"
2. **Tap** "➕ New Test"
3. **Scan reel QR** or select manually
4. **Run Tests** and enter results:
   - **Average GSM**
   - **Moisture %**
   - **Tensile Strength** (MD/CD)
   - **Burst Factor (BF)**
   - **Tear Factor**
   - **Cobb Test** (water absorption)
   - **Bulk**
   - **Ash %**
5. **Grade Assignment**:
   - GRADE_A (meets all specs)
   - GRADE_B (minor deviation)
   - REJECTED (fails specs)
6. **Tap** "💾 Save Test"

#### Generating Test Certificate

1. **Select** completed test
2. **Tap** "📄 Generate Certificate"
3. **Certificate includes**:
   - Company header and logo
   - Reel identification
   - All test parameters
   - Pass/Fail status
   - Lab technician signature
   - Date and time
4. **Download PDF** or **Print**

#### Test History

- View all past tests
- Filter by date, grade, reel
- Export test data
- Re-print certificates

---

### 6. 📋 Customer Orders

#### Purpose
Book and track customer orders

#### Creating New Order

1. **Go to** "📋 Orders"
2. **Tap** "➕ New Order"
3. **Fill Details**:
   - Customer name
   - Contact number
   - Delivery address
   - **Paper Specifications**:
     - GSM required
     - Deckle/Width (mm)
     - BF (Burst Factor)
     - Shade/Color
     - Target MT
   - Delivery date
   - Special instructions
4. **Tap** "📥 Book Order"
5. Order status: **PENDING**

#### Order Status Pipeline

- **PENDING**: New order, not started
- **IN_PRODUCTION**: Manufacturing in progress
- **ALLOCATED**: Stock assigned
- **DISPATCHED**: Delivered

#### Updating Order Status

1. **Select** order
2. **Tap** status dropdown
3. **Choose** new status
4. **Add remarks** (optional)
5. **Save** changes

---

### 7. 📦 Finished Goods Stock

#### Purpose
Categorize and manage finished reels ready for dispatch

#### Adding Reels to Stock

1. **Go to** "📦 Finished Stock"
2. **Tap** "➕ Add to Stock"
3. **Scan reel QR** or select manually
4. **Physical Categorization**:
   - Warehouse location
   - Stack number
   - Position in stack
5. **Status**: Available for dispatch
6. **Tap** "💾 Save"

#### Stock Overview

- **Total Reels**: Count of finished reels
- **Total Weight (MT)**: Combined weight
- **By Grade**: A / B / Rejected
- **By GSM**: Distribution
- **Available**: Not yet allocated

#### Matching to Orders

System shows:
- Reels matching open order specs
- Suggested allocation
- Quick dispatch options

---

### 8. 🚚 Dispatch & Delivery

#### Purpose
Generate delivery challans and gate passes

#### Creating Delivery Challan

1. **Go to** "🚚 Dispatch"
2. **Select Order** to dispatch
3. **Tap** "📤 Create Challan"
4. **Add Reels**:
   - Scan QR codes, OR
   - Select from allocated stock
   - System shows: Reel#, Weight, GSM
5. **Vehicle Details**:
   - Truck number
   - Driver name
   - Driver license
   - Driver phone
6. **Weighment**:
   - Empty vehicle weight (Tare)
   - Loaded vehicle weight (Gross)
   - Net weight (auto-calculated)
7. **Gate Pass Details**:
   - Out time
   - Security signature
   - Plant in-charge approval
8. **Review** summary
9. **Generate** challan

#### Challan Contents

**Page 1 - Delivery Challan**:
- Company header
- Challan number
- Date & time
- Customer details
- Reel-wise breakup table
- Total weight
- Vehicle details

**Page 2 - Gate Pass**:
- Gate out time
- Security clearance
- Signature blocks
- QR code for verification

#### Printing & Download

- **Preview** before print
- **Download PDF** (Android: native Downloads folder)
- **Print** to A4 printer
- **Share** via email/WhatsApp

#### Dispatched Reels Vault

Archive of all past dispatches:
- Search by challan number
- Filter by date, customer
- Re-print challans
- Export dispatch register

---

### 9. 🏷️ Label Studio

#### Purpose
Design and print custom thermal labels

#### Creating Label

1. **Go to** "🏷️ Label Studio"
2. **Select Label Size**:
   - 4" × 3" (Shipping label)
   - 3" × 2" (Reel tag)
   - 2" × 2" (QR sticker)
3. **Design Content**:
   - Title text
   - Barcode (1D)
   - QR Code (2D)
   - Data fields (GSM, Weight, Date)
   - Company logo
4. **Live Preview** updates as you type
5. **Adjust** font size, alignment
6. **Tap** "🖨️ Print"

#### Supported Printers

- **ESC/POS** thermal printers
- **TSC** barcode printers
- **Zebra** label printers

#### Batch Printing

- Import data from Excel
- Generate labels in bulk
- Print queue management

---

### 10. ⚙️ Utilities Management

#### 10.1 🔥 Boiler Operations

**Logging Shift Data**:

1. **Go to** "⚙️ Utilities" → "🔥 Boiler"
2. **Tap** "➕ Log Shift"
3. **Enter readings**:
   - Steam pressure (kg/cm²)
   - Temperature (°C)
   - Feed water level (%)
   - **Fuel Consumption**:
     - Wood (tons)
     - Biocoal (tons)
     - Briquettes (tons)
   - Steam generated (tons)
4. **Calculate** fuel efficiency
5. **Add remarks** (issues, maintenance)
6. **Save** log

#### 10.2 💧 ETP (Effluent Treatment)

**Logging Treatment Data**:

1. **Go to** "⚙️ Utilities" → "💧 ETP"
2. **Tap** "➕ Log Entry"
3. **Water Quality Parameters**:
   - pH level
   - TSS (Total Suspended Solids)
   - COD (Chemical Oxygen Demand)
   - BOD (Biological Oxygen Demand)
   - Treated water volume (KL)
4. **Chemical Dosing**:
   - Alum (kg)
   - Polymer (kg)
   - Lime (kg)
   - Hypo (liters)
5. **Compliance** status (Green/Yellow/Red)
6. **Save** log

#### 10.3 ⚡ Electricity & Power

**Logging Power Data**:

1. **Go to** "⚙️ Utilities" → "⚡ Power"
2. **Tap** "➕ Log Reading"
3. **Meter Readings**:
   - HT Meter reading
   - LT Meter reading
   - Active power (kWh)
   - Maximum demand (kVA)
   - Power factor (PF)
4. **Calculate**:
   - Consumption this shift
   - Specific power (kWh/MT)
5. **Save** log

---

### 11. 🛠️ Spare Parts Management

#### Purpose
Maintain inventory of maintenance spares

#### Adding Spare Part

1. **Go to** "🛠️ Spare Parts"
2. **Tap** "➕ Add Part"
3. **Fill Details**:
   - Part name
   - Category (Bearing/V-Belt/Seal/Motor/etc.)
   - Part number/code
   - Current stock
   - Unit (PCS/KG/Meter)
   - Minimum threshold
   - Location in store
4. **Tap** "💾 Save"

#### Stock Alerts

System automatically alerts when:
- Stock below minimum threshold
- Part not ordered in long time
- High usage rate detected

#### Issuing Parts

1. **Select** spare part
2. **Tap** "📤 Issue"
3. **Enter**:
   - Quantity issued
   - Issued to (machine/department)
   - Purpose
   - Issued by (name)
4. Stock automatically deducted
5. **Save** transaction

---

### 12. 📊 Reports & Analytics

#### Available Reports

| Report Type | Description | Export |
|-------------|-------------|--------|
| **Production** | Daily/Monthly production summary | PDF, Excel |
| **Dispatch** | Delivery register | PDF, Excel |
| **Stock** | Current inventory levels | PDF, Excel |
| **Quality** | QC test results | PDF, Excel |
| **Utilities** | Consumption and efficiency | PDF, Excel |
| **Orders** | Order book and status | PDF, Excel |

#### Generating Report

1. **Go to** "📊 Reports"
2. **Select** report type
3. **Set Date Range**:
   - Today
   - Last 7 days
   - Last month
   - Custom range
4. **Optional Filters**:
   - By grade, GSM, customer, etc.
5. **Tap** "📄 Generate"
6. **Preview** report
7. **Download** or **Print**

#### Scheduled Reports

Admins can schedule:
- Daily production report (auto-generated)
- Weekly dispatch summary
- Monthly analytics
- Auto-email to management

---

## ✅ Common Tasks

### How to Scan QR Codes

1. **Tap** 📷 Scan button
2. **Allow** camera permission (first time)
3. **Point camera** at QR code
4. **Hold steady** for 1-2 seconds
5. **Auto-detect** and populate data
6. **Tap** "✅ Use Data"

**Tips**:
- Ensure good lighting
- Hold 10-15 cm away
- Keep QR code flat
- Clean camera lens if not scanning

---

### How to Print Documents

#### On Android:

1. **Tap** 🖨️ Print button
2. **Select**:
   - Native Android Print, OR
   - Download PDF first
3. If printing:
   - Choose connected printer
   - Set copies
   - Tap Print
4. If downloading:
   - PDF saves to Downloads folder
   - Open with PDF reader to print later

#### On Windows:

1. **Tap** 🖨️ Print
2. **System print dialog** opens
3. **Select printer**
4. **Set options** (copies, paper size)
5. **Tap** Print

---

### How to Export Data

#### Export to Excel:

1. **Open** any list view (Stock/Orders/Production)
2. **Tap** "📊 Export"
3. **Select** "Excel (.xlsx)"
4. **Choose** date range/filters
5. **Tap** "📥 Download"
6. **File saves** to Downloads folder

#### Export to PDF:

1. **Open** any report/list
2. **Tap** "📄 Export PDF"
3. **Preview** generated PDF
4. **Tap** "📥 Download"
5. **File saves** to Downloads folder

---

### How to Search & Filter

#### Global Search:

- **Tap** 🔍 in top header
- **Type** keywords (reel#, order#, customer name)
- **Results** from all modules
- **Tap result** to open

#### Module-Specific Filter:

1. **Open** any list view
2. **Tap** 🔧 Filter icon
3. **Set criteria**:
   - Date range
   - Status
   - Category
   - Custom fields
4. **Apply** filter
5. **Clear** to reset

---

### How to Switch Roles (Admin Only)

1. **Login as Admin**
2. **Go to** Profile
3. **Tap** "🔄 Switch Role"
4. **Select** role to simulate:
   - Plant Manager
   - Pulper
   - Shop
   - Dispatcher
   - Viewer
5. **App redirects** to that role's dashboard
6. **Exit simulation**: Profile → "Exit Role Simulation"

---

## 💡 Tips & Best Practices

### For All Users

✅ **Change default PIN** immediately after first login  
✅ **Log out** when leaving device unattended  
✅ **Double-check** data before saving (weights, GSM, etc.)  
✅ **Use QR scanning** instead of manual entry (reduces errors)  
✅ **Add remarks** when relevant (helps in audit)  
✅ **Print labels immediately** after creating entries  
✅ **Keep device charged** (at least 30% battery)  
✅ **Clean screen** regularly (for barcode scanning)  

---

### For Operators

✅ **Log data in real-time**, not end of shift  
✅ **Verify weighments** before finalizing  
✅ **Report machine issues** in remarks field  
✅ **Complete pending tasks** before shift handover  
✅ **Check minimum stock alerts** daily  

---

### For Managers

✅ **Review dashboards** every shift  
✅ **Monitor KPIs** against targets  
✅ **Verify quality trends** weekly  
✅ **Export reports** for management review  
✅ **Address alerts** promptly (stock, quality, utility)  
✅ **Audit worker logs** periodically  

---

### For Dispatchers

✅ **Verify order specs** before allocation  
✅ **Double-check vehicle numbers** and weights  
✅ **Print challans before loading** truck  
✅ **Get signatures** before dispatch  
✅ **Update order status** immediately after dispatch  
✅ **Archive challans** properly  

---

## ❓ FAQ

### General Questions

**Q: Can I use the app offline?**  
A: Yes! The app is offline-first. Data syncs when internet is available.

**Q: How do I change language?**  
A: Profile → Settings → Language → Select (English/Hindi/Gujarati)

**Q: How do I reset my PIN?**  
A: For admin: Settings. For others: Contact admin.

**Q: Can I access from multiple devices?**  
A: Yes, login with same credentials. Data syncs across devices.

**Q: Is my data safe?**  
A: Yes. Data is stored securely with encryption. Backups are automatic.

---

### Module-Specific Questions

**Q: Can I edit a saved production roll?**  
A: Yes (if admin). Select roll → Tap Edit → Make changes → Save.

**Q: How to delete wrong entry?**  
A: Select entry → Tap 🗑️ Delete → Confirm (admin only).

**Q: What if QR code is damaged?**  
A: Select reel manually from list, or re-print QR label.

**Q: Can I cancel a dispatch challan?**  
A: Yes (admin). Go to Dispatched Vault → Select challan → Cancel (marks as void).

**Q: How far back is history available?**  
A: All data since system start. No automatic deletion.

**Q: Can I export entire database?**  
A: Yes (admin only). Settings → Export All Data → Excel/JSON.

---

### Technical Questions

**Q: Which browsers are supported?**  
A: Chrome, Edge, Firefox, Safari (latest versions).

**Q: Which thermal printers work?**  
A: ESC/POS, TSC, Zebra compatible printers.

**Q: How much storage does app need?**  
A: Android: ~50 MB. Windows: ~150 MB. Web: ~10 MB cache.

**Q: Can I integrate with other software?**  
A: Yes. API available for ERP integration (contact developer).

**Q: Does it work on tablets?**  
A: Yes. Fully responsive on Android tablets and iPads.

**Q: Can I use on Linux?**  
A: Use web version. Native Linux app planned for future.

---

## 📞 Support & Feedback

### Need Help?

- **Email**: support@sahebpaper.com
- **Phone**: +91 80005 63666
- **Hours**: Mon-Sat, 9 AM - 6 PM IST

### Report Issues

- **GitHub**: [github.com/thakordhruv097-spec/saheb-paper-demo/issues](https://github.com/thakordhruv097-spec/saheb-paper-demo/issues)

### Request Features

- Contact developer with feature requests
- Describe use-case clearly
- Include screenshots if applicable

---

<div align="center">

**Thank you for using Saheb Paper ERP! 🎉**

[← Installation Guide](INSTALLATION_GUIDE.md) | [Product Overview](PRODUCT_OVERVIEW.md) | [Technical Docs →](TECHNICAL_DOCUMENTATION.md)

</div>
