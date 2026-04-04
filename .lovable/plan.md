

# Replace Old Logo with New usdc-directory-logo.png

## Changes

Replace every occurrence of `Circle_USDC_Logo.svg` with `/usdc-directory-logo.png` across 7 files:

### 1. `src/components/Header.tsx`
- Change logo `src` to `/usdc-directory-logo.png`
- Update sizing from `h-8 w-8` to `h-9` (auto width for PNG aspect ratio)
- Add hover effect: `hover:scale-105 transition-transform`

### 2. `src/components/Footer.tsx`
- Change logo `src` to `/usdc-directory-logo.png`
- Adjust sizing to `h-9` (remove fixed w-9)

### 3. `index.html`
- Update favicon `href` to `/usdc-directory-logo.png` and change `type` to `image/png`
- Update JSON-LD `logo` URL to `https://usdc.directory/usdc-directory-logo.png`

### 4. `src/components/Web3Provider.tsx`
- Update `icons` array to `["/usdc-directory-logo.png"]`

### 5. `src/components/PaymentModal.tsx`
- Update logo `src` to `/usdc-directory-logo.png`

### 6. `src/pages/Submit.tsx`
- Update logo `src` to `/usdc-directory-logo.png`

### 7. `src/pages/EditListing.tsx`
- Update logo `src` to `/usdc-directory-logo.png`

All changes are simple string replacements. The old SVG file remains in `/public/` (not deleted) to avoid breaking any external links.

