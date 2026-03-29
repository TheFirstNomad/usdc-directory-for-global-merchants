

## Plan: Add dark/light mode toggle + "Connect Wallet" button styling

### 1. Create ThemeProvider & useTheme hook
**New file: `src/components/ThemeProvider.tsx`**
- React context that reads/writes `localStorage` key `"theme"` and toggles the `dark` class on `<html>`
- Exports `useTheme()` returning `{ theme, setTheme, toggleTheme }`
- Defaults to dark mode (matching current site aesthetic)

### 2. Wrap app with ThemeProvider
**`src/App.tsx`** — Wrap the router with `<ThemeProvider>` inside Web3Provider

### 3. Update Header with theme toggle + wallet button
**`src/components/Header.tsx`**
- Add a Sun/Moon icon toggle button (from lucide-react) next to the wallet button
- Change "Sign In" button to **"Connect Wallet"** with a `Wallet` icon (from lucide-react) instead of `LogIn`, matching the reference image style
- Apply a subtle border + rounded style matching the reference (rounded-xl, border-border)
- When connected, show truncated address; when disconnected, show "Connect Wallet"
- Add the theme toggle to mobile menu as well

### 4. Visual details (matching reference image)
- "Connect Wallet" button: outlined style with wallet icon, similar prominence to reference
- Theme toggle: small icon button, Sun in light mode, Moon in dark mode
- Both buttons in the right section of the header, before "List Your Business"

