USDC Directory design system and project constraints.

Primary: 210 79% 46% (#2775CA USDC Blue). Success: 162 100% 41% (#00D395 Circle Green).
Background: slate-50 light / slate-900 dark. Font: Inter.
DB tables: partners (public read), submissions (public insert). Data from Supabase.
Pages: / (directory), /about (USDC info), /submit (4-step multi-step form).
Dark mode toggle in Header. Glassmorphism nav. Framer Motion animations.
Card grid: 1 col mobile, 2 tablet, 3 desktop. Banner + overlapping logo pattern.
Cards support logo_url (img tag, object-contain) and fallback to logo_emoji.
Category pills in hero with emoji icons. Scrollbar-hide utility.
Networks filter: Ethereum, Base, Solana, Polygon, Arbitrum, Noble, Avalanche.
Map view toggle placeholder on Index page. Autocomplete in hero search.
Submit form: 4 steps (Basic Info, Payment/Chains, Global Presence, Verification).
Success state shows "We Accept USDC" badge download button.
CTA button text: "Add Your Business".
