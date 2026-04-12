

## Fix: Make Kit Key Available to Frontend

### Problem
The Circle Kit Key (`VITE_ARC_KIT_KEY`) is needed by client-side code (`src/lib/arcAppKit.ts`) via `import.meta.env.VITE_ARC_KIT_KEY`. Cloud Secrets (runtime secrets) are only available to Edge Functions — they cannot be read by frontend code. That's why the system rejected the `VITE_` prefix.

### What you need to do (one manual step)

1. Go to your **Workspace Settings** (click your avatar/workspace name in the top-left of Lovable) → **Build Secrets**
2. Add a new build secret:
   - **Name**: `VITE_ARC_KIT_KEY`
   - **Value**: your Kit Key (starts with `KIT_KEY:0d00dda...`)
3. Save it

Build secrets are injected during the build process and picked up by Vite as `import.meta.env.VITE_ARC_KIT_KEY` — exactly what the code expects.

### What's already correct
- `ARC_TESTNET_INTEGRATION_API_KEYS` — correctly saved as a runtime secret for backend Edge Functions
- `ARC_KIT_KEY` (runtime secret) — you can keep it if any Edge Function needs it, or delete it since the frontend uses the build secret version

### What I will do after you add the build secret
- Verify the code references match (`VITE_ARC_KIT_KEY`)
- Update the Edge Functions that need the integration API key to reference `ARC_TESTNET_INTEGRATION_API_KEYS`
- Trigger a rebuild so the Kit Key is embedded in the frontend bundle
- No code changes needed for the Kit Key itself — `src/lib/arcAppKit.ts` already reads `import.meta.env.VITE_ARC_KIT_KEY` correctly

### Summary of your secrets setup

| Secret | Type | Used by |
|--------|------|---------|
| `VITE_ARC_KIT_KEY` | **Build Secret** (Workspace Settings) | Frontend — Circle App Kit SDK |
| `ARC_TESTNET_INTEGRATION_API_KEYS` | Runtime Secret (Cloud) | Edge Functions — backend API calls |
| `ARC_KIT_KEY` | Runtime Secret (Cloud) | Can delete — redundant unless an Edge Function needs it |

