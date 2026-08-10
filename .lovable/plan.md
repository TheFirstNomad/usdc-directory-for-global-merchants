# Fix intermittent "ERR_SSL_PROTOCOL_ERROR" on usdc.directory

## What's actually happening

The app and hosting are healthy. The problem is in your domain's DNS records.

`usdc.directory` currently resolves to **three different IP addresses**:

```text
185.158.133.1     <- Lovable hosting (correct, serves the site, HTTP 200)
44.232.173.249    <- stray record, TLS handshake fails
52.40.42.113      <- stray record (on www)
```

Browsers pick one of these at random. When they pick Lovable's IP the site loads
fine; when they pick one of the stray IPs there is no valid certificate, so
Chrome/Brave shows "This site can't provide a secure connection /
ERR_SSL_PROTOCOL_ERROR". This is why the site looks "down" sometimes and fine
other times — and why a reload often fixes it.

Verified just now:
- `https://usdc.directory` via 185.158.133.1 → HTTP 200
- `https://usdc.directory` via 44.232.173.249 → TLS connect failure (curl error 35)
- Both the apex and `www` have the extra records

The stray IPs belong to an old host/parking service (looks like a previous
site setup that was never cleaned up).

## The fix (DNS only — no code change)

This must be done at your DNS provider, since no code in the project can
influence which IPs the domain resolves to.

1. Open your DNS provider for `usdc.directory`.
2. Under the **A records** for `@` (root):
   - Delete the record pointing to `44.232.173.249`
   - Delete any other A record that is not `185.158.133.1`
   - Keep exactly one A record: `@ → 185.158.133.1`
3. Under the **A records** for `www`:
   - Delete `44.232.173.249` and `52.40.42.113`
   - Keep exactly one A record: `www → 185.158.133.1`
4. Leave the `_lovable` TXT verification record untouched.
5. Also remove any leftover ALIAS/ANAME/CNAME on the root that points at an old
   host — those can reintroduce the bad IPs.

If the domain was bought through Lovable, the records are editable in
Project Settings → Domains → ⋯ → Configure → Manage DNS records.

## After the change

- DNS caches clear within minutes to a few hours (TTL dependent).
- Lovable's certificate is already provisioned for the domain, so no
  re-verification is needed once only `185.158.133.1` remains.
- I'll re-check resolution and TLS for both `usdc.directory` and
  `www.usdc.directory` and confirm every returned IP serves a valid
  certificate, so the intermittent failure is gone for good.

## What I will do in the build step

There is nothing to change in the app for this. Approving this plan lets me:
- Re-run the DNS/TLS verification and report the exact remaining records.
- Confirm the site is consistently live on all resolved addresses.

If you'd like, I can also add a lightweight uptime check to the existing
deployment-status page so a future DNS regression surfaces immediately instead
of being reported by visitors.
