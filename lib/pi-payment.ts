"use client";

import { usePiAuth } from "@/contexts/pi-auth-context";
import type {
  ConsumeResponse,
  PurchaseResult,
  PurchasesResponse,
  RestoreOptions,
  SDKLiteError,
  UserPurchaseBalance,
  UserStateRecord,
} from "@/lib/sdklite-types";

export type {
  ConsumeResponse,
  PurchaseResult,
  PurchasesResponse,
  RestoreOptions,
  SDKLiteError,
  UserPurchaseBalance,
  UserStateRecord,
};

/**
 * Everything about paid products in one hook: buy, read balances, consume, restore.
 * All of it is served by SDKLite. For per-user saved data use `pi.userState` from lib/pi.ts.
 */
export function usePurchase() {
  const { sdk } = usePiAuth();

  const makePurchase = async (productId: string): Promise<PurchaseResult> => {
    if (!sdk) throw new Error("SDK not initialized");
    return sdk.makePurchase(productId);
  };

  const purchases = async (): Promise<PurchasesResponse> => {
    if (!sdk) throw new Error("SDK not initialized");
    return sdk.state.purchases();
  };

  const consume = async (
    productId: string,
    quantity?: number
  ): Promise<ConsumeResponse> => {
    if (!sdk) throw new Error("SDK not initialized");
    return sdk.state.consume(productId, quantity);
  };

  const restore = async (
    options?: RestoreOptions
  ): Promise<PurchasesResponse> => {
    if (!sdk) throw new Error("SDK not initialized");
    return sdk.state.restore(options);
  };

  return { makePurchase, purchases, consume, restore };
}

export function useAds() {
  const { sdk } = usePiAuth();

  const isAdNetworkSupported = async (): Promise<boolean> => {
    if (!sdk) return false;
    return sdk.isAdNetworkSupported();
  };

  const showInterstitial = async (): Promise<boolean> => {
    if (!sdk) return false;
    return sdk.showInterstitial();
  };

  const showRewarded = async (productId: string): Promise<boolean> => {
    if (!sdk) return false;
    return sdk.showRewarded(productId);
  };

  return { isAdNetworkSupported, showInterstitial, showRewarded };
}
