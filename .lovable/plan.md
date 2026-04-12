

## Add VITE_ARC_KIT_KEY to .env

### What needs to happen

1. **Update `.env`** — Add `VITE_ARC_KIT_KEY=KIT_KEY:0d00dda04082f989e0ca58a639c97cd5:54ceb72723ecb14061b2e263ae03fad1` to the existing `.env` file (which already has the Supabase variables)

2. **Verify `src/lib/arcAppKit.ts`** — Already correct. Line 17 reads `import.meta.env.VITE_ARC_KIT_KEY` with no hardcoded fallback. The runtime guard on lines 19-24 logs an error if the key is missing or malformed. No changes needed here.

### What's already done
- The hardcoded key was removed in the previous round of changes
- The runtime validation is already in place
- The code reads from `import.meta.env.VITE_ARC_KIT_KEY` correctly

### Single change
- Append `VITE_ARC_KIT_KEY=KIT_KEY:0d00dda04082f989e0ca58a639c97cd5:54ceb72723ecb14061b2e263ae03fad1` to `.env`

This will make Vite inject the key at build time so the frontend can access it.

