

## Plan: Update Featured Listings Logos & Cap at 4

### Problem
The Featured Carousel currently shows an emoji icon (`logo_emoji`) instead of the actual logo image used in the main directory cards. The two components render logos inconsistently.

### Changes

**1. `src/components/FeaturedCarousel.tsx` — Use real logos like PartnerCard**

Replace the emoji `div` (lines 28-30) with an `<img>` tag using the same logo resolution logic from PartnerCard:
- Use `logo_url` if available, otherwise fall back to Clearbit logo URL
- On error, fall back to the USDC coin logo
- Match sizing to fit the featured card (e.g. `w-10 h-10 object-contain rounded-lg`)

**2. `src/components/FeaturedCarousel.tsx` — Cap displayed featured listings at 4**

After deduplication, slice to at most 4: `uniquePartners.slice(0, 4)`. This ensures no more than 4 are shown visually, while existing featured items remain until replaced.

### Technical Detail

Logo URL resolution (same as PartnerCard line 26-29):
```typescript
const logoUrl = p.logo_url && p.logo_url !== ""
  ? p.logo_url
  : `https://logo.clearbit.com/${p.website?.replace(/https?:\/\//, "").replace(/\/.*/, "") || p.name.toLowerCase().replace(/\s+/g, "") + ".com"}`;
```

The current 2 featured listings remain visible. When new ones are added, only the first 4 (by name A-Z) will display.

