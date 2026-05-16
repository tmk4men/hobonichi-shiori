import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob';
import { isPremium, subscribePremium } from './premium';

// 本番モード（実広告）。テスト時は true に
const AD_IS_TESTING = false;
const BANNER_AD_ID = 'ca-app-pub-5634961953346923/6585900315';

let initialized = false;
let bannerVisible = false;
let wantVisible = false;

function isNative(): boolean {
  const p = Capacitor.getPlatform();
  return p === 'android' || p === 'ios';
}

async function ensureInit(): Promise<boolean> {
  if (!isNative()) return false;
  if (initialized) return true;
  try {
    await AdMob.initialize({
      initializeForTesting: AD_IS_TESTING,
    });
    initialized = true;
    return true;
  } catch (e) {
    console.warn('[AdMob] init失敗', e);
    return false;
  }
}

async function showBanner() {
  const ok = await ensureInit();
  if (!ok) return;
  if (bannerVisible) return;
  try {
    await AdMob.showBanner({
      adId: BANNER_AD_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: AD_IS_TESTING,
    });
    bannerVisible = true;
  } catch (e) {
    console.warn('[AdMob] banner表示失敗', e);
  }
}

async function hideBanner() {
  if (!isNative()) return;
  if (!bannerVisible) return;
  try {
    await AdMob.removeBanner();
  } catch (e) {
    console.warn('[AdMob] banner非表示失敗', e);
  }
  bannerVisible = false;
}

export async function initAds(): Promise<void> {
  if (!isNative()) return;
  await ensureInit();
  // プレミアム解除時にバナーを消す
  subscribePremium((premium) => {
    if (premium) hideBanner();
    else if (wantVisible) showBanner();
  });
}

export async function setBannerVisible(visible: boolean): Promise<void> {
  wantVisible = visible;
  if (!isNative()) return;
  if (isPremium()) {
    await hideBanner();
    return;
  }
  if (visible) await showBanner();
  else await hideBanner();
}
