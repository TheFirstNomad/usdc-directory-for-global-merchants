

## Problem

When no liquidity pool exists, the auto-fill logic in `handleAmountAChange` and `handleAmountBChange` clears the other token's input (sets it to `""`) because there's no price ratio (`priceAB` is null). This means:

1. User enters 250 USDC → EURC gets set to `""` 
2. `parsedB` evaluates to `0n`
3. Button disabled condition `parsedA <= 0n || parsedB <= 0n` keeps the button inactive

## Fix

**File: `src/components/swap/LiquidityPanel.tsx`**

Modify `handleAmountAChange` and `handleAmountBChange` so that when `priceAB` is null (no existing pool), they leave the other input untouched instead of clearing it. This lets users freely set both token amounts when creating a new pair.

Change in `handleAmountAChange` (~line 100-108):
- When `priceAB` exists and input > 0: auto-calculate amountB (existing behavior)
- When `priceAB` is null: do nothing to amountB (currently it sets `""`)

Same change in `handleAmountBChange` (~line 110-118).

This is a two-line fix — remove the `else { setAmountB(""); }` and `else { setAmountA(""); }` branches, or guard them with `if (priceAB)`.

