/**
 * Admin authentication via cryptographic wallet signature.
 * The client signs a fresh timestamped message for every admin request; the
 * server verifies the signature recovers to the expected owner wallet and
 * records the signature in a nonces table to reject replays.
 *
 * NOTE: Signatures are one-shot on the server. Do NOT cache them.
 */

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
  const timestamp = Date.now();
  const message = buildAdminMessage(timestamp);
  const signature = await signMessage({ message });

  return {
    "Content-Type": "application/json",
    "x-admin-address": address,
    "x-admin-timestamp": String(timestamp),
    "x-admin-signature": signature,
  };
}

/** Backwards-compat no-op (we no longer cache). */
export function clearAdminAuth() {
  /* nothing to clear */
}
