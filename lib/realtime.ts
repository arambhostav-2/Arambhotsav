'use client';

// Realtime disabled to stay under free-tier 200 concurrent limit (was 216/200).
// Public pages use polling (15s) instead. Enable only if you upgrade.
// To re-enable, restore the createClient + channel logic.
export function subscribeLiveInventory(_onChange: () => void) {
  return () => {};
}
