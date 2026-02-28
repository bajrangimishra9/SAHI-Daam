export function isValidPincode(pincode: string) {
  return /^\d{6}$/.test(pincode.trim());
}

// Deterministic, pincode-only distance approximation (placeholder until map integration)
export function approxKmBetweenPincodes(a: string, b: string) {
  const pa = parseInt(a, 10);
  const pb = parseInt(b, 10);
  if (!Number.isFinite(pa) || !Number.isFinite(pb)) return 9999;
  const diff = Math.abs(pa - pb);
  // Heuristic: 100 difference ≈ 10km, capped
  return Math.min(500, Math.round(diff / 10));
}
