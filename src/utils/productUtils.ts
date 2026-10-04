/**
 * Product & Grade Utilities
 * Automatically handles Grade A / Grade B variants for products,
 * strips redundant suffixes like "(B Grade)", and builds composite keys.
 */

export const cleanProductName = (name?: string): string => {
  if (!name) return '';
  return name
    .replace(/\s*\((?:Grade\s*[AB]|[AB]\s*Grade)\)/gi, '')
    .replace(/\s*[-–]\s*(?:Grade\s*[AB]|[AB]\s*Grade)/gi, '')
    .replace(/\s+(?:Grade\s*[AB]|[AB]\s*Grade)$/gi, '')
    .trim();
};

export const detectProductGrade = (name?: string, qcGrade?: string, status?: string): 'A' | 'B' => {
  if (qcGrade === 'B' || status === 'IN_STOCK_B') return 'B';
  if (name && /(?:b\s*grade|grade\s*b)/i.test(name)) return 'B';
  return 'A';
};

export const makeProductSelectKey = (productName: string, grade: 'A' | 'B' = 'A'): string => {
  return `${cleanProductName(productName)}:::${grade}`;
};

export const parseProductSelectKey = (key: string): { product: string; grade: 'A' | 'B' } => {
  if (!key) return { product: '', grade: 'A' };
  if (key.includes(':::')) {
    const [prod, gr] = key.split(':::');
    return {
      product: cleanProductName(prod),
      grade: gr === 'B' ? 'B' : 'A',
    };
  }
  const grade = detectProductGrade(key);
  return {
    product: cleanProductName(key),
    grade,
  };
};
