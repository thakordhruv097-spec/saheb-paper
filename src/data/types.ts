export type UserRole =
  | 'Admin'
  | 'PlantManager'
  | 'LabOperator'
  | 'Viewer'
  | 'Shopper'
  | 'Dispatcher'
  | 'PulpOperator'
  | 'MachineOperator'
  | 'Machinery'
  | 'RewinderOperator'
  | 'BoilerOperator'
  | 'WarehouseStaff'
  | 'StoreManager'
  | 'EtpOperator'
  | 'Management';

export interface User {
  username: string;
  role: UserRole; // Primary role
  roles?: UserRole[]; // Array of assigned multi-roles (e.g. ['PlantManager', 'LabOperator'])
  pin: string;
  displayName: string;
  email: string;
  phone: string;
  active?: boolean;
  needsPinReset?: boolean;
  securityQuestion?: string;
  securityAnswer?: string;
  empId?: string;
  designation?: string;
  customModules?: string[];
  isNewUser?: boolean;
  privacyConsented?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: number;
  lockedReason?: string;
}

export interface ModuleDefinition {
  key: string;
  label: string;
}

export const CANONICAL_USER_ORDER = [
  'admin',
  'pulper',
  'plant_manager',
  'dispatcher',
  'shop',
  'viewer',
] as const;

export function getUserRank(user: User): number {
  if (!user) return 99;
  const uname = (user.username || '').toLowerCase().trim();
  const dname = (user.displayName || '').toLowerCase().trim();
  const role = (user.role || '').toLowerCase().trim();
  const empId = (user.empId || '').toUpperCase().trim();

  // 1. Admin (Rank 0)
  if (
    uname === 'admin' ||
    role === 'admin' ||
    empId === 'EMP-001' ||
    dname.includes('admin') ||
    dname.includes('rajesh')
  ) {
    return 0;
  }

  // 2. Pulper (Rank 1)
  if (
    uname === 'pulper' ||
    uname === 'lab' ||
    role === 'laboperator' ||
    role === 'pulpoperator' ||
    empId === 'EMP-002' ||
    dname.includes('pulper') ||
    (dname.includes('lab') && !dname.includes('manager'))
  ) {
    return 1;
  }

  // 3. Plant Manager (Rank 2)
  if (
    uname === 'plant_manager' ||
    uname === 'plantmanager' ||
    uname === 'manager' ||
    uname.includes('machinery') ||
    role === 'plantmanager' ||
    role === 'machineoperator' ||
    role === 'machinery' ||
    empId === 'EMP-003' ||
    dname.includes('plant manager') ||
    dname.includes('machinery') ||
    (dname.includes('manager') && !dname.includes('store') && !dname.includes('shop'))
  ) {
    return 2;
  }

  // 4. Dispatcher (Rank 3)
  if (
    uname === 'dispatcher' ||
    role === 'dispatcher' ||
    empId === 'EMP-004' ||
    dname.includes('dispatch')
  ) {
    return 3;
  }

  // 5. Shop / Procurement (Rank 4)
  if (
    uname === 'shop' ||
    uname === 'shopper' ||
    role === 'shopper' ||
    role === 'storemanager' ||
    empId === 'EMP-005' ||
    dname.includes('shop') ||
    dname.includes('procurement')
  ) {
    return 4;
  }

  // 6. Viewer (Rank 5)
  if (
    uname === 'viewer' ||
    role === 'viewer' ||
    empId === 'EMP-006' ||
    dname.includes('viewer')
  ) {
    return 5;
  }

  return 99;
}

export function sortUsersByHierarchy(users: User[]): User[] {
  if (!Array.isArray(users)) return [];

  // Deduplicate by username if duplicates ever occur
  const seen = new Set<string>();
  const deduped: User[] = [];
  for (const u of users) {
    if (!u) continue;
    const key = (u.username || '').toLowerCase().trim();
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    deduped.push(u);
  }

  return deduped.sort((a, b) => {
    const diff = getUserRank(a) - getUserRank(b);
    if (diff !== 0) return diff;
    return (a.username || '').localeCompare(b.username || '');
  });
}

export const MODULES_LIST: ModuleDefinition[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'raw_material_stock', label: 'Raw Material' },
  { key: 'pulp_mill_operations', label: 'Pulp Mill' },
  { key: 'machine_production', label: 'Machine Production' },
  { key: 'rewinding_reel_conversion', label: 'Rewinder' },
  { key: 'lab', label: 'Lab Quality Control' },
  { key: 'boiler', label: 'Boiler' },
  { key: 'etp', label: 'ETP' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'orders', label: 'Pending Orders' },
  { key: 'finished_stock_dispatch', label: 'Finish Stock' },
  { key: 'dispatch', label: 'Dispatch' },
  { key: 'spareparts_management', label: 'Store (Spares)' },
  { key: 'label_studio', label: 'Label Studio' },
  { key: 'monthly_yearly_reporting', label: 'Reports & Analytics' },
];

export const MODULES_11 = MODULES_LIST;
export const MODULES_13 = MODULES_LIST;

export type RawMaterialCategory =
  | 'WASTE_PAPER'
  | 'OTHER_RAW_MATERIAL'
  | 'CHEMICAL'
  | 'FIREWOOD';

export type ChemicalModuleLocation =
  | 'PULP_MILL'
  | 'MACHINE_PRODUCTION'
  | 'UTILITIES_ETP'
  | 'LAB_QC'
  | 'GENERAL';

export interface RawMaterialItem {
  id: string;
  name: string;
  category: RawMaterialCategory;
  stock: number; // in kg
  minThreshold: number; // in kg
  active?: boolean;
  usedInModule?: ChemicalModuleLocation; // Target Module where this material/chemical is used
}

export interface ProductItem {
  id: string;
  name: string; // e.g. "Napkin Tissue", "Toilet Tissue", etc.
  grade: 'A' | 'B';
  gsm: number;
  size: number;
  ply: number;
  active?: boolean;
}

export interface PartyItem {
  id: string;
  name: string;
  contact: string;
  address: string;
  active?: boolean;
}
export type Party = PartyItem;

export interface VendorItem {
  id: string;
  name: string;
  contact: string;
  address: string;
  active?: boolean;
}

export interface VehicleItem {
  id: string;
  vehicleNo: string;
  driverName: string;
  driverContact: string;
  active?: boolean;
}
export type Vehicle = VehicleItem;

export interface PulpFormula {
  id: string;
  date: string; // YYYY-MM-DD
  wasteMix: { [materialName: string]: number }; // percentage e.g. { "Indian Tissue Waste": 50, "SMK": 20 }
  chemicals: { [chemicalName: string]: number }; // kg per ton e.g. { "DSR": 10 }
}

export interface MachineRoll {
  rollNo: string; // unique Roll No
  product: string;
  weight: number; // in kg
  gsm: number;
  width: number; // in mm or cm
  dia?: number; // Roll Diameter in mm
  joint?: number; // number of joints
  shift: 'A' | 'B';
  startTime: string;
  offTime: string;
  workingMinutes?: number; // Total working time in minutes
  downtimeReason: string;
  date: string; // YYYY-MM-DD
  formulaId: string; // references PulpFormula.id
  status?: 'AVAILABLE' | 'CONSUMED' | 'REWOUND';
  isRewound?: boolean;
}

export type ReelStatus =
  | 'PRODUCED'
  | 'QC_PENDING'
  | 'QC_PASSED'
  | 'QC_FAILED'
  | 'IN_STOCK'
  | 'IN_STOCK_B'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'RETURNED';

export type QCGrade = 'A' | 'B' | 'PENDING';

export interface Reel {
  reelNo: string; // unique reel number, e.g. SAHEB-R-YYYYMMDD-XXXX
  parentRollNo: string;
  product: string;
  gsm: number;
  size: number;
  ply: number;
  weight: number; // in kg
  dia: number; // in mm
  joint: number; // number of joints
  status: ReelStatus;
  qcGrade: QCGrade;
  productionDate: string; // YYYY-MM-DD HH:MM
  challanNo?: string;
  qcInspector?: string;
  qcTimestamp?: string;
  qcGsmResult?: number;
  qcBrightness?: number;
  qcSoftness?: number;
  shade?: string;
  core?: number | string;
  notes?: string;
  dispatchDetails?: {
    partyName: string;
    vehicleNo: string;
    orderRef?: string;
    dispatchDate: string;
    packingSlipNo?: string;
  };
}

export interface TransactionLog {
  id: string;
  timestamp: string; // ISO string
  module: string; // e.g. "Raw Material", "Pulp Mill", "Machine", "Rewinder", "Dispatch", "Auth"
  action: string; // e.g. "Login", "Deduction", "Return", "QC_Pass", "Dispatch"
  details: string; // human readable details
  user: string; // username
}

export interface BoilerLog {
  id: string;
  date: string; // YYYY-MM-DD
  woodUsed: number; // kg
  waterUsed: number; // liters
  pressure: number; // psi
  temperature?: number; // °C (optional)
  operator: string;
  shift: 'Day' | 'Night' | 'A' | 'B' | string;
}

export interface EtpLog {
  id: string;
  date: string; // YYYY-MM-DD
  flockLiq: number; // liters
  flockMaster: number; // kg
  operator: string;
}

export interface ElectricityLog {
  id: string;
  date: string; // YYYY-MM-DD
  units: number; // kWh
  operator: string;
}

export interface PendingOrder {
  id: string;
  partyId: string;
  productId: string;
  gsm: number;
  size: number;
  ply: number;
  qty: number; // reels required
  weightTons?: number; // order weight in Tons
  receiveDate?: string; // Order Receive Date (YYYY-MM-DD)
  dueDate: string; // YYYY-MM-DD
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  dispatchedQty: number;
}

export interface PackingSlip {
  id: string;
  slipNo: string;
  date: string;
  partyId: string;
  vehicleId: string;
  reelNos: string[];
  driverSignature: string;
  receiverSignature: string;
  status: 'DRAFT' | 'DISPATCHED' | 'CONFIRMED';
  dispatchDate?: string;
  dispatchTime?: string;
}

export interface StoreItem {
  id: string;
  type: 'BEARING' | 'V_BELT';
  name: string; // Bearing number or V-belt size
  pcs: number;
  group?: string; // Optional legacy group
  usageArea?: string; // Bearing usage area
  targetMachine?: string; // Target Machine / Location
  minStock?: number; // Minimum stock threshold / target
  remarks?: string; // Remarks / Specifications
}

export interface RawMaterialLot {
  lotNo: string;
  materialId: string;
  materialName: string;
  weight: number;
  vendorName: string;
  date: string;
  operator: string;
}

export interface PaperTestReport {
  id: string; // e.g. PTR-20260808-01
  product: string; // e.g. "NAPKIN", "TOILET TISSUE"
  rollNo: string; // e.g. "11" or "ROLL-20260808-01"
  shift: 'A' | 'B';
  date: string; // YYYY-MM-DD (e.g. "2026-08-03")
  time: string; // HH:MM (e.g. "07:50")
  targetGsm: number; // e.g. 16
  weight: number; // e.g. 500 (kg)
  speed: number; // e.g. 130 (m/min)
  crepingPct: number; // e.g. 18.00 (%)

  // 14 GSM sample profile readings across roll width
  gsmSamples: number[];

  // Auto-calculated profile stats
  avgGsm: number;
  maxGsm: number;
  minGsm: number;
  rangeGsm: number;
  breakageCount: number;

  // 13 Lab Test Parameters
  labResultGsm: number; // g/m2 (SR 1)
  moisturePct: number; // % (SR 2)
  caliperMm: number; // MM microns (SR 3)
  bulkCcGm: number; // cc/gm (SR 4)
  breakingLengthMd: number; // Mtr 10cm length MD (SR 5)
  breakingLengthCd: number; // Mtr 10cm length CD (SR 6)
  brightnessPct: number; // % Optical (SR 7)
  tearMd: number; // J/m2 (SR 8)
  tearCd: number; // N/M (SR 9)
  tensileDryMd: number; // N/M 1 PLY (SR 10)
  tensileDryCd: number; // % 1 PLY (SR 11)
  stretchDryMd: number; // % 1 PLY (SR 12)
  stretchDryCd: number; // 1 PLY (SR 13)

  qcStatus: 'GRADE_A' | 'GRADE_B' | 'REJECTED';
  remarks: string;
  inspector: string;
  timestamp: string;
}

