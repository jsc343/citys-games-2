# SDKLite Payments & Ads - AI Tutorial

## Overview

The SDK instance (`sdk`) is available via `usePiAuth()` after authentication. This document covers how to use it for purchases and ads. All methods below assume the user is already logged in. Per-user saved data is a separate, simpler API: see `lib/USER_STATE_USAGE.md`.

\`\`\`typescript
import { usePiAuth } from "@/contexts/pi-auth-context";

const { sdk } = usePiAuth();
\`\`\`

Convenience hooks are available in `lib/pi-payment.ts`: `usePurchase()` for everything about paid products (buy, balances, consume, restore) and `useAds()` for ads.

---

## Purchases

Use the App Studio product **slug** as the `productId` argument (e.g. `boost_x2`, `extra_life`). SDKLite creates a server-side offer, runs the Pi payment flow, and handles approve/complete automatically.

### Via Hook

\`\`\`typescript
import { usePurchase } from "@/lib/pi-payment";

function BuyButton({ productId }: { productId: string }) {
  const { makePurchase } = usePurchase();

  const handleBuy = async () => {
    try {
      const result = await makePurchase(productId);
      if (result.ok) {
        deliverReward(result.productId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "SDKLiteError") {
        const code = (error as { code?: string }).code;
        if (code === "product_not_found") showMessage("Item unavailable.");
        else if (code === "purchase_cancelled") showMessage("Purchase cancelled.");
        else showMessage("Purchase failed.");
      }
    }
  };

  return <button onClick={handleBuy}>Buy</button>;
}
\`\`\`

### Via SDK Directly

\`\`\`typescript
const { sdk } = usePiAuth();
const result = await sdk.makePurchase("boost_x2");
if (result.ok) {
  console.log(result.productId, result.paymentId, result.txid);
}
\`\`\`

### PurchaseResult

Returned on success from `makePurchase()`:

- `ok` (`true`) — always true on success
- `productId` (`string`) — the product slug that was purchased
- `paymentId` (`string`) — Pi payment identifier
- `txid` (`string`) — on-chain transaction ID

### Purchase Errors

`makePurchase()` throws `SDKLiteError` with a `code`:

- `product_not_found` — slug doesn't match any App Studio product (404 from backend). Show "Item unavailable" or hide the option.
- `purchase_cancelled` — user dismissed the Pi payment UI. No message needed, or show "Purchase cancelled."
- `purchase_error` — generic failure (auth, offer creation, approval, completion, or Pi SDK error). Show "Something went wrong. Please try again."

\`\`\`typescript
try {
  await sdk.makePurchase("boost_x2");
} catch (error) {
  if (error instanceof Error && error.name === "SDKLiteError") {
    switch ((error as { code?: string }).code) {
      case "product_not_found":
        // product unavailable
        break;
      case "purchase_cancelled":
        // user cancelled — no action needed
        break;
      case "purchase_error":
        // generic failure — prompt retry
        break;
    }
  }
}
\`\`\`

---

## Ads

Ads are not available in all environments. Always check `isAdNetworkSupported()` before showing ads. Both `showInterstitial()` and `showRewarded()` return `false` on failure and **do not throw**.

### Check Ad Support

\`\`\`typescript
const supported = await sdk.isAdNetworkSupported();
if (!supported) {
  // hide ad buttons or skip ad logic
}
\`\`\`

### Interstitial Ads

Full-screen ads shown between content. No reward is granted.

\`\`\`typescript
import { useAds } from "@/lib/pi-payment";

const { isAdNetworkSupported, showInterstitial } = useAds();

async function showBreakAd() {
  if (!(await isAdNetworkSupported())) return;
  const closed = await showInterstitial();
  if (closed) {
    // user closed the ad — continue app flow
  }
}
\`\`\`

Returns `true` if the ad was shown and closed normally, `false` otherwise.

### Rewarded Ads

User watches an ad in exchange for an in-app reward. Pass the product slug that represents the reward (must exist in App Studio product catalog).

\`\`\`typescript
import { useAds } from "@/lib/pi-payment";

const { isAdNetworkSupported, showRewarded } = useAds();

async function watchAdForReward() {
  if (!(await isAdNetworkSupported())) {
    showMessage("Ads not available.");
    return;
  }
  const rewarded = await showRewarded("extra_life");
  if (rewarded) {
    grantExtraLife();
    showMessage("Reward granted!");
  } else {
    showMessage("Could not verify reward. Try again.");
  }
}
\`\`\`

Returns `true` only when the backend confirms the reward was granted. SDKLite retries the verification up to 3 times (1 second apart) before returning `false`.

---

## Purchase Balances

Purchase balances come from SDKLite through the `usePurchase()` hook. All methods require the user to be logged in and throw plain `Error` on auth or backend failure.

### Restore Purchase Balances

Call on app load to get all unconsumed purchase quantities:

\`\`\`typescript
import { usePurchase } from "@/lib/pi-payment";

const { restore } = usePurchase();

async function onAppLoad() {
  const { purchases } = await restore();
  for (const p of purchases) {
    updateInventoryUI(p.productId, p.quantity);
  }
}
\`\`\`

Each item in `purchases`:
- `productId` (`string`) — the product slug
- `quantity` (`number`) — remaining unconsumed count

`restore()` accepts an optional `{ keys: string[] }` object (reserved for future use).

### Get Purchase Balances

Equivalent to `restore()` but named for clarity when fetching mid-session:

\`\`\`typescript
const { purchases } = usePurchase();
const { purchases: balances } = await purchases();
\`\`\`

### Consume a Purchase

Deduct from a purchase balance when the user spends a consumable item:

\`\`\`typescript
const { consume } = usePurchase();

async function useBoost() {
  const result = await consume("boost_x2");
  activateBoost();
  updateInventoryUI(result.productId, result.quantity);
}
\`\`\`

With explicit quantity:

\`\`\`typescript
const result = await consume("boost_x2", 3);
\`\`\`

Returns:
- `productId` (`string`) — the product slug
- `quantity` (`number`) — remaining balance after consumption

---

## Important Notes for AI

- **Use slugs as `productId`**: the parameter is called `productId` but the value is the App Studio product slug
- **Do not call Pi APIs or the backend directly**: SDKLite owns payments (`Pi.createPayment`) and ads (`Pi.Ads`); `pi` from `lib/pi.ts` owns login and user state. Never call `Pi.authenticate`, `Pi.createPayment` or backend URLs yourself
- **Purchases are server-validated**: amounts come from the product catalog, not client code. SDKLite creates a short-lived offer per purchase.
- **Ads never throw**: `showInterstitial()` and `showRewarded()` return `false` on failure
- **Balance methods throw plain Error**: `purchases()`, `consume()` and `restore()` throw plain `Error`, not `SDKLiteError`, on auth or backend failures
- **Always check ad support**: call `isAdNetworkSupported()` before `showInterstitial()` or `showRewarded()`
- **Restore on load**: call `state.restore()` or `state.purchases()` at app startup to sync purchase balances
