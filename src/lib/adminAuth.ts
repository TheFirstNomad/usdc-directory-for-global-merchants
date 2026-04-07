/**
 * Admin authentication via cryptographic wallet signature.
 * The client signs a timestamped message; the server verifies the signature
 * recovers to the expected owner wallet address.
 */

// Cache the signature for 4 minutes (server allows 5-min window)
let cachedSig: { signature: string; timestamp: number } | null = null;
const SIG_TTL_MS = 4 * 60 * 1000;

export function buildAdminMessage(timestamp: number): string {
  return `USDC Directory Admin\nTimestamp: ${timestamp}`;
}

/**
 * Returns auth headers with a cryptographic signature proving wallet ownership.
 * Uses wagmi's signMessage under the hood (injected via callback).
 */
export async function getAdminAuthHeaders(
  address: string,
  signMessage: (args: any) => Promise<string>
): Promise<Record<string, string>> {
  const now = Date.now();

  // Reuse cached signature if still valid
  if (cachedSig && now - cachedSig.timestamp < SIG_TTL_MS) {
    return {
      "Content-Type": "application/json",
      "x-admin-address": address,
      "x-admin-timestamp": String(cachedSig.timestamp),
      "x-admin-signature": cachedSig.signature,
    };
  }

  const timestamp = now;
  const message = buildAdminMessage(timestamp);
  const signature = await signMessage({ message });

  cachedSig = { signature, timestamp };

  return {
    "Content-Type": "application/json",
    "x-admin-address": address,
    "x-admin-timestamp": String(timestamp),
    "x-admin-signature": signature,
  };
}

/** Clear cached signature (e.g. on disconnect) */
export function clearAdminAuth() {
  cachedSig = null;
}
