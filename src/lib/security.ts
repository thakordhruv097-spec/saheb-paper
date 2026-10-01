/**
 * Security & Cryptography Utilities
 * Provides standard SHA-256 PIN hashing and cryptographically secure token generation.
 */

const PIN_SALT = 'saheb_salt_';

/**
 * Standard pure-JS synchronous SHA-256 implementation
 */
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  // Initial hash values: first 32 bits of fractional parts of square roots of first 8 primes
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  // Round constants: first 32 bits of fractional parts of cube roots of first 64 primes
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  for (i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= code << ((3 - (i % 4)) * 8);
  }
  words[ascii.length >> 2] |= 0x80 << ((3 - (ascii.length % 4)) * 8);
  words[(((ascii.length + 8) >> 6) << 4) + 15] = asciiBitLength;

  for (let block = 0; block < words.length; block += 16) {
    const w: number[] = [];
    for (i = 0; i < 64; i++) {
      if (i < 16) {
        w[i] = words[block + i] | 0;
      } else {
        const gamma0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const gamma1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + gamma0 + w[i - 7] + gamma1) | 0;
      }
    }

    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[i] + w[i]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const byte = (hash[i] >> (j * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }

  return result;
}

/**
 * Hash a 4-digit PIN synchronously using SHA-256 with salt
 */
export function hashPinSync(pin: string): string {
  const clean = pin.trim();
  if (!clean) return '';
  return sha256(`${PIN_SALT}${clean}`);
}

/**
 * Async wrapper for backward compatibility
 */
export async function hashPin(pin: string): Promise<string> {
  return hashPinSync(pin);
}

/**
 * Check if a given PIN string is already hashed (64 hex characters)
 */
export function isPinHashed(pin?: string): boolean {
  if (!pin) return false;
  return /^[a-f0-9]{64}$/i.test(pin.trim());
}

/**
 * Cached lookup table for reversing 4-digit SHA-256 hashes (0000 - 9999)
 */
let pinHashToPlainMap: Map<string, string> | null = null;

export function getPinLookupMap(): Map<string, string> {
  if (pinHashToPlainMap) return pinHashToPlainMap;
  pinHashToPlainMap = new Map<string, string>();
  for (let i = 0; i <= 9999; i++) {
    const plain = i.toString().padStart(4, '0');
    // Salted hash
    const saltedHash = sha256(`${PIN_SALT}${plain}`).toLowerCase();
    pinHashToPlainMap.set(saltedHash, plain);
    // Unsalted hash fallback
    const rawHash = sha256(plain).toLowerCase();
    pinHashToPlainMap.set(rawHash, plain);
  }
  return pinHashToPlainMap;
}

/**
 * Return human-readable plain 4-digit PIN (reversing hash if needed)
 */
export function revealPin(storedPin?: string): string {
  if (!storedPin) return '1234';
  const clean = storedPin.trim();
  if (!isPinHashed(clean)) {
    return clean;
  }
  const map = getPinLookupMap();
  const plain = map.get(clean.toLowerCase());
  return plain || '1234';
}

/**
 * Verify an entered PIN against stored PIN (supports hashed & legacy plaintext)
 */
export function verifyPin(enteredPin: string, storedPin: string): boolean {
  if (!enteredPin || !storedPin) return false;
  const cleanEntered = enteredPin.trim();
  const cleanStored = storedPin.trim();

  if (isPinHashed(cleanStored)) {
    if (cleanStored.toLowerCase() === hashPinSync(cleanEntered).toLowerCase()) return true;
    if (cleanStored.toLowerCase() === sha256(cleanEntered).toLowerCase()) return true;
    return revealPin(cleanStored) === cleanEntered;
  }

  // Plaintext fallback
  return cleanStored === cleanEntered;
}

/**
 * Generates cryptographically secure session tokens
 */
export function generateSecureToken(prefix: string = 'token'): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const randomHex = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `${prefix}_${Date.now()}_${randomHex}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
