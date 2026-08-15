import { Platform } from "react-native";
import { ADS } from "@/constants/ads";

type AdsModule = typeof import("react-native-google-mobile-ads");

export interface RewardedHandlers {
  onOpen?: () => void;
  onClose?: () => void;
  onReward: () => void;
}

export interface InterstitialHandlers {
  onOpen?: () => void;
  onClose?: () => void;
}

let moduleRef: AdsModule | null | undefined;
let interstitial: any = null;
let rewarded: any = null;
let rewardedHandlers: RewardedHandlers | null = null;

function adsModule(): AdsModule | null {
  if (moduleRef !== undefined) return moduleRef;
  if (Platform.OS === "web") {
    moduleRef = null;
    return null;
  }
  try {
    moduleRef = require("react-native-google-mobile-ads") as AdsModule;
  } catch {
    moduleRef = null;
  }
  return moduleRef;
}

export function adsAvailable(): boolean {
  return adsModule() !== null;
}

export function initAds(): void {
  const m = adsModule();
  if (!m) return;
  try {
    m.MobileAds().initialize().catch(() => {});
  } catch {}
}

export function loadInterstitial(): void {
  const m = adsModule();
  if (!m || interstitial) return;
  try {
    const { InterstitialAd, AdEventType } = m;
    interstitial = InterstitialAd.createForAdRequest(ADS.interstitial);
    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitial?.load();
    });
    interstitial.load();
  } catch {}
}

export function showInterstitial(handlers?: InterstitialHandlers): boolean {
  const m = adsModule();
  if (!m) return false;
  if (!interstitial?.loaded) {
    loadInterstitial();
    return false;
  }
  try {
    const { AdEventType } = m;
    if (handlers?.onOpen) {
      interstitial.addAdEventListener(AdEventType.OPENED, handlers.onOpen);
    }
    if (handlers?.onClose) {
      interstitial.addAdEventListener(AdEventType.CLOSED, handlers.onClose);
    }
    interstitial.show().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export function loadRewardedAd(): void {
  const m = adsModule();
  if (!m || rewarded) return;
  try {
    const { RewardedAd, RewardedAdEventType, AdEventType } = m;
    rewarded = RewardedAd.createForAdRequest(ADS.rewarded);
    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardedHandlers?.onReward?.();
    });
    rewarded.addAdEventListener(AdEventType.OPENED, () => {
      rewardedHandlers?.onOpen?.();
    });
    rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedHandlers?.onClose?.();
      rewardedHandlers = null;
      rewarded?.load();
    });
    rewarded.load();
  } catch {}
}

export function showRewardedAd(handlers: RewardedHandlers): boolean {
  const m = adsModule();
  if (!m || !rewarded) return false;
  if (!rewarded.loaded) {
    try {
      rewarded.load();
    } catch {}
    return false;
  }
  try {
    rewardedHandlers = handlers;
    rewarded.show().catch(() => {});
    return true;
  } catch {
    rewardedHandlers = null;
    return false;
  }
}
