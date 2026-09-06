# Remove the Bridge feature

The bridge page and every link to it come out of the app, on all chains. Swap stays exactly as it is.

## What changes for visitors

- The "Bridge" item disappears from the top navigation.
- Visiting `/bridge` shows the normal "page not found" screen instead of a bridge form.
- Search engines and the AI-agent listing files no longer advertise a bridge page.
- Wording that mentioned "swap & bridge demos" on the payment panel becomes "swap demos".

## What stays

- Swap on Arc Testnet and Base — untouched.
- The Circle test-token faucet link is currently only on the bridge page; it will be dropped along with the page (say the word if you want it moved to the swap page instead).
- Business categories named "Bridge Apps" and "Bridge SDKs" in the directory stay — those describe listed companies, not our own feature.

## Technical steps

1. Delete `src/pages/Bridge.tsx`.
2. `src/App.tsx`: remove the lazy import and the `/bridge` route.
3. `src/components/Header.tsx`: remove the Bridge nav entry.
4. `src/lib/arcAppKit.ts`: remove `bridgeUsdc` and the bridge mention in the file header comment.
5. Sitemap sources: remove `/bridge` from `scripts/generate-sitemap.ts`, `supabase/functions/sitemap/index.ts` (redeploy the function), and `public/sitemap.xml`.
6. `public/llms.txt`: drop the Bridge line.
7. `src/components/ArcPaymentPanel.tsx`: update the copy to say swap demos only.
8. Verify the build is clean and the nav plus `/bridge` behave as described.
