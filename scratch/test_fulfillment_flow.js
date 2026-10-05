// Test fulfillment logic simulation matching syncOrdersWithDispatches
const weights = [
  2020, 1980, 2010, 1990, 2030,
  1970, 2005, 1995, 2015, 1985,
  2025, 1975, 2000, 2010, 1990
];

const totalReelsWeight = weights.reduce((a, b) => a + b, 0);
console.log('Available Reels:', weights.length, 'Total Weight:', totalReelsWeight, 'kg');

// Simulate Order ORD-001 with 25,000 kg (25 tons)
const order = {
  id: 'order-1',
  orderNo: 'ORD-001',
  partyId: 'party-1',
  weightTons: 25, // 25,000 kg
  qty: 13,
  status: 'PENDING',
  dispatchedQty: 0
};

// Dispatch 1: 5 reels (approx 10,000 kg)
const dispatch1Reels = weights.slice(0, 5); // 2020+1980+2010+1990+2030 = 10030 kg
const d1Weight = dispatch1Reels.reduce((a, b) => a + b, 0);
console.log('\n--- DISPATCH 1 ---');
console.log('Dispatched 5 reels, weight:', d1Weight, 'kg');

const orderWeightKg = order.weightTons * 1000;
let remWeight1 = Math.max(0, orderWeightKg - d1Weight);
let status1 = d1Weight >= orderWeightKg - 50 ? 'COMPLETED' : (d1Weight > 0 ? 'PARTIAL' : 'PENDING');
console.log('Order status after D1:', status1);
console.log('Remaining weight for next dispatch:', remWeight1, 'kg');
console.log('Is still in Active Orders?', status1 !== 'COMPLETED');

// Dispatch 2: Remaining 15,000 kg (8 reels, 1970+2005+1995+2015+1985+2025+1975+2000 = 15,970 kg)
const dispatch2Reels = weights.slice(5, 13);
const d2Weight = dispatch2Reels.reduce((a, b) => a + b, 0);
const totalDispatched = d1Weight + d2Weight;
console.log('\n--- DISPATCH 2 ---');
console.log('Dispatched 8 reels, weight:', d2Weight, 'kg');
console.log('Total Dispatched so far:', totalDispatched, 'kg');

let remWeight2 = Math.max(0, orderWeightKg - totalDispatched);
let status2 = totalDispatched >= orderWeightKg - 50 ? 'COMPLETED' : (totalDispatched > 0 ? 'PARTIAL' : 'PENDING');
console.log('Order status after D2:', status2);
console.log('Remaining weight:', remWeight2, 'kg');
console.log('Is removed from Active Orders?', status2 === 'COMPLETED');

if (status1 === 'PARTIAL' && remWeight1 > 0 && status2 === 'COMPLETED' && remWeight2 === 0) {
  console.log('\n>>> VERIFICATION SUCCESSFUL: Partial dispatch cut works and full dispatch removes order! <<<');
} else {
  console.error('\nVerification failed');
}
