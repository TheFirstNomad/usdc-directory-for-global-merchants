# Finalize DNS cleanup and verify usdc.directory stability

## Current state (verified)

- `usdc.directory` now resolves to only `185.158.133.1` — the stray `44.232.173.249` and `52.40.42.113` A records are gone.
- `www.usdc.directory` resolves via a CNAME to the apex, ultimately landing on `185.158.133.1`.
- The intermittent `ERR_SSL_PROTOCOL_ERROR` should no longer occur because every resolved IP now serves a valid Lovable certificate.

## Optional cleanup

1. Replace the `www` CNAME with an A record
   - Current: `www CNAME usdc.directory.`
   - Recommended: `www A 185.158.133.1`
   - Reason: Lovable's custom-domain instructions specify A records for both `@` and `www`. A CNAME at `www` pointing to an apex that also carries MX/TXT records is technically allowed but less standard and can confuse some DNS tooling.

2. Remove stale `_acme_challenge` TXT records
   - Two `_acme_challenge` TXT entries are visible in the panel.
   - They are leftover verification tokens from a previous certificate provider and are no longer needed now that Lovable manages TLS.
   - They do not break the site, so this is cleanup only.

## Keep as-is

- `_lovable` TXT verification record — required by Lovable.
- Apex A record `@ → 185.158.133.1` — required.
- Zoho MX, SPF, DKIM (`zmail_domainkey`) records — required for email.
- Unstoppable verification TXT — required by the registrar.

## Verification after cleanup

1. Re-run DNS resolution checks for both apex and `www` to confirm only `185.158.133.1` is returned.
2. Test TLS handshake against every resolved IP for both hostnames.
3. Run an HTTP fetch to `https://usdc.directory` and `https://www.usdc.directory` to confirm 200 OK.
4. Report the final state back to the user.
