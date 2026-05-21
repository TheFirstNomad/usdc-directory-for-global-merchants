## Goal

Give you ready-to-paste Farcaster cast copy (and a few variants) so you can post manually from Warpcast. No Neynar, no scripts, no secrets.

## Plan

### Step 1 — Delete `scripts/cast-farcaster.ts`
You don't want auto-posting, so the Neynar script is dead weight. Remove it.

### Step 2 — Replace it with `scripts/farcaster-copy.md`
A plain Markdown file you can open in the Lovable file viewer and copy from. It will contain:

- **Main launch cast** (single post, ~320 chars, fits Warpcast limit) — targeted at agent builders, with the manifest + docs URLs Warpcast auto-embeds as cards.
- **Short variant** for the `/base` channel.
- **Thread version** (3 casts) for more reach: launch → how it works → call to action.
- **Reply-bait variant** ending with a question to trigger engagement.
- **Suggested channels** to post in: `/ai-agents`, `/base`, `/x402`, `/coinbase`, `/founders`.
- **Posting tips**: post the manifest URL on its own line so Warpcast renders the rich card; cast from a fid that has at least 1 channel follow so it shows up in /base.

### Step 3 — Update `scripts/broadcast-manifest.ts`
Remove the line that says "run cast-farcaster.ts" and replace it with "see scripts/farcaster-copy.md".

## Files touched
- delete `scripts/cast-farcaster.ts`
- new `scripts/farcaster-copy.md`
- edit `scripts/broadcast-manifest.ts` (one line)

## Out of scope
- Any API integration
- Posting on your behalf

Approve and I'll write the copy file and you can paste it into Warpcast in 30 seconds.
