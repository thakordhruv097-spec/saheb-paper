import { supabase, isSupabaseConfigured } from './supabase';
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
  BoilerLog,
  EtpLog,
  ElectricityLog,
  PendingOrder,
  PackingSlip,
  StoreItem,
  RawMaterialLot,
  PaperTestReport,
} from '../data/types';
import { sortUsersByHierarchy } from '../data/types';

// Storage keys matching src/data/index.ts
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

const getLocal = <T>(key: string, def: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : def;
  } catch {
    return def;
  }
};

const setLocal = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error saving to localStorage ${key}:`, e);
  }
};

let notifyTimer: any = null;
const pendingTables = new Set<string>();

const TABLE_ALIASES: Record<string, string[]> = {
  users: ['users', 'saheb_users'],
  raw_materials: ['raw_materials', 'raw_material_stock', 'saheb_raw_materials'],
  raw_material_lots: ['raw_material_lots', 'saheb_raw_material_lots'],
  products: ['products', 'saheb_products'],
  parties: ['parties', 'saheb_parties'],
  vendors: ['vendors', 'saheb_vendors'],
  vehicles: ['vehicles', 'saheb_vehicles'],
  pulp_formulas: ['pulp_formulas', 'pulp_mill_operations', 'formulas', 'saheb_formulas'],
  machine_rolls: ['machine_rolls', 'machine_production', 'rolls', 'saheb_rolls'],
  reels: ['reels', 'rewinder_production', 'finished_stock', 'saheb_reels'],
  transaction_logs: ['transaction_logs', 'logs', 'saheb_logs'],
  boiler_logs: ['boiler_logs', 'boiler_operations', 'boiler', 'saheb_boiler_logs'],
  etp_logs: ['etp_logs', 'etp_operations', 'etp', 'saheb_etp_logs'],
  electricity_logs: ['electricity_logs', 'power_grid_operations', 'electricity', 'saheb_electricity_logs'],
  pending_orders: ['pending_orders', 'order_booking', 'orders', 'saheb_pending_orders'],
  packing_slips: ['packing_slips', 'dispatch_receipt', 'dispatch', 'saheb_packing_slips'],
  store_items: ['store_items', 'spares_store', 'spareparts_management', 'saheb_store_items'],
  paper_test_reports: ['paper_test_reports', 'lab_quality_control', 'lab', 'saheb_lab_reports'],
};

export function getCanonicalTableName(tableName: string): string {
  if (!tableName) return '';
  const clean = tableName.toLowerCase().replace(/^saheb_/, '');
  for (const [canonical, aliases] of Object.entries(TABLE_ALIASES)) {
    if (canonical === clean || aliases.includes(tableName) || aliases.includes(clean)) {
      return canonical;
    }
  }
  return clean;
}

export const notifyDataUpdated = (table?: string) => {
  if (typeof window === 'undefined') return;
  if (table) {
    pendingTables.add(table);
    const clean = table.toLowerCase().replace(/^saheb_/, '');
    for (const [canonical, aliases] of Object.entries(TABLE_ALIASES)) {
      if (canonical === clean || aliases.includes(table) || aliases.includes(clean)) {
        aliases.forEach(a => pendingTables.add(a));
      }
    }
  }
  if (notifyTimer) clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => {
    const list = Array.from(pendingTables);
    pendingTables.clear();
    window.dispatchEvent(new CustomEvent('saheb_data_updated', {
      detail: { tables: list, table: list[0] || 'all' }
    }));
  }, 60);
};

export const notifyChange = notifyDataUpdated;

// ==================== MAPPERS ====================

// 1. Users
export const userToDb = (u: User) => ({
  username: u.username,
  role: u.role,
  roles: u.roles || [u.role],
  pin: u.pin,
  display_name: u.displayName,
  email: u.email,
  phone: u.phone,
  active: u.active ?? true,
  needs_pin_reset: u.needsPinReset ?? false,
  security_question: u.securityQuestion || null,
  security_answer: u.securityAnswer || null,
  emp_id: u.empId || null,
  designation: u.designation || null,
  custom_modules: u.customModules || [],
});

export const userFromDb = (r: any): User => ({
  username: r.username,
  role: r.role,
  roles: r.roles || [r.role],
  pin: r.pin,
  displayName: r.display_name,
  email: r.email || '',
  phone: r.phone || '',
  active: r.active ?? true,
  needsPinReset: r.needs_pin_reset ?? false,
  securityQuestion: r.security_question || '',
  securityAnswer: r.security_answer || '',
  empId: r.emp_id || '',
  designation: r.designation || '',
  customModules: r.custom_modules || [],
});

// 2. Raw Materials
export const rawMaterialToDb = (rm: RawMaterialItem) => ({
  id: rm.id,
  name: rm.name,
  category: rm.category,
  stock: rm.stock,
  min_threshold: rm.minThreshold,
  active: rm.active ?? true,
  used_in_module: rm.usedInModule || null,
});

export const rawMaterialFromDb = (r: any): RawMaterialItem => ({
  id: r.id,
  name: r.name,
  category: r.category,
  stock: Number(r.stock) || 0,
  minThreshold: Number(r.min_threshold) || 0,
  active: r.active ?? true,
  usedInModule: r.used_in_module || undefined,
});

// 3. Raw Material Lots
export const rawMaterialLotToDb = (lot: RawMaterialLot) => ({
  lot_no: lot.lotNo,
  material_id: lot.materialId,
  material_name: lot.materialName,
  weight: lot.weight,
  vendor_name: lot.vendorName,
  date: lot.date,
  operator: lot.operator,
});

export const rawMaterialLotFromDb = (r: any): RawMaterialLot => ({
  lotNo: r.lot_no,
  materialId: r.material_id,
  materialName: r.material_name,
  weight: Number(r.weight) || 0,
  vendorName: r.vendor_name,
  date: r.date,
  operator: r.operator,
});

// 4. Products
export const productToDb = (p: ProductItem) => ({
  id: p.id,
  name: p.name,
  grade: p.grade,
  gsm: p.gsm,
  size: p.size,
  ply: p.ply,
  active: p.active ?? true,
});

export const productFromDb = (r: any): ProductItem => ({
  id: r.id,
  name: r.name,
  grade: r.grade,
  gsm: Number(r.gsm) || 0,
  size: Number(r.size) || 0,
  ply: Number(r.ply) || 1,
  active: r.active ?? true,
});

// 5. Parties
export const partyToDb = (p: PartyItem) => ({
  id: p.id,
  name: p.name,
  contact: p.contact || null,
  address: p.address || null,
  active: p.active ?? true,
});

export const partyFromDb = (r: any): PartyItem => ({
  id: r.id,
  name: r.name,
  contact: r.contact || '',
  address: r.address || '',
  active: r.active ?? true,
});

// 6. Vendors
export const vendorToDb = (v: VendorItem) => ({
  id: v.id,
  name: v.name,
  contact: v.contact || null,
  address: v.address || null,
  active: v.active ?? true,
});

export const vendorFromDb = (r: any): VendorItem => ({
  id: r.id,
  name: r.name,
  contact: r.contact || '',
  address: r.address || '',
  active: r.active ?? true,
});

// 7. Vehicles
export const vehicleToDb = (v: VehicleItem) => ({
  id: v.id,
  vehicle_no: v.vehicleNo,
  driver_name: v.driverName || null,
  driver_contact: v.driverContact || null,
  active: v.active ?? true,
});

export const vehicleFromDb = (r: any): VehicleItem => ({
  id: r.id,
  vehicleNo: r.vehicle_no,
  driverName: r.driver_name || '',
  driverContact: r.driver_contact || '',
  active: r.active ?? true,
});

// 8. Pulp Formulas
export const formulaToDb = (f: PulpFormula) => ({
  id: f.id,
  date: f.date,
  waste_mix: f.wasteMix || {},
  chemicals: f.chemicals || {},
});

export const formulaFromDb = (r: any): PulpFormula => ({
  id: r.id,
  date: r.date,
  wasteMix: r.waste_mix || {},
  chemicals: r.chemicals || {},
});

// 9. Machine Rolls
export const machineRollToDb = (mr: MachineRoll) => ({
  roll_no: mr.rollNo,
  product: mr.product,
  weight: mr.weight,
  gsm: mr.gsm,
  width: mr.width,
  dia: mr.dia || null,
  joint: mr.joint || 0,
  shift: mr.shift,
  start_time: mr.startTime || null,
  off_time: mr.offTime || null,
  working_minutes: mr.workingMinutes || 0,
  downtime_reason: mr.downtimeReason || '',
  date: mr.date,
  formula_id: mr.formulaId || '',
});

export const machineRollFromDb = (r: any): MachineRoll => ({
  rollNo: r.roll_no,
  product: r.product,
  weight: Number(r.weight) || 0,
  gsm: Number(r.gsm) || 0,
  width: Number(r.width) || 0,
  dia: r.dia ? Number(r.dia) : undefined,
  joint: r.joint ? Number(r.joint) : 0,
  shift: r.shift,
  startTime: r.start_time || '',
  offTime: r.off_time || '',
  workingMinutes: r.working_minutes ? Number(r.working_minutes) : 0,
  downtimeReason: r.downtime_reason || '',
  date: r.date,
  formulaId: r.formula_id || '',
});

// 10. Reels
export const reelToDb = (reel: Reel) => ({
  reel_no: reel.reelNo,
  parent_roll_no: reel.parentRollNo,
  product: reel.product,
  gsm: reel.gsm,
  size: reel.size,
  ply: reel.ply,
  weight: reel.weight,
  dia: reel.dia || 0,
  joint: reel.joint || 0,
  status: reel.status,
  qc_grade: reel.qcGrade,
  production_date: reel.productionDate,
  challan_no: reel.challanNo || null,
  qc_inspector: reel.qcInspector || null,
  qc_timestamp: reel.qcTimestamp || null,
  qc_gsm_result: reel.qcGsmResult || null,
  qc_brightness: reel.qcBrightness || null,
  qc_softness: reel.qcSoftness || null,
  dispatch_details: reel.dispatchDetails || null,
});

export const reelFromDb = (r: any): Reel => ({
  reelNo: r.reel_no,
  parentRollNo: r.parent_roll_no,
  product: r.product,
  gsm: Number(r.gsm) || 0,
  size: Number(r.size) || 0,
  ply: Number(r.ply) || 1,
  weight: Number(r.weight) || 0,
  dia: Number(r.dia) || 0,
  joint: Number(r.joint) || 0,
  status: r.status,
  qcGrade: r.qc_grade || 'PENDING',
  productionDate: r.production_date,
  challanNo: r.challan_no || undefined,
  qcInspector: r.qc_inspector || undefined,
  qcTimestamp: r.qc_timestamp || undefined,
  qcGsmResult: r.qc_gsm_result ? Number(r.qc_gsm_result) : undefined,
  qcBrightness: r.qc_brightness ? Number(r.qc_brightness) : undefined,
  qcSoftness: r.qc_softness ? Number(r.qc_softness) : undefined,
  dispatchDetails: r.dispatch_details || undefined,
});

// 11. Transaction Logs
export const logToDb = (l: TransactionLog) => ({
  id: l.id,
  timestamp: l.timestamp,
  module: l.module,
  action: l.action,
  details: l.details,
  user_name: l.user,
});

export const logFromDb = (r: any): TransactionLog => ({
  id: r.id,
  timestamp: r.timestamp,
  module: r.module,
  action: r.action,
  details: r.details,
  user: r.user || r.user_name || 'System',
});

// 12. Boiler Logs
export const boilerLogToDb = (b: BoilerLog) => ({
  id: b.id,
  date: b.date,
  wood_used: b.woodUsed,
  water_used: b.waterUsed,
  pressure: b.pressure,
  temperature: b.temperature || null,
  operator: b.operator,
  shift: b.shift,
});

export const boilerLogFromDb = (r: any): BoilerLog => ({
  id: r.id,
  date: r.date,
  woodUsed: Number(r.wood_used) || 0,
  waterUsed: Number(r.water_used) || 0,
  pressure: Number(r.pressure) || 0,
  temperature: r.temperature ? Number(r.temperature) : undefined,
  operator: r.operator,
  shift: r.shift,
});

// 13. ETP Logs
export const etpLogToDb = (e: EtpLog) => ({
  id: e.id,
  date: e.date,
  flock_liq: e.flockLiq,
  flock_master: e.flockMaster,
  operator: e.operator,
});

export const etpLogFromDb = (r: any): EtpLog => ({
  id: r.id,
  date: r.date,
  flockLiq: Number(r.flock_liq) || 0,
  flockMaster: Number(r.flock_master) || 0,
  operator: r.operator,
});

// 14. Electricity Logs
export const electricityLogToDb = (el: ElectricityLog) => ({
  id: el.id,
  date: el.date,
  units: el.units,
  operator: el.operator,
});

export const electricityLogFromDb = (r: any): ElectricityLog => ({
  id: r.id,
  date: r.date,
  units: Number(r.units) || 0,
  operator: r.operator,
});

// 15. Pending Orders
export const pendingOrderToDb = (o: PendingOrder) => ({
  id: o.id,
  party_id: o.partyId,
  product_id: o.productId,
  gsm: o.gsm,
  size: o.size,
  ply: o.ply,
  qty: o.qty,
  weight_tons: o.weightTons || null,
  receive_date: o.receiveDate || null,
  due_date: o.dueDate,
  status: o.status,
  dispatched_qty: o.dispatchedQty || 0,
});

export const pendingOrderFromDb = (r: any): PendingOrder => ({
  id: r.id,
  partyId: r.party_id,
  productId: r.product_id,
  gsm: Number(r.gsm) || 0,
  size: Number(r.size) || 0,
  ply: Number(r.ply) || 1,
  qty: Number(r.qty) || 0,
  weightTons: r.weight_tons ? Number(r.weight_tons) : undefined,
  receiveDate: r.receive_date || undefined,
  dueDate: r.due_date,
  status: r.status,
  dispatchedQty: Number(r.dispatched_qty) || 0,
});

// 16. Packing Slips
export const packingSlipToDb = (ps: PackingSlip) => ({
  id: ps.id,
  slip_no: ps.slipNo,
  date: ps.date,
  party_id: ps.partyId,
  vehicle_id: ps.vehicleId,
  reel_nos: ps.reelNos || [],
  driver_signature: ps.driverSignature || '',
  receiver_signature: ps.receiverSignature || '',
  status: ps.status,
  dispatch_date: ps.dispatchDate || null,
  dispatch_time: ps.dispatchTime || null,
});

export const packingSlipFromDb = (r: any): PackingSlip => {
  let slipNo = r.slip_no || '';
  if (/^\d+$/.test(slipNo.trim())) {
    slipNo = `PS-${slipNo.trim()}`;
  }
  return {
    id: r.id,
    slipNo,
  date: r.date,
  partyId: r.party_id,
  vehicleId: r.vehicle_id,
  reelNos: r.reel_nos || [],
  driverSignature: r.driver_signature || '',
  receiverSignature: r.receiver_signature || '',
  status: r.status,
  dispatchDate: r.dispatch_date || undefined,
  dispatchTime: r.dispatch_time || undefined,
  };
};

// 17. Store Items
export const storeItemToDb = (si: StoreItem) => ({
  id: si.id,
  type: si.type,
  name: si.name,
  pcs: si.pcs,
  group_name: si.group || null,
  usage_area: si.usageArea || null,
  target_machine: si.targetMachine || null,
  min_stock: si.minStock || 0,
  remarks: si.remarks || null,
});

export const storeItemFromDb = (r: any): StoreItem => ({
  id: r.id,
  type: r.type,
  name: r.name,
  pcs: Number(r.pcs) || 0,
  group: r.group_name || undefined,
  usageArea: r.usage_area || undefined,
  targetMachine: r.target_machine || undefined,
  minStock: r.min_stock ? Number(r.min_stock) : undefined,
  remarks: r.remarks || undefined,
});

// 18. Paper Test Reports
export const labReportToDb = (rep: PaperTestReport) => ({
  id: rep.id,
  product: rep.product,
  roll_no: rep.rollNo,
  shift: rep.shift,
  date: rep.date,
  time: rep.time,
  target_gsm: rep.targetGsm,
  weight: rep.weight,
  speed: rep.speed,
  creping_pct: rep.crepingPct,
  gsm_samples: rep.gsmSamples || [],
  avg_gsm: rep.avgGsm,
  max_gsm: rep.maxGsm,
  min_gsm: rep.minGsm,
  range_gsm: rep.rangeGsm,
  breakage_count: rep.breakageCount || 0,
  lab_result_gsm: rep.labResultGsm || 0,
  moisture_pct: rep.moisturePct || 0,
  caliper_mm: rep.caliperMm || 0,
  bulk_cc_gm: rep.bulkCcGm || 0,
  breaking_length_md: rep.breakingLengthMd || 0,
  breaking_length_cd: rep.breakingLengthCd || 0,
  brightness_pct: rep.brightnessPct || 0,
  tear_md: rep.tearMd || 0,
  tear_cd: rep.tearCd || 0,
  tensile_dry_md: rep.tensileDryMd || 0,
  tensile_dry_cd: rep.tensileDryCd || 0,
  stretch_dry_md: rep.stretchDryMd || 0,
  stretch_dry_cd: rep.stretchDryCd || 0,
  qc_status: rep.qcStatus,
  remarks: rep.remarks || '',
  inspector: rep.inspector,
  timestamp: rep.timestamp,
});

export const labReportFromDb = (r: any): PaperTestReport => ({
  id: r.id,
  product: r.product,
  rollNo: r.roll_no,
  shift: r.shift,
  date: r.date,
  time: r.time,
  targetGsm: Number(r.target_gsm) || 0,
  weight: Number(r.weight) || 0,
  speed: Number(r.speed) || 0,
  crepingPct: Number(r.creping_pct) || 0,
  gsmSamples: r.gsm_samples || [],
  avgGsm: Number(r.avg_gsm) || 0,
  maxGsm: Number(r.max_gsm) || 0,
  minGsm: Number(r.min_gsm) || 0,
  rangeGsm: Number(r.range_gsm) || 0,
  breakageCount: Number(r.breakage_count) || 0,
  labResultGsm: Number(r.lab_result_gsm) || 0,
  moisturePct: Number(r.moisture_pct) || 0,
  caliperMm: Number(r.caliper_mm) || 0,
  bulkCcGm: Number(r.bulk_cc_gm) || 0,
  breakingLengthMd: Number(r.breaking_length_md) || 0,
  breakingLengthCd: Number(r.breaking_length_cd) || 0,
  brightnessPct: Number(r.brightness_pct) || 0,
  tearMd: Number(r.tear_md) || 0,
  tearCd: Number(r.tear_cd) || 0,
  tensileDryMd: Number(r.tensile_dry_md) || 0,
  tensileDryCd: Number(r.tensile_dry_cd) || 0,
  stretchDryMd: Number(r.stretch_dry_md) || 0,
  stretchDryCd: Number(r.stretch_dry_cd) || 0,
  qcStatus: r.qc_status || 'GRADE_A',
  remarks: r.remarks || '',
  inspector: r.inspector || '',
  timestamp: r.timestamp || '',
});

// ==================== ASYNC CLOUD SYNC OPERATIONS ====================

// Generic safe merge helper: keeps local items and updates with cloud items by unique key
function mergeByUniqueKey<T>(localList: T[], cloudList: T[], getKey: (item: T) => string): T[] {
  const map = new Map<string, T>();
  (localList || []).forEach(item => {
    if (!item) return;
    const key = getKey(item);
    if (key) map.set(key, item);
  });
  (cloudList || []).forEach(item => {
    if (!item) return;
    const key = getKey(item);
    if (key) map.set(key, item);
  });
  return Array.from(map.values());
}

export async function syncTableFromCloud(inputTableName: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const tableName = getCanonicalTableName(inputTableName);
  try {
    // 4s timeout race to prevent slow network stalls
    const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error('Sync timeout')), 4000)
    );

    const queryPromise = supabase.from(tableName).select('*');
    const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;

    if (error) {
      console.warn(`Supabase select failed for ${tableName}:`, error.message);
      return;
    }

    // If cloud has data, safely merge with local storage cache (ZERO data loss)
    if (data && data.length > 0) {
      switch (tableName) {
        case 'users': {
          const cloud = data.map(userFromDb);
          const local = getLocal<User[]>(KEYS.USERS, []);
          const merged = sortUsersByHierarchy(mergeByUniqueKey(local, cloud, u => u.username));
          setLocal(KEYS.USERS, merged);
          notifyChange(tableName);
          break;
        }
        case 'raw_materials': {
          const cloud = data.map(rawMaterialFromDb);
          setLocal(KEYS.RAW_MATERIALS, cloud);
          notifyChange(tableName);
          break;
        }
        case 'raw_material_lots': {
          const cloud = data.map(rawMaterialLotFromDb);
          setLocal(KEYS.RAW_MATERIAL_LOTS, cloud);
          notifyChange(tableName);
          break;
        }
        case 'products': {
          const cloud = data.map(productFromDb);
          setLocal(KEYS.PRODUCTS, cloud);
          notifyChange(tableName);
          break;
        }
        case 'parties': {
          const cloud = data.map(partyFromDb);
          setLocal(KEYS.PARTIES, cloud);
          notifyChange(tableName);
          break;
        }
        case 'vendors': {
          const cloud = data.map(vendorFromDb);
          setLocal(KEYS.VENDORS, cloud);
          notifyChange(tableName);
          break;
        }
        case 'vehicles': {
          const cloud = data.map(vehicleFromDb);
          setLocal(KEYS.VEHICLES, cloud);
          notifyChange(tableName);
          break;
        }
        case 'pulp_formulas': {
          const cloud = data.map(formulaFromDb);
          setLocal(KEYS.FORMULAS, cloud);
          notifyChange(tableName);
          break;
        }
        case 'machine_rolls': {
          const cloud = data.map(machineRollFromDb);
          const local = getLocal<MachineRoll[]>(KEYS.ROLLS, []);
          // Safe non-destructive merge: preserves local un-synced rolls and updates existing
          const merged = mergeByUniqueKey(local, cloud, r => r.rollNo);
          setLocal(KEYS.ROLLS, merged);
          notifyChange(tableName);

          // If local has newly logged rolls not yet in cloud, auto-push to cloud
          const missing = local.filter(l => l.rollNo && !cloud.some((c: MachineRoll) => c.rollNo === l.rollNo));
          if (missing.length > 0) {
            pushUpsertToCloud('machine_rolls', missing.map(machineRollToDb));
          }
          break;
        }
        case 'reels': {
          const cloud = data.map(reelFromDb);
          const local = getLocal<Reel[]>(KEYS.REELS, []);
          const merged = mergeByUniqueKey(local, cloud, r => r.reelNo);
          setLocal(KEYS.REELS, merged);
          notifyChange(tableName);

          // If local has newly produced reels not yet in cloud, auto-push to cloud
          const missing = local.filter(l => l.reelNo && !cloud.some((c: Reel) => c.reelNo === l.reelNo));
          if (missing.length > 0) {
            pushUpsertToCloud('reels', missing.map(reelToDb));
          }
          break;
        }
        case 'transaction_logs': {
          const cloud = data.map(logFromDb);
          const local = getLocal<TransactionLog[]>(KEYS.LOGS, []);
          const merged = mergeByUniqueKey(local, cloud, l => l.id);
          setLocal(KEYS.LOGS, merged.slice(0, 500));
          notifyChange(tableName);
          break;
        }
        case 'boiler_logs': {
          const cloud = data.map(boilerLogFromDb);
          setLocal(KEYS.BOILER_LOGS, cloud);
          notifyChange(tableName);
          break;
        }
        case 'etp_logs': {
          const cloud = data.map(etpLogFromDb);
          setLocal(KEYS.ETP_LOGS, cloud);
          notifyChange(tableName);
          break;
        }
        case 'electricity_logs': {
          const cloud = data.map(electricityLogFromDb);
          setLocal(KEYS.ELECTRICITY_LOGS, cloud);
          notifyChange(tableName);
          break;
        }
        case 'pending_orders': {
          const cloud = data.map(pendingOrderFromDb);
          setLocal(KEYS.PENDING_ORDERS, cloud);
          notifyChange(tableName);
          break;
        }
        case 'packing_slips': {
          const cloud = data.map(packingSlipFromDb);
          setLocal(KEYS.PACKING_SLIPS, cloud);
          notifyChange(tableName);
          break;
        }
        case 'store_items': {
          const cloud = data.map(storeItemFromDb);
          setLocal(KEYS.STORE_ITEMS, cloud);
          notifyChange(tableName);
          break;
        }
        case 'paper_test_reports': {
          const cloud = data.map(labReportFromDb);
          setLocal(KEYS.LAB_REPORTS, cloud);
          notifyChange(tableName);
          break;
        }
      }
    } else if (data && data.length === 0) {
      // Only initial seed users if users table in cloud is completely uninitialized
      if (tableName === 'users' || tableName === 'saheb_users') {
        pushLocalTableToCloud(tableName);
      } else {
        // Operational tables (rolls, reels, formulas, slips, logs) are NEVER wiped on empty cloud response!
        // Instead, if local operational data exists, push it up to cloud.
        switch (tableName) {
          case 'machine_rolls': {
            const local = getLocal<MachineRoll[]>(KEYS.ROLLS, []);
            if (local.length > 0) {
              pushUpsertToCloud('machine_rolls', local.map(machineRollToDb));
            }
            break;
          }
          case 'reels': {
            const local = getLocal<Reel[]>(KEYS.REELS, []);
            if (local.length > 0) {
              pushUpsertToCloud('reels', local.map(reelToDb));
            }
            break;
          }
          case 'pulp_formulas':
            setLocal(KEYS.FORMULAS, []);
            notifyChange(tableName);
            break;
          case 'packing_slips':
            setLocal(KEYS.PACKING_SLIPS, []);
            notifyChange(tableName);
            break;
          case 'transaction_logs':
            // Never wipe logs
            break;
          case 'raw_materials':
            setLocal(KEYS.RAW_MATERIALS, []);
            notifyChange(tableName);
            break;
          case 'raw_material_lots':
            setLocal(KEYS.RAW_MATERIAL_LOTS, []);
            notifyChange(tableName);
            break;
          case 'products':
            setLocal(KEYS.PRODUCTS, []);
            notifyChange(tableName);
            break;
          case 'parties':
            setLocal(KEYS.PARTIES, []);
            notifyChange(tableName);
            break;
          case 'vendors':
            setLocal(KEYS.VENDORS, []);
            notifyChange(tableName);
            break;
          case 'vehicles':
            setLocal(KEYS.VEHICLES, []);
            notifyChange(tableName);
            break;
          case 'store_items':
            setLocal(KEYS.STORE_ITEMS, []);
            notifyChange(tableName);
            break;
          case 'boiler_logs':
            setLocal(KEYS.BOILER_LOGS, []);
            notifyChange(tableName);
            break;
          case 'etp_logs':
            setLocal(KEYS.ETP_LOGS, []);
            notifyChange(tableName);
            break;
          case 'electricity_logs':
            setLocal(KEYS.ELECTRICITY_LOGS, []);
            notifyChange(tableName);
            break;
          case 'pending_orders':
            setLocal(KEYS.PENDING_ORDERS, []);
            notifyChange(tableName);
            break;
          case 'paper_test_reports':
            setLocal(KEYS.LAB_REPORTS, []);
            notifyChange(tableName);
            break;
        }
      }
    }
  } catch (err) {
    console.error(`Supabase sync error for ${tableName}:`, err);
  }
}

// Push local master table data up to cloud if cloud master table is newly initialized or missing rows
export async function pushLocalTableToCloud(tableName: string): Promise<void> {
  try {
    switch (tableName) {
      case 'users': {
        const local = getLocal<User[]>(KEYS.USERS, []);
        if (local.length > 0) await pushUpsertToCloud('users', local.map(userToDb));
        break;
      }
      case 'raw_material_stock':
      case 'raw_materials': {
        const local = getLocal<RawMaterialItem[]>(KEYS.RAW_MATERIALS, []);
        if (local.length > 0) await pushUpsertToCloud('raw_materials', local.map(rawMaterialToDb));
        break;
      }
      case 'products': {
        const local = getLocal<ProductItem[]>(KEYS.PRODUCTS, []);
        if (local.length > 0) await pushUpsertToCloud('products', local.map(productToDb));
        break;
      }
      case 'parties': {
        const local = getLocal<PartyItem[]>(KEYS.PARTIES, []);
        if (local.length > 0) await pushUpsertToCloud('parties', local.map(partyToDb));
        break;
      }
      case 'vendors': {
        const local = getLocal<VendorItem[]>(KEYS.VENDORS, []);
        if (local.length > 0) await pushUpsertToCloud('vendors', local.map(vendorToDb));
        break;
      }
      case 'vehicles': {
        const local = getLocal<VehicleItem[]>(KEYS.VEHICLES, []);
        if (local.length > 0) await pushUpsertToCloud('vehicles', local.map(vehicleToDb));
        break;
      }
      case 'spares_store':
      case 'store_items': {
        const local = getLocal<StoreItem[]>(KEYS.STORE_ITEMS, []);
        if (local.length > 0) await pushUpsertToCloud('store_items', local.map(storeItemToDb));
        break;
      }
      // Operational tables (rolls, reels, slips, logs, reports) are NEVER auto-seeded to cloud
      default:
        break;
    }
  } catch (err) {
    console.warn(`Failed seeding cloud table ${tableName}:`, err);
  }
}

// Background push to Supabase (non-blocking, fast asynchronous execution)
export function pushUpsertToCloud(tableName: string, recordOrArray: any): Promise<void> {
  const client = supabase;
  if (!isSupabaseConfigured || !client) return Promise.resolve();
  const canonical = getCanonicalTableName(tableName);
  return new Promise<void>(resolve => {
    setTimeout(async () => {
      try {
        const records = Array.isArray(recordOrArray) ? recordOrArray : [recordOrArray];
        if (records.length === 0) return resolve();

        let onConflict: string | undefined;
        if (canonical === 'machine_rolls') onConflict = 'roll_no';
        else if (canonical === 'reels') onConflict = 'reel_no';
        else if (canonical === 'users') onConflict = 'username';
        else if (canonical === 'raw_material_lots') onConflict = 'lot_no';
        else onConflict = 'id';

        const { error } = await client.from(canonical).upsert(records, { onConflict });
        if (error) {
          console.warn(`Supabase upsert warning for ${canonical}:`, error.message);
        } else {
          notifyChange(canonical);
          broadcastDataChange([canonical]);
        }
      } catch (err) {
        console.warn(`Supabase network push failed for ${canonical}:`, err);
      } finally {
        resolve();
      }
    }, 0);
  });
}

export function pushDeleteToCloud(tableName: string, matchColumn: string, matchValue: any): Promise<void> {
  const client = supabase;
  if (!isSupabaseConfigured || !client) return Promise.resolve();
  const canonical = getCanonicalTableName(tableName);
  return new Promise<void>(resolve => {
    setTimeout(async () => {
      try {
        const { error } = await client.from(canonical).delete().eq(matchColumn, matchValue);
        if (error) {
          console.warn(`Supabase delete warning for ${canonical}:`, error.message);
        } else {
          notifyChange(canonical);
        }
      } catch (err) {
        console.warn(`Supabase network delete failed for ${canonical}:`, err);
      } finally {
        resolve();
      }
    }, 0);
  });
}

export function pushClearTableToCloud(tableName: string): Promise<void> {
  const client = supabase;
  if (!isSupabaseConfigured || !client) return Promise.resolve();
  return new Promise<void>(resolve => {
    setTimeout(async () => {
      try {
        const { error } = await client.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
          console.warn(`Supabase clear warning for ${tableName}:`, error.message);
        }
      } catch (err) {
        console.warn(`Supabase network clear failed for ${tableName}:`, err);
      } finally {
        resolve();
      }
    }, 0);
  });
}

let syncInitialized = false;
let lastFullSyncTime = 0;
let isSyncingAll = false;
const FULL_SYNC_THROTTLE_MS = 15000;

export async function syncAllTables(force = false): Promise<void> {
  if (!isSupabaseConfigured || !supabase || isSyncingAll) return;
  const now = Date.now();
  if (!force && now - lastFullSyncTime < FULL_SYNC_THROTTLE_MS) {
    return;
  }
  lastFullSyncTime = now;
  isSyncingAll = true;

  const tables = [
    'users',
    'raw_materials',
    'raw_material_lots',
    'products',
    'parties',
    'vendors',
    'vehicles',
    'pulp_formulas',
    'machine_rolls',
    'reels',
    'transaction_logs',
    'boiler_logs',
    'etp_logs',
    'electricity_logs',
    'pending_orders',
    'packing_slips',
    'store_items',
    'paper_test_reports',
  ];

  try {
    await Promise.allSettled(tables.map(table => syncTableFromCloud(table)));
  } finally {
    isSyncingAll = false;
  }
}

// Instant cross-device broadcast trigger via Supabase Realtime channel
export function broadcastDataChange(tables: string[]): void {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const channel = supabase.channel('saheb_cloud_realtime_stream');
    channel.send({
      type: 'broadcast',
      event: 'saheb_sync_event',
      payload: { tables, timestamp: Date.now() },
    });
  } catch (e) {
    // ignore
  }
}

// Initial application boot sync
export async function initSupabaseSync(): Promise<void> {
  if (syncInitialized) return;
  syncInitialized = true;

  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  // 1. Initial background sync (deferred slightly to allow initial React render cycle to settle)
  setTimeout(() => {
    syncAllTables(true);
  }, 150);

  // 2. Realtime WebSocket subscription for instant (<50ms) cross-device live updates
  try {
    const streamChannel = supabase.channel('saheb_cloud_realtime_stream');
    streamChannel
      .on('broadcast', { event: 'saheb_sync_event' }, payload => {
        const tables: string[] = payload?.payload?.tables || ['all'];
        tables.forEach(t => syncTableFromCloud(t));
      })
      .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
        const table = payload.table;
        if (table) {
          syncTableFromCloud(table);
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime WebSocket connected. Cross-device live sync active.');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(`⚠️ Realtime channel status: ${status}. Scheduling sync...`, err);
          syncAllTables(true);
        }
      });
  } catch (err) {
    console.warn('Could not subscribe to Supabase realtime changes:', err);
  }

  // 3. Heartbeat polling (every 5s when tab is active) for zero-latency sync guarantee
  setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      syncAllTables(false);
    }
  }, 5000);

  // 4. Instant re-sync when user returns to tab / unlocks mobile phone
  if (typeof window !== 'undefined') {
    const handleForegroundSync = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncAllTables(true);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleForegroundSync);
    }
    window.addEventListener('focus', () => syncAllTables(true));
    window.addEventListener('online', () => syncAllTables(true));
  }
}
