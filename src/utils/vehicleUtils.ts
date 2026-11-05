/**
 * Indian Vehicle Registration Number Utilities
 *
 * Supports:
 * - Standard State Format: SS-DD-AA-NNNN (e.g., GJ-05-BX-4921, GJ-08-AU-1234, DL-01-C-1234, GJ-05-1234)
 * - Bharat Series Format: YY-BH-NNNN-AA (e.g., 22-BH-1234-AA)
 *
 * Provides progressive auto-formatting on user typing, backspace-safe handling, and validation.
 */

/**
 * Formats user input progressively into standard Indian Vehicle Registration Number format.
 */
export function formatIndianVehicleNo(val: string): string {
  if (!val) return '';
  const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return '';

  // Bharat Series: 2 digits + 'BH' + 4 digits + 1-2 letters (e.g. 22BH1234AA)
  if (/^\d{2}B/.test(clean)) {
    const yr = clean.slice(0, 2);
    const rest = clean.slice(2);
    if (!rest) return yr;
    const bhMatch = rest.match(/^(BH?)(.*)$/);
    if (bhMatch) {
      const bh = bhMatch[1];
      const afterBh = bhMatch[2];
      if (!afterBh) return val.endsWith('-') ? `${yr}-${bh}-` : `${yr}-${bh}`;
      const numMatch = afterBh.match(/^(\d{1,4})(.*)$/);
      if (numMatch) {
        const num = numMatch[1];
        const series = numMatch[2].replace(/[^A-Z]/g, '').slice(0, 2);
        return series
          ? `${yr}-${bh}-${num}-${series}`
          : val.endsWith('-')
          ? `${yr}-${bh}-${num}-`
          : `${yr}-${bh}-${num}`;
      }
      return `${yr}-${bh}-${afterBh.slice(0, 4)}`;
    }
  }

  // Standard Indian Vehicle: State(2 letters) - RTO(1-2 digits) - Series(0-3 letters) - Number(1-4 digits)
  // 1. State code: 2 uppercase letters
  let state = '';
  let idx = 0;
  while (idx < clean.length && idx < 2 && /[A-Z]/.test(clean[idx])) {
    state += clean[idx];
    idx++;
  }

  if (state.length === 0) {
    return clean.slice(0, 10);
  }

  if (idx >= clean.length) {
    return val.endsWith('-') && state.length === 2 ? `${state}-` : state;
  }

  // 2. RTO code: 1 to 2 digits
  let rto = '';
  while (idx < clean.length && rto.length < 2 && /[0-9]/.test(clean[idx])) {
    rto += clean[idx];
    idx++;
  }

  if (!rto) {
    return state;
  }

  if (idx >= clean.length) {
    return val.endsWith('-') && rto.length >= 1 ? `${state}-${rto}-` : `${state}-${rto}`;
  }

  // 3. Series letters: 0 to 3 letters
  let series = '';
  while (idx < clean.length && series.length < 3 && /[A-Z]/.test(clean[idx])) {
    series += clean[idx];
    idx++;
  }

  if (idx >= clean.length) {
    if (series) {
      return val.endsWith('-') ? `${state}-${rto}-${series}-` : `${state}-${rto}-${series}`;
    }
    return `${state}-${rto}`;
  }

  // 4. Vehicle number: 1 to 4 digits
  let num = '';
  while (idx < clean.length && num.length < 4 && /[0-9]/.test(clean[idx])) {
    num += clean[idx];
    idx++;
  }

  if (series) {
    return num ? `${state}-${rto}-${series}-${num}` : `${state}-${rto}-${series}`;
  } else {
    return num ? `${state}-${rto}-${num}` : `${state}-${rto}`;
  }
}

/**
 * Validates whether a vehicle registration string conforms to a complete Indian Vehicle format.
 */
export function isValidIndianVehicleNo(val: string): boolean {
  if (!val) return false;
  const s = val.trim().toUpperCase();
  const standardPattern = /^[A-Z]{2}-\d{1,2}(-[A-Z]{1,3})?-\d{1,4}$/;
  const bhPattern = /^\d{2}-BH-\d{4}-[A-Z]{1,2}$/;
  const cleanStandard = /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$/;
  const cleanBh = /^\d{2}BH\d{4}[A-Z]{1,2}$/;
  return standardPattern.test(s) || bhPattern.test(s) || cleanStandard.test(s) || cleanBh.test(s);
}

/**
 * Normalizes any vehicle number into the official hyphenated format.
 */
export function normalizeVehicleNo(val: string): string {
  return formatIndianVehicleNo(val);
}

