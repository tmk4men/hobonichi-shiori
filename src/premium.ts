import { useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

export const PREMIUM_PRODUCT_ID = 'premium_unlock';
const KEY = 'hobonichi.premium.v1';

type Listener = (premium: boolean) => void;
const listeners = new Set<Listener>();

let cached: boolean = (() => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();

function setCached(v: boolean) {
  if (cached === v) return;
  cached = v;
  try {
    if (v) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
  listeners.forEach((fn) => fn(v));
}

export function isPremium(): boolean {
  return cached;
}

export function subscribePremium(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function usePremium(): boolean {
  return useSyncExternalStore(
    (cb) => subscribePremium(cb),
    () => cached,
    () => cached,
  );
}

function isNative(): boolean {
  return Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios';
}

async function isPurchasedNatively(): Promise<boolean> {
  try {
    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.INAPP,
    });
    const target = purchases.find((p) => p.productIdentifier === PREMIUM_PRODUCT_ID);
    if (!target) return false;
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      const state = String(
        (target as { purchaseState?: unknown }).purchaseState ?? '',
      ).toUpperCase();
      if (state === 'PENDING' || state === '2') return false;
      return true;
    }
    return Boolean(target.receipt ?? target.transactionId);
  } catch {
    return false;
  }
}

export async function syncPremium(): Promise<boolean> {
  if (!isNative()) return cached;
  const owned = await isPurchasedNatively();
  if (owned && !cached) setCached(true);
  return cached;
}

export interface PremiumProductInfo {
  price?: string;
  title?: string;
  description?: string;
}

export async function fetchProductInfo(): Promise<PremiumProductInfo | null> {
  if (!isNative()) return null;
  try {
    const { product } = await NativePurchases.getProduct({
      productIdentifier: PREMIUM_PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
    });
    return {
      price: product?.priceString,
      title: product?.title,
      description: product?.description,
    };
  } catch {
    return null;
  }
}

export type PurchaseOutcome =
  | { ok: true }
  | { ok: false; reason: 'cancelled' | 'unsupported' | 'error'; message?: string };

interface PurchaseProductResult {
  transactionId?: string;
  purchaseToken?: string;
  receipt?: string;
  productIdentifier?: string;
}

export async function purchasePremium(): Promise<PurchaseOutcome> {
  if (!isNative()) {
    return { ok: false, reason: 'unsupported', message: 'アプリ版でのみ購入できます' };
  }
  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) {
      return { ok: false, reason: 'unsupported', message: 'この端末では購入機能を利用できません' };
    }
    const result = (await NativePurchases.purchaseProduct({
      productIdentifier: PREMIUM_PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1,
    })) as PurchaseProductResult | undefined;

    const hasReceipt = Boolean(
      result?.transactionId ?? result?.purchaseToken ?? result?.receipt,
    );
    if (hasReceipt) {
      setCached(true);
      return { ok: true };
    }

    if (await isPurchasedNatively()) {
      setCached(true);
      return { ok: true };
    }

    return { ok: false, reason: 'error', message: '購入処理が完了しませんでした' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/cancel/i.test(msg) || /USER_CANCELED|\b1\b/.test(msg)) {
      return { ok: false, reason: 'cancelled' };
    }
    if (await isPurchasedNatively()) {
      setCached(true);
      return { ok: true };
    }
    return { ok: false, reason: 'error', message: msg };
  }
}

export async function restorePremium(): Promise<PurchaseOutcome> {
  if (!isNative()) {
    return { ok: false, reason: 'unsupported', message: 'アプリ版でのみ復元できます' };
  }
  try {
    await NativePurchases.restorePurchases();
    const owned = await isPurchasedNatively();
    if (owned) {
      setCached(true);
      return { ok: true };
    }
    return { ok: false, reason: 'error', message: '購入履歴が見つかりませんでした' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: 'error', message: msg };
  }
}

// 開発時にWebで動作確認するための隠し関数
export function __debugSetPremium(v: boolean) {
  if (import.meta.env.PROD && isNative()) return;
  setCached(v);
}
