import type {
  User,
  RawMaterialItem,
  ProductItem,
  PartyItem,
  VendorItem,
  VehicleItem,
  PulpFormula,
  MachineRoll,
  Reel,
  TransactionLog,
  UserRole,
  BoilerLog,
  EtpLog,
  ElectricityLog,
  PendingOrder,
  PackingSlip,
  StoreItem,
  RawMaterialLot,
  PaperTestReport,
} from './types';
import { sortUsersByHierarchy } from './types';
import { hashPinSync, isPinHashed } from '../lib/security';
import {
  pushUpsertToCloud,
  pushDeleteToCloud,
  pushClearTableToCloud,
  userToDb,
  rawMaterialToDb,
  rawMaterialLotToDb,
  productToDb,
  partyToDb,
  vendorToDb,
  vehicleToDb,
  formulaToDb,
  machineRollToDb,
  reelToDb,
  logToDb,
  boilerLogToDb,
  etpLogToDb,
  electricityLogToDb,
  pendingOrderToDb,
  packingSlipToDb,
  storeItemToDb,
  labReportToDb,
  initSupabaseSync,
  notifyDataUpdated,
} from '../lib/supabaseSync';

export { initSupabaseSync, notifyDataUpdated };

// Simple JSON storage helper
export const getJSON = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
};

export const setJSON = <T>(key: string, value: T, notify = true): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (notify && typeof window !== 'undefined') {
      notifyDataUpdated(key);
    }
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
};

// LocalStorage Keys
const KEYS = {
  USERS: 'saheb_users',
  RAW_MATERIALS: 'saheb_raw_materials',
  PRODUCTS: 'saheb_products',
  PARTIES: 'saheb_parties',
  VENDORS: 'saheb_vendors',
  VEHICLES: 'saheb_vehicles',
  FORMULAS: 'saheb_formulas',
  ROLLS: 'saheb_rolls',
  REELS: 'saheb_reels',
  LOGS: 'saheb_logs',
  BOILER_LOGS: 'saheb_boiler_logs',
  ETP_LOGS: 'saheb_etp_logs',
  ELECTRICITY_LOGS: 'saheb_electricity_logs',
  PENDING_ORDERS: 'saheb_pending_orders',
  PACKING_SLIPS: 'saheb_packing_slips',
  STORE_ITEMS: 'saheb_store_items',
  RAW_MATERIAL_LOTS: 'saheb_raw_material_lots',
  LAB_REPORTS: 'saheb_lab_reports',
};

// 1. Initial Seeds with SHA-256 Hashed PINs
const DEFAULT_USERS: User[] = [
  {
    username: 'admin',
    role: 'Admin',
    roles: ['Admin'],
    pin: hashPinSync('1234'),
    displayName: 'Rajesh Sharma (Admin)',
    email: 'admin@sahebpaper.com',
    phone: '9876543210',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-001',
    designation: 'Admin / Owner',
    customModules: [
      'dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion', 'lab',
      'boiler', 'etp', 'electricity', 'orders', 'finished_stock_dispatch', 'dispatch', 'spareparts_management', 'label_studio', 'monthly_yearly_reporting'
    ]
  },
  {
    username: 'pulper',
    role: 'LabOperator',
    roles: ['LabOperator'],
    pin: hashPinSync('1234'),
    displayName: 'Pulper Operator',
    email: 'pulper@sahebpaper.com',
    phone: '9876543220',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-002',
    designation: 'Pulper (Pulp Mill Operator)',
    customModules: ['raw_material_stock', 'pulp_mill_operations', 'boiler', 'etp']
  },
  {
    username: 'plant_manager',
    role: 'PlantManager',
    roles: ['PlantManager'],
    pin: hashPinSync('1234'),
    displayName: 'Lab Quality Control',
    email: 'qc@sahebpaper.com',
    phone: '9876543219',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-003',
    designation: 'Lab Quality Control (QC & Testing)',
    customModules: ['dashboard', 'lab', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion']
  },
  {
    username: 'dispatcher',
    role: 'Dispatcher',
    roles: ['Dispatcher'],
    pin: hashPinSync('1234'),
    displayName: 'Dispatcher',
    email: 'dispatch@sahebpaper.com',
    phone: '9876543222',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-004',
    designation: 'Dispatcher',
    customModules: ['orders', 'finished_stock_dispatch', 'dispatch']
  },
  {
    username: 'shop',
    role: 'Shopper',
    roles: ['Shopper'],
    pin: hashPinSync('1234'),
    displayName: 'Shop / Procurement',
    email: 'shop@sahebpaper.com',
    phone: '9876543221',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-005',
    designation: 'Shop & Procurement Incharge',
    customModules: ['spareparts_management']
  },
  {
    username: 'viewer',
    role: 'Viewer',
    roles: ['Viewer'],
    pin: hashPinSync('1234'),
    displayName: 'Viewer',
    email: 'viewer@sahebpaper.com',
    phone: '9876543223',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-006',
    designation: 'Read-Only Viewer',
    customModules: [
      'dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion',
      'boiler', 'etp', 'electricity', 'orders', 'finished_stock_dispatch', 'dispatch', 'spareparts_management', 'label_studio', 'monthly_yearly_reporting'
    ]
  },
];

const DEFAULT_RAW_MATERIALS: RawMaterialItem[] = [
  // Waste Paper & Pulp Raw Materials
  { id: 'rm-1', name: 'Indian Tissue Waste', category: 'WASTE_PAPER', stock: 0, minThreshold: 1000, usedInModule: 'PULP_MILL' },
  { id: 'rm-2', name: 'Imported Tissue Waste', category: 'WASTE_PAPER', stock: 0, minThreshold: 1000, usedInModule: 'PULP_MILL' },
  { id: 'rm-3', name: 'SMK', category: 'WASTE_PAPER', stock: 0, minThreshold: 500, usedInModule: 'PULP_MILL' },
  { id: 'rm-4', name: 'Cupstock', category: 'WASTE_PAPER', stock: 0, minThreshold: 500, usedInModule: 'PULP_MILL' },
  { id: 'rm-5', name: 'Pulp Sheet', category: 'WASTE_PAPER', stock: 0, minThreshold: 1000, usedInModule: 'PULP_MILL' },
  { id: 'rm-7', name: 'Broke', category: 'WASTE_PAPER', stock: 0, minThreshold: 500, usedInModule: 'PULP_MILL' },
  // Chemical
  { id: 'rm-8', name: 'DSR', category: 'CHEMICAL', stock: 0, minThreshold: 200, usedInModule: 'MACHINE_PRODUCTION' },
  { id: 'rm-9', name: 'WSR', category: 'CHEMICAL', stock: 0, minThreshold: 200, usedInModule: 'MACHINE_PRODUCTION' },
  { id: 'rm-10', name: 'Hydrogen Peroxide', category: 'CHEMICAL', stock: 0, minThreshold: 100, usedInModule: 'PULP_MILL' },
  { id: 'rm-11', name: 'Hypo', category: 'CHEMICAL', stock: 0, minThreshold: 100, usedInModule: 'PULP_MILL' },
  { id: 'rm-12', name: 'Bleaching Powder', category: 'CHEMICAL', stock: 0, minThreshold: 100, usedInModule: 'PULP_MILL' },
  { id: 'rm-13', name: 'Caustic', category: 'CHEMICAL', stock: 0, minThreshold: 100, usedInModule: 'PULP_MILL' },
  { id: 'rm-14', name: 'OBA', category: 'CHEMICAL', stock: 0, minThreshold: 50, usedInModule: 'MACHINE_PRODUCTION' },
  { id: 'rm-15', name: 'M Violet', category: 'CHEMICAL', stock: 0, minThreshold: 10, usedInModule: 'MACHINE_PRODUCTION' },
  { id: 'rm-16', name: 'Washing Powder', category: 'CHEMICAL', stock: 0, minThreshold: 50, usedInModule: 'PULP_MILL' },
  { id: 'rm-17', name: 'Deformer', category: 'CHEMICAL', stock: 0, minThreshold: 50, usedInModule: 'MACHINE_PRODUCTION' },
  { id: 'rm-18', name: 'PEO', category: 'CHEMICAL', stock: 0, minThreshold: 50, usedInModule: 'MACHINE_PRODUCTION' },
  { id: 'rm-19', name: 'HCL', category: 'CHEMICAL', stock: 0, minThreshold: 100, usedInModule: 'UTILITIES_ETP' },
  { id: 'rm-20', name: 'MG Release', category: 'CHEMICAL', stock: 0, minThreshold: 50, usedInModule: 'MACHINE_PRODUCTION' },
  { id: 'rm-21', name: 'MG Coating', category: 'CHEMICAL', stock: 0, minThreshold: 50, usedInModule: 'MACHINE_PRODUCTION' },
  { id: 'rm-22', name: 'RO Chemical', category: 'CHEMICAL', stock: 0, minThreshold: 50, usedInModule: 'UTILITIES_ETP' },
  // Firewood
  { id: 'rm-23', name: 'Wood', category: 'FIREWOOD', stock: 0, minThreshold: 2000, usedInModule: 'UTILITIES_ETP' },
  { id: 'rm-24', name: 'Biocoal', category: 'FIREWOOD', stock: 0, minThreshold: 2000, usedInModule: 'UTILITIES_ETP' },
];

const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 'p-1', name: 'Napkin Tissue', grade: 'A', gsm: 16, size: 30, ply: 2 },
  { id: 'p-1b', name: 'Napkin Tissue (Virgin Pulp)', grade: 'A', gsm: 16, size: 30, ply: 2 },
  { id: 'p-2', name: 'Soft Tissue Napkin', grade: 'A', gsm: 17, size: 30, ply: 2 },
  { id: 'p-3', name: 'Premium Tissue', grade: 'A', gsm: 18, size: 30, ply: 2 },
  { id: 'p-4', name: 'Jumbo Tissue Roll', grade: 'A', gsm: 19, size: 120, ply: 1 },
  { id: 'p-5', name: 'Toilet Tissue', grade: 'A', gsm: 17, size: 10, ply: 3 },
  { id: 'p-6', name: 'Hard Roll Towel (HRT)', grade: 'A', gsm: 24, size: 25, ply: 1 },
  { id: 'p-7', name: 'Kitchen Towel (KT)', grade: 'A', gsm: 22, size: 20, ply: 1 },
  { id: 'p-8', name: 'Kraft Paper Liner', grade: 'A', gsm: 120, size: 110, ply: 1 },
  { id: 'p-9', name: 'Cupstock Board', grade: 'A', gsm: 180, size: 85, ply: 1 },
  { id: 'p-10', name: 'Duplex Board', grade: 'A', gsm: 230, size: 95, ply: 1 },
  { id: 'p-11', name: 'Napkin B-Grade', grade: 'B', gsm: 18, size: 30, ply: 2 },
  { id: 'p-12', name: 'Toilet B-Grade', grade: 'B', gsm: 17, size: 10, ply: 3 },
  { id: 'p-13', name: 'KT B-Grade', grade: 'B', gsm: 22, size: 20, ply: 1 },
];

const DEFAULT_PARTIES: PartyItem[] = [
  { id: 'pt-1', name: 'Ambika Traders', contact: '9876543210', address: 'Surat, Gujarat' },
  { id: 'pt-2', name: 'Krishna Enterprises', contact: '9876543211', address: 'Ahmedabad, Gujarat' },
  { id: 'pt-3', name: 'Kailash Paper House', contact: '9876543212', address: 'Rajkot, Gujarat' },
];

const DEFAULT_VENDORS: VendorItem[] = [
  { id: 'vd-1', name: 'Gujarat Waste Suppliers', contact: '9998887770', address: 'Baroda, Gujarat' },
  { id: 'vd-2', name: 'National Chemical Corp', contact: '9998887771', address: 'Vapi, Gujarat' },
  { id: 'vd-3', name: 'Balaji Wood Yard', contact: '9998887772', address: 'Surat, Gujarat' },
];

const DEFAULT_VEHICLES: VehicleItem[] = [
  { id: 'vh-1', vehicleNo: 'GJ-05-BY-1234', driverName: 'Ramesh Bhai', driverContact: '9988776655' },
  { id: 'vh-2', vehicleNo: 'GJ-03-XX-5678', driverName: 'Suresh Patel', driverContact: '9988776656' },
  { id: 'vh-3', vehicleNo: 'MH-04-ZZ-9012', driverName: 'Anil Singh', driverContact: '9988776657' },
];

const DEFAULT_STORE_ITEMS: StoreItem[] = [
  { id: 'st-1', type: 'BEARING', name: '6205', pcs: 0, usageArea: 'Pulp Mill Agitator', minStock: 5, remarks: 'SKF Deep Groove' },
  { id: 'st-2', type: 'BEARING', name: '6309', pcs: 0, usageArea: 'Machine Dryer', minStock: 4, remarks: 'FAG High Temp' },
  { id: 'st-3', type: 'BEARING', name: '22220', pcs: 0, usageArea: 'Rewinder Shaft', minStock: 2, remarks: 'Spherical Roller' },
  { id: 'st-4', type: 'V_BELT', name: 'C-96', pcs: 0, targetMachine: 'Vacuum Pump Drive', minStock: 4, remarks: 'Fenner Heavy Duty' },
  { id: 'st-5', type: 'V_BELT', name: 'B-72', pcs: 0, targetMachine: 'Pulp Chest Agitator', minStock: 6, remarks: 'Raw Edge Cogged' },
  { id: 'st-6', type: 'V_BELT', name: 'A-48', pcs: 0, targetMachine: 'Hydrapulper Motor', minStock: 5, remarks: 'Standard Anti-static' },
];

export const DEFAULT_ROLLS: MachineRoll[] = [];

export const DEFAULT_REELS: Reel[] = [];

export function seedSampleReels(): Reel[] {
  return getJSON<Reel[]>(KEYS.REELS, []);
}

function seedOneMonthData(): void {
  // Operational records start completely clean for production launch
}

// Initialize Storage if empty
export function initializeStorage() {
  if (!localStorage.getItem(KEYS.USERS)) setJSON(KEYS.USERS, [DEFAULT_USERS[0]], false);
  if (!localStorage.getItem(KEYS.RAW_MATERIALS) || getJSON<any[]>(KEYS.RAW_MATERIALS, []).length === 0) setJSON(KEYS.RAW_MATERIALS, DEFAULT_RAW_MATERIALS, false);
  if (!localStorage.getItem(KEYS.PRODUCTS) || getJSON<any[]>(KEYS.PRODUCTS, []).length === 0) setJSON(KEYS.PRODUCTS, DEFAULT_PRODUCTS, false);
  if (!localStorage.getItem(KEYS.PARTIES) || getJSON<any[]>(KEYS.PARTIES, []).length === 0) setJSON(KEYS.PARTIES, DEFAULT_PARTIES, false);
  if (!localStorage.getItem(KEYS.VENDORS) || getJSON<any[]>(KEYS.VENDORS, []).length === 0) setJSON(KEYS.VENDORS, DEFAULT_VENDORS, false);
  if (!localStorage.getItem(KEYS.VEHICLES) || getJSON<any[]>(KEYS.VEHICLES, []).length === 0) setJSON(KEYS.VEHICLES, DEFAULT_VEHICLES, false);
  if (!localStorage.getItem(KEYS.FORMULAS)) setJSON(KEYS.FORMULAS, [], false);
  if (!localStorage.getItem(KEYS.ROLLS)) setJSON(KEYS.ROLLS, [], false);
  if (!localStorage.getItem(KEYS.REELS)) setJSON(KEYS.REELS, [], false);

  // Clean all legacy dummy test operational data from localStorage once for fresh production
  if (localStorage.getItem('saheb_clean_production_zero_v2') !== 'true') {
    setJSON(KEYS.REELS, [], false);
    setJSON(KEYS.ROLLS, [], false);
    setJSON(KEYS.PACKING_SLIPS, [], false);
    setJSON(KEYS.LAB_REPORTS, [], false);
    setJSON(KEYS.PENDING_ORDERS, [], false);
    setJSON(KEYS.RAW_MATERIAL_LOTS, [], false);
    setJSON(KEYS.LOGS, [], false);
    setJSON(KEYS.BOILER_LOGS, [], false);
    setJSON(KEYS.ETP_LOGS, [], false);
    setJSON(KEYS.ELECTRICITY_LOGS, [], false);
    localStorage.setItem('saheb_clean_production_zero_v2', 'true');
  }
  if (!localStorage.getItem(KEYS.LOGS)) setJSON(KEYS.LOGS, [], false);
  if (!localStorage.getItem(KEYS.BOILER_LOGS)) setJSON(KEYS.BOILER_LOGS, [], false);
  if (!localStorage.getItem(KEYS.ETP_LOGS)) setJSON(KEYS.ETP_LOGS, [], false);
  if (!localStorage.getItem(KEYS.ELECTRICITY_LOGS)) setJSON(KEYS.ELECTRICITY_LOGS, [], false);
  if (!localStorage.getItem(KEYS.PENDING_ORDERS)) setJSON(KEYS.PENDING_ORDERS, [], false);
  if (!localStorage.getItem(KEYS.PACKING_SLIPS)) setJSON(KEYS.PACKING_SLIPS, [], false);
  if (!localStorage.getItem(KEYS.STORE_ITEMS) || getJSON<any[]>(KEYS.STORE_ITEMS, []).length === 0) setJSON(KEYS.STORE_ITEMS, DEFAULT_STORE_ITEMS, false);
  if (!localStorage.getItem(KEYS.RAW_MATERIAL_LOTS)) setJSON(KEYS.RAW_MATERIAL_LOTS, [], false);
  if (!localStorage.getItem(KEYS.LAB_REPORTS)) setJSON(KEYS.LAB_REPORTS, [], false);

  // Ensure Admin user has valid structure and permissions & all PINs are SHA-256 hashed
  try {
    const rawUsers = getJSON<User[]>(KEYS.USERS, [DEFAULT_USERS[0]]);
    const validKeys = [
      'dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion', 'lab',
      'boiler', 'etp', 'electricity', 'orders', 'finished_stock_dispatch', 'dispatch', 'spareparts_management', 'label_studio', 'monthly_yearly_reporting'
    ];
    let updated = false;
    const fixedUsers = rawUsers.map(u => {
      if (u.pin && !isPinHashed(u.pin)) {
        u.pin = hashPinSync(u.pin);
        updated = true;
      }
      if (u.username === 'admin') {
        if (u.role !== 'Admin' || !u.roles || u.roles[0] !== 'Admin' || !u.customModules || u.customModules.length !== validKeys.length) {
          u.role = 'Admin';
          u.roles = ['Admin'];
          u.customModules = [...validKeys];
          updated = true;
        }
      }
      return u;
    });

    if (updated) {
      setJSON(KEYS.USERS, fixedUsers, false);
    }

    // Fix active session if @admin session was corrupted
    const rawSession = localStorage.getItem('saheb_session');
    if (rawSession) {
      const session = JSON.parse(rawSession);
      if (session.user && session.user.username === 'admin') {
        session.user.role = 'Admin';
        session.user.roles = ['Admin'];
        session.user.customModules = [...validKeys];
        localStorage.setItem('saheb_session', JSON.stringify(session));
        localStorage.setItem('saheb_active_user', JSON.stringify(session.user));
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// Ensure execution on import
initializeStorage();

// --- AUDIT LOGS ---
export function getLogs(): TransactionLog[] {
  return getJSON<TransactionLog[]>(KEYS.LOGS, []);
}

export function addLog(module: string, action: string, details: string, user: string = 'System'): TransactionLog {
  const logs = getLogs();
  const newLog: TransactionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    module,
    action,
    details,
    user,
  };
  logs.unshift(newLog);
  setJSON(KEYS.LOGS, logs.slice(0, 500)); // Cap to latest 500 logs for high-efficiency storage
  pushUpsertToCloud('transaction_logs', logToDb(newLog));
  return newLog;
}

// --- USERS / AUTH ---
export function getUsers(): User[] {
  let users = getJSON<User[]>(KEYS.USERS, [DEFAULT_USERS[0]]);
  if (!users || users.length === 0) {
    users = [{ ...DEFAULT_USERS[0] }];
  }

  const validRoles: UserRole[] = ['Admin', 'PlantManager', 'LabOperator', 'MachineOperator', 'Machinery', 'StoreManager', 'Viewer', 'Shopper', 'Dispatcher'];

  const mapped = users.map(u => {
    let displayName = u.displayName;
    let designation = u.designation;

    const VALID_MODULE_KEYS = [
      'dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion', 'lab',
      'boiler', 'etp', 'electricity', 'orders', 'finished_stock_dispatch', 'dispatch', 'spareparts_management', 'label_studio', 'monthly_yearly_reporting'
    ];

    let customModules = u.customModules && Array.isArray(u.customModules) && u.customModules.length > 0
      ? u.customModules.filter(k => VALID_MODULE_KEYS.includes(k))
      : (u.role === 'Admin'
          ? [...VALID_MODULE_KEYS]
          : (u.role === 'Dispatcher' || (u.roles && u.roles.includes('Dispatcher')) || u.username.toLowerCase() === 'dispatcher')
          ? ['orders', 'finished_stock_dispatch', 'dispatch']
          : (u.role === 'MachineOperator' || u.role === ('Machinery' as UserRole) || (u.roles && (u.roles.includes('MachineOperator') || u.roles.includes('Machinery' as UserRole))))
          ? ['machine_production', 'rewinding_reel_conversion', 'raw_material_stock']
          : (u.role === 'StoreManager' || (u.roles && u.roles.includes('StoreManager')))
          ? ['spareparts_management']
          : (u.role === 'Shopper' || (u.roles && u.roles.includes('Shopper')))
          ? ['spareparts_management']
          : (u.role === 'PlantManager' || (u.roles && u.roles.includes('PlantManager')) || u.username.toLowerCase() === 'manager')
          ? ['dashboard', 'lab', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion', 'boiler', 'etp', 'electricity', 'dispatch', 'finished_stock_dispatch']
          : []);

    const isPulperOrLab =
      u.username.toLowerCase() === 'pulper' ||
      u.username.toLowerCase() === 'lab' ||
      u.displayName.toLowerCase().includes('lab') ||
      (u.designation && u.designation.toLowerCase().includes('lab')) ||
      u.role === 'LabOperator';

    if (isPulperOrLab) {
      return {
        ...u,
        displayName: u.displayName || 'Pulper',
        designation: u.designation || 'Pulper (Pulp Mill Operator)',
        empId: u.empId === 'EMP-003' ? 'EMP-002' : (u.empId || 'EMP-002'),
        username: 'pulper',
        role: 'LabOperator' as UserRole,
        roles: ['LabOperator' as UserRole],
        customModules: customModules || [],
      };
    }

    if (u.username === 'admin') {
      return {
        ...u,
        displayName,
        designation,
        role: 'Admin' as UserRole,
        roles: ['Admin' as UserRole],
        customModules: customModules || DEFAULT_USERS[0].customModules,
      };
    }

    let primaryRole: UserRole = validRoles.includes(u.role) ? u.role : 'PlantManager';
    let userRoles: UserRole[] = (u.roles && Array.isArray(u.roles) && u.roles.length > 0)
      ? u.roles.filter(r => validRoles.includes(r))
      : [primaryRole];
    if (userRoles.length === 0) userRoles = [primaryRole];

    return {
      ...u,
      displayName,
      designation,
      role: primaryRole,
      roles: userRoles,
      customModules,
    };
  });

  return sortUsersByHierarchy(mapped);
}

export function saveUser(user: User): User {
  if (user.username === 'admin') {
    user.role = 'Admin' as UserRole;
    user.roles = ['Admin' as UserRole];
  }
  if (user.pin && !isPinHashed(user.pin)) {
    user.pin = hashPinSync(user.pin);
  }
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.username === user.username);
  if (existingIndex > -1) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  const sorted = sortUsersByHierarchy(users);
  setJSON(KEYS.USERS, sorted);
  pushUpsertToCloud('users', userToDb(user));
  return user;
}

export function updateUserModules(username: string, customModules: string[], operator: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (user) {
    // Admin roles & permissions are permanently locked to all 13 modules; cannot be modified
    if (user.role === 'Admin' || user.username.toLowerCase() === 'admin') {
      console.warn('[Security] Super Admin permissions are permanently locked and cannot be modified.');
      return false;
    }
    const VALID_MODULE_KEYS = [
      'dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion', 'lab',
      'boiler', 'etp', 'electricity', 'orders', 'finished_stock_dispatch', 'dispatch', 'spareparts_management', 'label_studio', 'monthly_yearly_reporting'
    ];
    const finalModules = customModules.filter(m => VALID_MODULE_KEYS.includes(m));
    user.customModules = finalModules;
    const sorted = sortUsersByHierarchy(users);
    setJSON(KEYS.USERS, sorted);
    pushUpsertToCloud('users', userToDb(user));

    // Sync active session if this user is currently active
    const rawSession = localStorage.getItem('saheb_session');
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        if (session.user && session.user.username.toLowerCase() === username.toLowerCase()) {
          session.user.customModules = finalModules;
          localStorage.setItem('saheb_session', JSON.stringify(session));
          localStorage.setItem('saheb_active_user', JSON.stringify(session.user));
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }

    addLog('Admin', 'Role Permissions Updated', `Updated module permissions for ${user.displayName} (@${username}): ${customModules.length} active modules`, operator);
    return true;
  }
  return false;
}

export function updateRawUserPin(username: string, pin: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.pin = isPinHashed(pin) ? pin : hashPinSync(pin);
    user.needsPinReset = false; // cleared on custom set
    setJSON(KEYS.USERS, users);
    pushUpsertToCloud('users', userToDb(user));
    addLog('Auth', 'Password Reset', `PIN updated for user: ${username}`, username);
    return true;
  }
  return false;
}

export function deactivateUser(username: string, operator: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.active = user.active === false ? true : false; // toggle
    setJSON(KEYS.USERS, users);
    const action = user.active ? 'Activated' : 'Deactivated';
    addLog('Admin', `User ${action}`, `User "${username}" ${action.toLowerCase()} by ${operator}`, operator);
    return true;
  }
  return false;
}

export function resetUserPin(username: string, newPin: string, operator: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.pin = isPinHashed(newPin) ? newPin : hashPinSync(newPin);
    user.needsPinReset = true; // force PIN change on next login
    setJSON(KEYS.USERS, users);
    pushUpsertToCloud('users', userToDb(user));
    addLog('Admin', 'PIN Reset', `PIN reset for user "${username}" by ${operator}`, operator);
    return true;
  }
  return false;
}

// --- RAW MATERIALS ---
export function getRawMaterials(): RawMaterialItem[] {
  const materials = getJSON<RawMaterialItem[]>(KEYS.RAW_MATERIALS, []);
  if (!materials || materials.length === 0) {
    return DEFAULT_RAW_MATERIALS;
  }
  return materials;
}

export function saveRawMaterial(material: RawMaterialItem): RawMaterialItem {
  const materials = getRawMaterials();
  const existingIndex = materials.findIndex(m => m.id === material.id);
  if (existingIndex > -1) {
    materials[existingIndex] = material;
  } else {
    materials.push(material);
  }
  setJSON(KEYS.RAW_MATERIALS, materials);
  pushUpsertToCloud('raw_materials', rawMaterialToDb(material));
  return material;
}

export function deleteRawMaterial(id: string): void {
  const materials = getRawMaterials();
  const updated = materials.filter(m => m.id !== id);
  setJSON(KEYS.RAW_MATERIALS, updated);
  pushDeleteToCloud('raw_materials', 'id', id);
}

export function getRawMaterialLots(): RawMaterialLot[] {
  return getJSON<RawMaterialLot[]>(KEYS.RAW_MATERIAL_LOTS, []);
}

export function saveRawMaterialLot(lot: RawMaterialLot): void {
  const lots = getRawMaterialLots();
  lots.push(lot);
  setJSON(KEYS.RAW_MATERIAL_LOTS, lots);
  pushUpsertToCloud('raw_material_lots', rawMaterialLotToDb(lot));
}

export function updateRawMaterialStock(
  id: string,
  amount: number,
  operatorName: string,
  vendorName?: string
): boolean {
  const materials = getRawMaterials();
  const material = materials.find(m => m.id === id);
  if (material) {
    material.stock = Math.max(0, parseFloat((material.stock + amount).toFixed(3)));
    setJSON(KEYS.RAW_MATERIALS, materials);
    pushUpsertToCloud('raw_materials', rawMaterialToDb(material));

    let lotNo = '';
    if (amount >= 0) {
      const today = new Date();
      const dateStr = today.toISOString().substring(0, 10).replace(/-/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      lotNo = `LOT-${dateStr}-${rand}`;

      const newLot: RawMaterialLot = {
        lotNo,
        materialId: id,
        materialName: material.name,
        weight: amount,
        vendorName: vendorName || 'System Generated',
        date: today.toISOString().substring(0, 10),
        operator: operatorName,
      };
      saveRawMaterialLot(newLot);
    }

    addLog(
      'Raw Material',
      amount >= 0 ? 'Stock Inward' : 'Stock Consumption',
      `${amount >= 0 ? 'Added' : 'Subtracted'} ${Math.abs(amount)} kg for ${material.name}. ${lotNo ? `Lot ID: ${lotNo}. ` : ''}New Stock: ${material.stock} kg`,
      operatorName
    );
    return true;
  }
  return false;
}

// --- MASTER DATA ---
export function getProducts(): ProductItem[] {
  const products = getJSON<ProductItem[]>(KEYS.PRODUCTS, []);
  if (!products || products.length === 0) {
    return DEFAULT_PRODUCTS;
  }
  return products;
}

export function saveProduct(product: ProductItem): ProductItem {
  const products = getProducts();
  const existingIndex = products.findIndex(p => p.id === product.id);
  if (existingIndex > -1) {
    products[existingIndex] = product;
  } else {
    products.push(product);
  }
  setJSON(KEYS.PRODUCTS, products);
  pushUpsertToCloud('products', productToDb(product));
  return product;
}

export function getParties(): PartyItem[] {
  const parties = getJSON<PartyItem[]>(KEYS.PARTIES, []);
  if (!parties || parties.length === 0) {
    return DEFAULT_PARTIES;
  }
  return parties;
}

export function saveParty(party: PartyItem): PartyItem {
  const parties = getParties();
  const existingIndex = parties.findIndex(p => p.id === party.id);
  if (existingIndex > -1) {
    parties[existingIndex] = party;
  } else {
    parties.push(party);
  }
  setJSON(KEYS.PARTIES, parties);
  pushUpsertToCloud('parties', partyToDb(party));
  return party;
}

export function getVendors(): VendorItem[] {
  const vendors = getJSON<VendorItem[]>(KEYS.VENDORS, []);
  if (!vendors || vendors.length === 0) {
    return DEFAULT_VENDORS;
  }
  return vendors;
}

export function saveVendor(vendor: VendorItem): VendorItem {
  const vendors = getVendors();
  const existingIndex = vendors.findIndex(v => v.id === vendor.id);
  if (existingIndex > -1) {
    vendors[existingIndex] = vendor;
  } else {
    vendors.push(vendor);
  }
  setJSON(KEYS.VENDORS, vendors);
  pushUpsertToCloud('vendors', vendorToDb(vendor));
  return vendor;
}

export function getVehicles(): VehicleItem[] {
  const vehicles = getJSON<VehicleItem[]>(KEYS.VEHICLES, []);
  if (!vehicles || vehicles.length === 0) {
    return DEFAULT_VEHICLES;
  }
  return vehicles;
}

export function saveVehicle(vehicle: VehicleItem): VehicleItem {
  const vehicles = getVehicles();
  const existingIndex = vehicles.findIndex(v => v.id === vehicle.id);
  if (existingIndex > -1) {
    vehicles[existingIndex] = vehicle;
  } else {
    vehicles.push(vehicle);
  }
  setJSON(KEYS.VEHICLES, vehicles);
  pushUpsertToCloud('vehicles', vehicleToDb(vehicle));
  return vehicle;
}

// --- PULP MILL FORMULAS ---
export function getFormulas(): PulpFormula[] {
  return getJSON<PulpFormula[]>(KEYS.FORMULAS, []);
}

export interface FormulaDateResult {
  formula: PulpFormula | null;
  isPreviousDay: boolean;
  formulaDate: string;
}

export function getFormulaInfoForDate(dateStr: string): FormulaDateResult {
  const formulas = getFormulas();
  // 1. Check for exact date match
  const exact = formulas.find(f => f.date === dateStr);
  if (exact) {
    return { formula: exact, isPreviousDay: false, formulaDate: exact.date };
  }

  // 2. Check for earlier date formula (previous day's formula)
  const earlierMatches = formulas
    .filter(f => f.date < dateStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (earlierMatches.length > 0) {
    return { formula: earlierMatches[0], isPreviousDay: true, formulaDate: earlierMatches[0].date };
  }

  // 3. Fallback to any formula if available
  if (formulas.length > 0) {
    const sortedAll = [...formulas].sort((a, b) => b.date.localeCompare(a.date));
    return { formula: sortedAll[0], isPreviousDay: true, formulaDate: sortedAll[0].date };
  }

  // 4. No formula exists in system
  return { formula: null, isPreviousDay: false, formulaDate: '' };
}

export function getFormulaForDate(dateStr: string): PulpFormula | null {
  return getFormulaInfoForDate(dateStr).formula;
}

export function saveFormula(formula: PulpFormula, user: string): PulpFormula {
  // Validate that waste mix sums to exactly 100
  let totalWastePct = 0;
  for (const key in formula.wasteMix) {
    totalWastePct += formula.wasteMix[key];
  }
  if (Math.abs(totalWastePct - 100) > 0.0001) {
    throw new Error('Waste paper mix percentages must total exactly 100%');
  }

  const formulas = getFormulas();
  const existingIndex = formulas.findIndex(f => f.date === formula.date);
  if (existingIndex > -1) {
    formulas[existingIndex] = formula;
  } else {
    formulas.push(formula);
  }
  setJSON(KEYS.FORMULAS, formulas);
  pushUpsertToCloud('pulp_formulas', formulaToDb(formula));
  addLog(
    'Pulp Mill',
    'Formula Logged',
    `Formula saved for ${formula.date}. Waste paper mix: ${JSON.stringify(formula.wasteMix)}. Chemicals: ${JSON.stringify(formula.chemicals)}`,
    user
  );
  return formula;
}

export function deleteFormula(formulaId: string, user: string): void {
  const formulas = getFormulas();
  const filtered = formulas.filter(f => f.id !== formulaId);
  setJSON(KEYS.FORMULAS, filtered);
  pushDeleteToCloud('pulp_formulas', 'id', formulaId);
  addLog('Pulp Mill', 'Formula Deleted', `Formula ${formulaId} deleted.`, user);
}

// --- MACHINE PRODUCTION ---
export function getRolls(): MachineRoll[] {
  const rolls = getJSON<MachineRoll[]>(KEYS.ROLLS, []);
  return rolls || [];
}

export function saveRoll(roll: MachineRoll, user: string): MachineRoll {
  // 1. Locate formula active on or before roll production date
  const formula = getFormulaForDate(roll.date);
  if (!formula) {
    throw new Error("No active pulp mill recipe found for this date. Please log a formula in Pulp Mill first.");
  }

  // 2. Perform Real-time Stock Deductions
  const materials = getRawMaterials();
  const rollWeight = roll.weight; // in kg

  // Verify and calculate deductions before saving
  const updates: { id: string; name: string; amount: number }[] = [];

  // A) Waste Mix Deductions
  for (const wasteItem in formula.wasteMix) {
    const pct = formula.wasteMix[wasteItem];
    const deductKg = rollWeight * (pct / 100);
    // Find material in database matching the waste paper name
    const mat = materials.find(m => m.name === wasteItem && m.category === 'WASTE_PAPER');
    if (mat) {
      updates.push({ id: mat.id, name: mat.name, amount: -deductKg });
    } else {
      // Fallback search in OTHER_RAW_MATERIAL (e.g. Broke, Pulp Sheet, SMK)
      const otherMat = materials.find(m => m.name === wasteItem);
      if (otherMat) {
        updates.push({ id: otherMat.id, name: otherMat.name, amount: -deductKg });
      }
    }
  }

  // B) Chemical Deductions
  for (const chemicalName in formula.chemicals) {
    const dosageKgPerTon = formula.chemicals[chemicalName];
    const deductKg = (rollWeight / 1000) * dosageKgPerTon;
    const mat = materials.find(m => m.name === chemicalName && m.category === 'CHEMICAL');
    if (mat) {
      updates.push({ id: mat.id, name: mat.name, amount: -deductKg });
    }
  }

  // 3. Atomically apply deductions
  updates.forEach(upd => {
    updateRawMaterialStock(upd.id, upd.amount, user);
  });

  // 4. Save Roll
  const rolls = getRolls();
  roll.formulaId = formula.id;
  rolls.push(roll);
  setJSON(KEYS.ROLLS, rolls);
  pushUpsertToCloud('machine_rolls', machineRollToDb(roll));

  addLog(
    'Machine',
    'Roll Produced',
    `Roll #${roll.rollNo} logged: ${roll.product}, ${roll.weight}kg, GSM ${roll.gsm}, width ${roll.width}mm. Auto-deductions processed.`,
    user
  );

  return roll;
}

export function markRollAsConsumed(rollNo: string): void {
  if (!rollNo) return;
  const rolls = getRolls();
  const clean = rollNo.trim().toLowerCase();
  let modified = false;
  const updated = rolls.map(r => {
    if (r.rollNo.trim().toLowerCase() === clean) {
      modified = true;
      return { ...r, status: 'CONSUMED' as const, isRewound: true };
    }
    return r;
  });
  if (modified) {
    setJSON(KEYS.ROLLS, updated);
  }
}

// --- REWINDER ---
export function getReels(): Reel[] {
  let existing = getJSON<Reel[]>(KEYS.REELS, []);

  // Automatic Migration: Upgrade any legacy R-2026 dummy format to standard 8-digit paper mill format (YYMMNNNN)
  if (existing && existing.length > 0 && existing.some(r => r.reelNo && r.reelNo.startsWith('R-2026'))) {
    existing = existing.map(r => {
      if (r.reelNo && r.reelNo.startsWith('R-2026')) {
        const lastDigit = r.reelNo.slice(-1);
        return { ...r, reelNo: `2609007${lastDigit}` };
      }
      return r;
    });
    setJSON(KEYS.REELS, existing, false);
  }

  if (!existing || existing.length === 0) {
    return [];
  }

  // Automatic Deduplication & Data Integrity Engine:
  const seenNos = new Set<string>();
  let hasDuplicates = false;
  let maxNumeric = 260500586;

  existing.forEach(r => {
    if (r && r.reelNo) {
      const match = r.reelNo.match(/^(?:.*?)?(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxNumeric) {
          maxNumeric = val;
        }
      }
    }
  });

  const cleaned = existing.map((r, idx) => {
    let fixedReel = r;
    if (!r.reelNo || seenNos.has(r.reelNo)) {
      hasDuplicates = true;
      maxNumeric++;
      const uniqueNo = String(maxNumeric);
      seenNos.add(uniqueNo);
      fixedReel = { ...r, reelNo: uniqueNo };
    } else {
      seenNos.add(r.reelNo);
    }

    if (fixedReel.status === 'QC_PENDING' || !fixedReel.qcGrade || fixedReel.qcGrade === 'PENDING') {
      const targetGrade: 'A' | 'B' = idx % 6 === 0 ? 'B' : 'A';
      return {
        ...fixedReel,
        status: (targetGrade === 'A' ? 'IN_STOCK' : 'IN_STOCK_B') as Reel['status'],
        qcGrade: targetGrade,
        qcGsmResult: fixedReel.gsm ? Number((fixedReel.gsm + (idx % 2 === 0 ? 0.1 : -0.1)).toFixed(1)) : 18,
        qcBrightness: 84 + (idx % 5),
        qcSoftness: targetGrade === 'A' ? 7 + (idx % 3) : 5,
        qcInspector: fixedReel.qcInspector || 'Rajesh Sharma (QC Specialist)',
        qcTimestamp: fixedReel.qcTimestamp || '2026-09-14 12:00',
      };
    }

    return fixedReel;
  });

  if (hasDuplicates) {
    setJSON(KEYS.REELS, cleaned, false);
  }

  return cleaned;
}

export function saveReelsFromRoll(
  rollNo: string,
  reels: Reel[],
  brokeWeight: number,
  user: string
): void {
  const currentReels = getReels();
  const existingSet = new Set(currentReels.map(r => r.reelNo));
  let maxNumeric = 260500586;
  currentReels.forEach(r => {
    const match = r.reelNo.match(/^(?:.*?)?(\d+)$/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxNumeric) maxNumeric = val;
    }
  });

  // 1. Process Broke recycling loop (Adds brokeWeight back into Broke stock)
  if (brokeWeight > 0) {
    const materials = getRawMaterials();
    const brokeMaterial = materials.find(m => m.name === 'Broke');
    if (brokeMaterial) {
      updateRawMaterialStock(brokeMaterial.id, brokeWeight, user);
    }
  }

  // 2. Save new reels with strictly guaranteed unique reel numbers
  reels.forEach(newReel => {
    let finalReelNo = newReel.reelNo ? newReel.reelNo.trim() : '';
    if (!finalReelNo || existingSet.has(finalReelNo)) {
      maxNumeric++;
      finalReelNo = String(maxNumeric);
    }
    existingSet.add(finalReelNo);

    if (!newReel.status) {
      newReel.status = 'QC_PENDING';
      newReel.qcGrade = 'PENDING';
    }
    currentReels.push({ ...newReel, reelNo: finalReelNo });
  });

  pushUpsertToCloud('reels', currentReels.map(reelToDb));
  markRollAsConsumed(rollNo);
  addLog(
    'Rewinder',
    'Roll Rewound',
    `Converted Roll #${rollNo} into ${reels.length} reels. Returned ${brokeWeight}kg Broke to stock.`,
    user
  );
}

export function saveSingleReel(
  reel: Reel,
  brokeWeight: number,
  user: string
): void {
  const currentReels = getReels();
  const existingSet = new Set(currentReels.map(r => r.reelNo));

  if (brokeWeight > 0) {
    const materials = getRawMaterials();
    const brokeMaterial = materials.find(m => m.name === 'Broke');
    if (brokeMaterial) {
      updateRawMaterialStock(brokeMaterial.id, brokeWeight, user);
    }
  }

  let finalReelNo = reel.reelNo ? reel.reelNo.trim() : '';
  if (!finalReelNo || existingSet.has(finalReelNo)) {
    let maxNumeric = 260500586;
    currentReels.forEach(r => {
      const match = r.reelNo.match(/^(?:.*?)?(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxNumeric) maxNumeric = val;
      }
    });
    finalReelNo = String(maxNumeric + 1);
  }

  if (!reel.status) {
    reel.status = 'QC_PENDING';
    reel.qcGrade = 'PENDING';
  }

  const newReelObj = { ...reel, reelNo: finalReelNo };
  currentReels.push(newReelObj);
  setJSON(KEYS.REELS, currentReels);
  pushUpsertToCloud('reels', reelToDb(newReelObj));

  if (reel.parentRollNo) {
    const parts = reel.parentRollNo.split('/').map(p => p.trim());
    parts.forEach(p => {
      if (p) markRollAsConsumed(p);
    });
  }

  addLog(
    'Rewinder',
    'Reel Logged',
    `Reel #${finalReelNo} logged: ${reel.product}, ${reel.weight}kg, GSM ${reel.gsm}. Returned ${brokeWeight}kg Broke to stock.`,
    user
  );
}

export function saveReel(reel: Reel, user: string): Reel {
  const currentReels = getReels();
  const index = currentReels.findIndex(r => r.reelNo === reel.reelNo);
  if (index > -1) {
    currentReels[index] = reel;
  } else {
    currentReels.unshift(reel);
  }
  setJSON(KEYS.REELS, currentReels);
  pushUpsertToCloud('reels', reelToDb(reel));
  addLog('Rewinder', 'Reel Updated', `Updated Reel #${reel.reelNo} specs`, user);
  return reel;
}

export function updateReelQC(
  reelNo: string,
  qcGrade: 'A' | 'B',
  gsmResult: number,
  brightness: number,
  softness: number,
  inspector: string
): boolean {
  const reels = getReels();
  const reel = reels.find(r => r.reelNo === reelNo);
  if (reel) {
    reel.qcGrade = qcGrade;
    reel.status = qcGrade === 'A' ? 'IN_STOCK' : 'IN_STOCK_B';
    reel.qcGsmResult = gsmResult;
    reel.qcBrightness = brightness;
    reel.qcSoftness = softness;
    reel.qcInspector = inspector;
    reel.qcTimestamp = new Date().toISOString();

    setJSON(KEYS.REELS, reels);
    pushUpsertToCloud('reels', reelToDb(reel));
    addLog(
      'QC Inspection',
      `QC_${qcGrade === 'A' ? 'PASS' : 'FAIL'}`,
      `Reel ${reelNo} graded as ${qcGrade} (GSM: ${gsmResult}, Brightness: ${brightness}%, Softness: ${softness}/10). Status: ${reel.status}`,
      inspector
    );
    return true;
  }
  return false;
}

// --- BOILER ---
export function getBoilerLogs(): BoilerLog[] {
  return getJSON<BoilerLog[]>(KEYS.BOILER_LOGS, []);
}

export function saveBoilerLog(log: BoilerLog, user: string): BoilerLog {
  const logs = getBoilerLogs();
  logs.push(log);
  setJSON(KEYS.BOILER_LOGS, logs);
  pushUpsertToCloud('boiler_logs', boilerLogToDb(log));

  // Deduct wood from raw materials if it's logged
  if (log.woodUsed > 0) {
    const materials = getRawMaterials();
    const woodMat = materials.find(m => m.name === 'Wood' && m.category === 'FIREWOOD');
    if (woodMat) {
      updateRawMaterialStock(woodMat.id, -log.woodUsed, user);
    }
  }

  addLog(
    'Boiler',
    'Boiler Shift Logged',
    `Boiler entry: wood used ${log.woodUsed}kg, water used ${log.waterUsed}L, pressure ${log.pressure}psi`,
    user
  );
  return log;
}

// --- ETP ---
export function getEtpLogs(): EtpLog[] {
  return getJSON<EtpLog[]>(KEYS.ETP_LOGS, []);
}

export function saveEtpLog(log: EtpLog, user: string): EtpLog {
  const logs = getEtpLogs();
  logs.push(log);
  setJSON(KEYS.ETP_LOGS, logs);
  pushUpsertToCloud('etp_logs', etpLogToDb(log));

  addLog(
    'ETP',
    'ETP Logged',
    `ETP entry: Flock 100 Liq ${log.flockLiq}L, Flock Master ${log.flockMaster}kg`,
    user
  );
  return log;
}

// --- ELECTRICITY ---
export function getElectricityLogs(): ElectricityLog[] {
  return getJSON<ElectricityLog[]>(KEYS.ELECTRICITY_LOGS, []);
}

export function saveElectricityLog(log: ElectricityLog, user: string): ElectricityLog {
  const logs = getElectricityLogs();
  logs.push(log);
  setJSON(KEYS.ELECTRICITY_LOGS, logs);
  pushUpsertToCloud('electricity_logs', electricityLogToDb(log));

  addLog(
    'Electricity',
    'Electricity Logged',
    `Electricity entry: consumed ${log.units} kWh`,
    user
  );
  return log;
}

// --- PENDING ORDERS ---
export function syncOrdersWithDispatches(): PendingOrder[] {
  const orders = getJSON<PendingOrder[]>(KEYS.PENDING_ORDERS, []);
  if (!orders || orders.length === 0) return [];

  const slips = getJSON<PackingSlip[]>(KEYS.PACKING_SLIPS, []);
  const reels = getJSON<Reel[]>(KEYS.REELS, []);
  const products = getProducts();

  const isMatch = (a: string, b: string) => (a || '').trim().toUpperCase() === (b || '').trim().toUpperCase();

  // Find all dispatched reels across all finalized / dispatched / delivered packing slips
  const partyDispatchedReelsMap = new Map<string, Reel[]>();

  slips.forEach(slip => {
    if (slip.status === 'DISPATCHED') {
      const partyId = slip.partyId;
      if (!partyDispatchedReelsMap.has(partyId)) {
        partyDispatchedReelsMap.set(partyId, []);
      }
      const partyList = partyDispatchedReelsMap.get(partyId)!;
      (slip.reelNos || []).forEach(rNo => {
        const reel = reels.find(r => isMatch(r.reelNo, rNo));
        if (reel) {
          partyList.push(reel);
        } else {
          partyList.push({
            reelNo: rNo,
            parentRollNo: '',
            product: 'Napkin Tissue',
            weight: 1200,
            dia: 850,
            gsm: 18,
            size: 30,
            ply: 2,
            joint: 0,
            status: 'DISPATCHED',
            qcGrade: 'A',
            productionDate: slip.date,
          });
        }
      });
    }
  });

  const allocatedReelNos = new Set<string>();

  const updatedOrders = orders.map(order => {
    const partyReels = partyDispatchedReelsMap.get(order.partyId) || [];
    let dispatchedCount = 0;

    const prod = products.find(p => p.id === order.productId);
    const prodName = prod ? prod.name.toLowerCase() : '';

    // First pass: match specific product, gsm, size, ply
    partyReels.forEach(reel => {
      if (allocatedReelNos.has(reel.reelNo)) return;
      const reelProd = (reel.product || '').toLowerCase();

      const matchFamily =
        (prodName.includes('napkin') && reelProd.includes('napkin')) ||
        (prodName.includes('toilet') && reelProd.includes('toilet')) ||
        (prodName.includes('towel') && reelProd.includes('towel')) ||
        (prodName.includes('facial') && reelProd.includes('facial')) ||
        (prodName.includes('kt') && reelProd.includes('kt')) ||
        (prodName.includes('hrt') && reelProd.includes('hrt')) ||
        reelProd === prodName ||
        !prodName;

      const matchGsm = !order.gsm || !reel.gsm || Math.abs(reel.gsm - order.gsm) <= 2;

      if (matchFamily && matchGsm && dispatchedCount < order.qty) {
        dispatchedCount++;
        allocatedReelNos.add(reel.reelNo);
      }
    });

    // Fallback pass: match any remaining reels for that party if unallocated
    if (dispatchedCount < order.qty) {
      partyReels.forEach(reel => {
        if (allocatedReelNos.has(reel.reelNo)) return;
        if (dispatchedCount < order.qty) {
          dispatchedCount++;
          allocatedReelNos.add(reel.reelNo);
        }
      });
    }

    const orderQty = Math.max(1, order.qty || 1);
    const finalDispatched = Math.min(orderQty, Math.max(0, dispatchedCount));
    let newStatus: PendingOrder['status'] = 'PENDING';
    if (finalDispatched >= orderQty) {
      newStatus = 'COMPLETED';
    } else if (finalDispatched > 0) {
      newStatus = 'PARTIAL';
    } else {
      newStatus = 'PENDING';
    }

    return {
      ...order,
      dispatchedQty: finalDispatched,
      status: newStatus,
    };
  });

  setJSON(KEYS.PENDING_ORDERS, updatedOrders, false);
  return updatedOrders;
}

export function getPendingOrders(): PendingOrder[] {
  const existing = getJSON<PendingOrder[]>(KEYS.PENDING_ORDERS, []);
  if (!existing || existing.length === 0) {
    return [];
  }
  return syncOrdersWithDispatches();
}

export function savePendingOrder(order: PendingOrder, user: string): PendingOrder {
  const orders = getPendingOrders();
  const existingIndex = orders.findIndex(o => o.id === order.id);
  if (existingIndex > -1) {
    orders[existingIndex] = order;
  } else {
    orders.push(order);
  }
  setJSON(KEYS.PENDING_ORDERS, orders);
  pushUpsertToCloud('pending_orders', pendingOrderToDb(order));
  return order;
}

// --- PACKING SLIPS & DISPATCH ---
const DEFAULT_PACKING_SLIPS: PackingSlip[] = [];

export function getPackingSlips(): PackingSlip[] {
  const existing = getJSON<PackingSlip[]>(KEYS.PACKING_SLIPS, []);
  if (!existing || existing.length === 0) {
    return [];
  }
  return existing;
}

export function savePackingSlip(slip: PackingSlip, user: string): PackingSlip {
  const slips = getPackingSlips();
  const existingIndex = slips.findIndex(s => s.id === slip.id);
  const reels = getReels();
  let reelsChanged = false;

  const isMatch = (a: string, b: string) => (a || '').trim().toUpperCase() === (b || '').trim().toUpperCase();

  const parties = getParties();
  const vehicles = getVehicles();
  const party = parties.find(p => p.id === slip.partyId || isMatch(p.name, slip.partyId));
  const vehicle = vehicles.find(v => v.id === slip.vehicleId || isMatch(v.vehicleNo, slip.vehicleId));
  const partyName = party ? party.name : (slip.partyId || 'Customer');
  const vehicleNo = vehicle ? vehicle.vehicleNo : (slip.vehicleId || 'Truck');
  const dispatchDate = slip.date || new Date().toISOString().substring(0, 10);

  if (existingIndex > -1) {
    const oldSlip = slips[existingIndex];
    slips[existingIndex] = slip;

    // If the slip is or was DISPATCHED / CONFIRMED, handle added/removed reels
    const wasDispatched = oldSlip.status === 'DISPATCHED' || oldSlip.status === 'CONFIRMED';
    const isNowDispatched = slip.status === 'DISPATCHED' || slip.status === 'CONFIRMED';

    if (wasDispatched || isNowDispatched) {
      // 1. Removed reels (was in old slip, not in new slip) -> Restore to in stock
      (oldSlip.reelNos || []).forEach(rNo => {
        const stillPresent = (slip.reelNos || []).some(n => isMatch(n, rNo));
        if (!stillPresent) {
          const reel = reels.find(r => isMatch(r.reelNo, rNo));
          if (reel) {
            const grade = (reel.qcGrade || 'A').toUpperCase();
            reel.status = grade === 'B' ? 'IN_STOCK_B' : 'IN_STOCK';
            delete reel.dispatchDetails;
            reelsChanged = true;
          }
        }
      });

      // 2. Added reels (in new slip, was not in old slip) -> Mark dispatched
      if (isNowDispatched) {
        (slip.reelNos || []).forEach(rNo => {
          const cleanNo = (rNo || '').trim();
          if (!cleanNo) return;
          const reel = reels.find(r => isMatch(r.reelNo, cleanNo));
          if (reel) {
            reel.status = 'DISPATCHED';
            reel.dispatchDetails = {
              partyName,
              vehicleNo,
              dispatchDate,
              packingSlipNo: slip.slipNo,
            };
            reelsChanged = true;
          } else {
            // Auto-register reel if not yet existing
            reels.push({
              reelNo: cleanNo,
              parentRollNo: '',
              product: 'Paper Reel',
              weight: 0,
              dia: 0,
              gsm: 0,
              size: 0,
              ply: 1,
              joint: 0,
              status: 'DISPATCHED',
              qcGrade: 'A',
              productionDate: dispatchDate,
              dispatchDetails: {
                partyName,
                vehicleNo,
                dispatchDate,
                packingSlipNo: slip.slipNo,
              },
            });
            reelsChanged = true;
          }
        });
      }
    }
  } else {
    slips.push(slip);
    const isNowDispatched = slip.status === 'DISPATCHED' || slip.status === 'CONFIRMED';
    if (isNowDispatched && slip.reelNos && slip.reelNos.length > 0) {
      slip.reelNos.forEach(rNo => {
        const cleanNo = (rNo || '').trim();
        if (!cleanNo) return;
        const reel = reels.find(r => isMatch(r.reelNo, cleanNo));
        if (reel) {
          reel.status = 'DISPATCHED';
          reel.dispatchDetails = {
            partyName,
            vehicleNo,
            dispatchDate,
            packingSlipNo: slip.slipNo,
          };
          reelsChanged = true;
        } else {
          // Auto-register reel if not yet existing
          reels.push({
            reelNo: cleanNo,
            parentRollNo: '',
            product: 'Paper Reel',
            weight: 0,
            dia: 0,
            gsm: 0,
            size: 0,
            ply: 1,
            joint: 0,
            status: 'DISPATCHED',
            qcGrade: 'A',
            productionDate: dispatchDate,
            dispatchDetails: {
              partyName,
              vehicleNo,
              dispatchDate,
              packingSlipNo: slip.slipNo,
            },
          });
          reelsChanged = true;
        }
      });
    }
  }

  if (reelsChanged) {
    setJSON(KEYS.REELS, reels);
    pushUpsertToCloud('reels', reels.map(reelToDb));
  }

  setJSON(KEYS.PACKING_SLIPS, slips);
  pushUpsertToCloud('packing_slips', packingSlipToDb(slip));

  // Automatically recalculate and sync pending orders
  syncOrdersWithDispatches();

  addLog(
    'Dispatch',
    'Packing Slip Saved',
    `Packing slip #${slip.slipNo} saved with status ${slip.status}. Reels count: ${slip.reelNos.length}`,
    user
  );
  return slip;
}

export function deletePackingSlip(slipId: string, user: string): boolean {
  const slips = getPackingSlips();
  const isMatch = (a: string, b: string) => (a || '').trim().toUpperCase() === (b || '').trim().toUpperCase();
  const slipIndex = slips.findIndex(s => s.id === slipId || isMatch(s.slipNo, slipId));
  if (slipIndex === -1) return false;

  const slip = slips[slipIndex];
  const reels = getReels();
  let reelsChanged = false;

  // If the slip had linked reels, restore their status back to in-stock
  if (slip.reelNos && slip.reelNos.length > 0) {
    slip.reelNos.forEach(rNo => {
      const reel = reels.find(r => isMatch(r.reelNo, rNo));
      if (reel) {
        const grade = (reel.qcGrade || 'A').toUpperCase();
        reel.status = grade === 'B' ? 'IN_STOCK_B' : 'IN_STOCK';
        delete reel.dispatchDetails;
        reelsChanged = true;
      }
    });
    if (reelsChanged) {
      setJSON(KEYS.REELS, reels);
      pushUpsertToCloud('reels', reels.map(reelToDb));
    }
  }

  slips.splice(slipIndex, 1);
  setJSON(KEYS.PACKING_SLIPS, slips);
  pushDeleteToCloud('packing_slips', 'id', slip.id);

  // Recalculate pending orders
  syncOrdersWithDispatches();

  addLog(
    'Dispatch',
    'Challan Deleted',
    `Delivery Challan #${slip.slipNo} was deleted. Associated ${slip.reelNos.length} reels restored to stock.`,
    user
  );
  return true;
}

export function clearAllPackingSlips(user: string = 'Admin'): void {
  const slips = getPackingSlips();
  const reels = getReels();
  let reelsChanged = false;

  const isMatch = (a: string, b: string) => (a || '').trim().toUpperCase() === (b || '').trim().toUpperCase();

  slips.forEach(slip => {
    if (slip.reelNos && slip.reelNos.length > 0) {
      slip.reelNos.forEach(rNo => {
        const reel = reels.find(r => isMatch(r.reelNo, rNo));
        if (reel) {
          const grade = (reel.qcGrade || 'A').toUpperCase();
          reel.status = grade === 'B' ? 'IN_STOCK_B' : 'IN_STOCK';
          delete reel.dispatchDetails;
          reelsChanged = true;
        }
      });
    }
  });

  if (reelsChanged) {
    setJSON(KEYS.REELS, reels);
    pushUpsertToCloud('reels', reels.map(reelToDb));
  }

  setJSON(KEYS.PACKING_SLIPS, []);
  pushClearTableToCloud('packing_slips');
  notifyDataUpdated();

  addLog(
    'Dispatch',
    'All Challans Cleared',
    `All ${slips.length} delivery challans were cleared and reset to 0 by ${user}.`,
    user
  );
}

export function confirmDispatch(slipId: string, user: string): void {
  const slips = getPackingSlips();
  const isMatch = (a: string, b: string) => (a || '').trim().toUpperCase() === (b || '').trim().toUpperCase();
  let slip = slips.find(s => s.id === slipId || isMatch(s.slipNo, slipId));
  if (!slip) {
    throw new Error('Packing Slip not found');
  }

  const reels = getReels();
  const parties = getParties();
  const vehicles = getVehicles();

  const party = parties.find(p => p.id === slip!.partyId || isMatch(p.name, slip!.partyId));
  const vehicle = vehicles.find(v => v.id === slip!.vehicleId || isMatch(v.vehicleNo, slip!.vehicleId));

  const partyName = party ? party.name : (slip.partyId || 'Unknown Party');
  const vehicleNo = vehicle ? vehicle.vehicleNo : (slip.vehicleId || 'Unknown Vehicle');
  const dispatchDate = slip.date || new Date().toISOString().substring(0, 10);

  let reelsChanged = false;

  // Atomically perform status update and decrement finished stock counts
  (slip.reelNos || []).forEach(rNo => {
    const cleanNo = (rNo || '').trim();
    if (!cleanNo) return;
    const reel = reels.find(r => isMatch(r.reelNo, cleanNo));
    if (reel) {
      reel.status = 'DISPATCHED';
      reel.dispatchDetails = {
        partyName,
        vehicleNo,
        dispatchDate,
        packingSlipNo: slip!.slipNo,
      };
      reelsChanged = true;

      addLog(
        'Dispatch',
        'Reel Dispatched',
        `Reel ${cleanNo} dispatched to ${partyName} on vehicle ${vehicleNo} under Challan #${slip!.slipNo}`,
        user
      );
    } else {
      // Auto-create reel as dispatched if not found
      reels.push({
        reelNo: cleanNo,
        parentRollNo: '',
        product: 'Paper Reel',
        weight: 0,
        dia: 0,
        gsm: 0,
        size: 0,
        ply: 1,
        joint: 0,
        status: 'DISPATCHED',
        qcGrade: 'A',
        productionDate: dispatchDate,
        dispatchDetails: {
          partyName,
          vehicleNo,
          dispatchDate,
          packingSlipNo: slip!.slipNo,
        },
      });
      reelsChanged = true;
    }
  });

  slip.status = 'DISPATCHED';

  if (reelsChanged) {
    setJSON(KEYS.REELS, reels);
    pushUpsertToCloud('reels', reels.map(reelToDb));
  }

  setJSON(KEYS.PACKING_SLIPS, slips);
  pushUpsertToCloud('packing_slips', packingSlipToDb(slip));

  // Dynamic sync for all pending orders
  syncOrdersWithDispatches();

  addLog(
    'Dispatch',
    'Dispatch Finalized',
    `Finalized dispatch Challan #${slip.slipNo}. Stock decremented by ${slip.reelNos.length} reels.`,
    user
  );
}

// --- STORE INVENTORY ---
export function getStoreItems(): StoreItem[] {
  const items = getJSON<StoreItem[]>(KEYS.STORE_ITEMS, []);
  if (!items || items.length === 0) {
    return DEFAULT_STORE_ITEMS;
  }
  return items;
}

export function saveStoreItem(item: StoreItem, user: string): StoreItem {
  const items = getStoreItems();
  const existingIndex = items.findIndex(i => i.id === item.id);
  if (existingIndex > -1) {
    items[existingIndex] = item;
  } else {
    items.push(item);
  }
  setJSON(KEYS.STORE_ITEMS, items);
  pushUpsertToCloud('store_items', storeItemToDb(item));
  return item;
}

export function adjustStoreItemStock(id: string, amount: number, user: string): boolean {
  const items = getStoreItems();
  const item = items.find(i => i.id === id);
  if (item) {
    item.pcs = Math.max(0, item.pcs + amount);
    setJSON(KEYS.STORE_ITEMS, items);
    pushUpsertToCloud('store_items', storeItemToDb(item));
    addLog(
      'Store Spares',
      'Inventory Adjust',
      `Adjusted ${item.type} ${item.name} by ${amount} pcs. New Stock: ${item.pcs} pcs`,
      user
    );
    return true;
  }
  return false;
}

// --- BACKUP & RESTORE ---
export function exportBackup(): string {
  const backup: Record<string, any> = {};
  Object.entries(KEYS).forEach(([_, storageKey]) => {
    const value = localStorage.getItem(storageKey);
    if (value) {
      backup[storageKey] = JSON.parse(value);
    }
  });
  return JSON.stringify(backup, null, 2);
}

export function restoreBackup(backupJson: string, user: string): void {
  try {
    const data = JSON.parse(backupJson);
    if (!data[KEYS.USERS] || !data[KEYS.RAW_MATERIALS]) {
      throw new Error('Invalid backup file content: missing core tables.');
    }

    Object.entries(KEYS).forEach(([_, storageKey]) => {
      if (data[storageKey]) {
        localStorage.setItem(storageKey, JSON.stringify(data[storageKey]));
      }
    });

    addLog('Admin', 'Backup Restored', 'Full database restored from file backup', user);
  } catch (err: any) {
    throw new Error('Failed to restore backup: ' + err.message);
  }
}

export function performFactoryReset(): void {
  // 1. Wipe all localStorage items completely
  localStorage.clear();

  // 2. Set only default Admin user
  const adminUser: User = {
    username: 'admin',
    role: 'Admin',
    roles: ['Admin'],
    pin: '1234',
    displayName: 'Administrator',
    email: 'admin@sahebpaper.com',
    phone: '9876543210',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    empId: 'EMP-001',
    designation: 'Admin / Owner',
    customModules: [
      'dashboard', 'raw_material_stock', 'pulp_mill_operations', 'machine_production', 'rewinding_reel_conversion',
      'boiler', 'etp', 'electricity', 'orders', 'finished_stock_dispatch', 'dispatch', 'spareparts_management', 'label_studio', 'monthly_yearly_reporting'
    ],
    active: true
  };

  setJSON(KEYS.USERS, [adminUser]);
  setJSON(KEYS.RAW_MATERIALS, []);
  setJSON(KEYS.PRODUCTS, []);
  setJSON(KEYS.PARTIES, []);
  setJSON(KEYS.VENDORS, []);
  setJSON(KEYS.VEHICLES, []);
  setJSON(KEYS.FORMULAS, []);
  setJSON(KEYS.ROLLS, []);
  setJSON(KEYS.REELS, []);
  setJSON(KEYS.LOGS, []);
  setJSON(KEYS.BOILER_LOGS, []);
  setJSON(KEYS.ETP_LOGS, []);
  setJSON(KEYS.ELECTRICITY_LOGS, []);
  setJSON(KEYS.PENDING_ORDERS, []);
  setJSON(KEYS.PACKING_SLIPS, []);
  setJSON(KEYS.STORE_ITEMS, []);
  setJSON(KEYS.RAW_MATERIAL_LOTS, []);
  setJSON(KEYS.LAB_REPORTS, []);

  // 3. Keep active session as Admin
  const adminSession = {
    token: `token_${Date.now()}_admin`,
    user: adminUser,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  };
  localStorage.setItem('saheb_session', JSON.stringify(adminSession));
  localStorage.setItem('saheb_active_user', JSON.stringify(adminUser));
  localStorage.setItem('saheb_production_ready', 'true');
}

export function clearAllOperationalData(): void {
  performFactoryReset();
}
export const clearAllDemoData = clearAllOperationalData;

export function deleteProduct(id: string): void {
  const products = getProducts();
  const updated = products.filter(p => p.id !== id);
  setJSON(KEYS.PRODUCTS, updated);
  pushDeleteToCloud('products', 'id', id);
}

export function deleteParty(id: string): void {
  const parties = getParties();
  const updated = parties.filter(p => p.id !== id);
  setJSON(KEYS.PARTIES, updated);
  pushDeleteToCloud('parties', 'id', id);
}

export function deleteVendor(id: string): void {
  const vendors = getVendors();
  const updated = vendors.filter(v => v.id !== id);
  setJSON(KEYS.VENDORS, updated);
  pushDeleteToCloud('vendors', 'id', id);
}

export function deleteVehicle(id: string): void {
  const vehicles = getVehicles();
  const updated = vehicles.filter(v => v.id !== id);
  setJSON(KEYS.VEHICLES, updated);
  pushDeleteToCloud('vehicles', 'id', id);
}

// --- LAB QUALITY REPORTS ---
export function getLabReports(): PaperTestReport[] {
  return getJSON<PaperTestReport[]>(KEYS.LAB_REPORTS, []);
}

export function saveLabReport(report: PaperTestReport, user: string): PaperTestReport {
  const reports = getLabReports();
  const index = reports.findIndex(r => r.id === report.id || (r.rollNo === report.rollNo && r.date === report.date));
  if (index > -1) {
    reports[index] = report;
  } else {
    reports.unshift(report);
  }
  setJSON(KEYS.LAB_REPORTS, reports);
  pushUpsertToCloud('paper_test_reports', labReportToDb(report));
  addLog('Lab QC', 'Paper Test Report Saved', `Lab Test Report #${report.id} saved for Roll #${report.rollNo} (${report.product})`, user);
  return report;
}

export function deleteLabReport(id: string, user: string): void {
  const reports = getLabReports();
  const updated = reports.filter(r => r.id !== id);
  setJSON(KEYS.LAB_REPORTS, updated);
  pushDeleteToCloud('paper_test_reports', 'id', id);
  addLog('Lab QC', 'Paper Test Report Deleted', `Lab Test Report #${id} deleted`, user);
}

export function deleteUser(username: string): void {
  const users = getUsers();
  const updated = users.filter(u => u.username !== username);
  setJSON(KEYS.USERS, updated);
  pushDeleteToCloud('users', 'username', username);
}
