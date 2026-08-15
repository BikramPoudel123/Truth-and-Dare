export interface RewardedHandlers {
  onOpen?: () => void;
  onClose?: () => void;
  onReward: () => void;
}

export interface InterstitialHandlers {
  onOpen?: () => void;
  onClose?: () => void;
}

export function adsAvailable(): boolean {
  return false;
}

export function initAds(): void {}

export function loadInterstitial(): void {}

export function showInterstitial(_handlers?: InterstitialHandlers): boolean {
  return false;
}

export function loadRewardedAd(): void {}

export function showRewardedAd(_handlers: RewardedHandlers): boolean {
  return false;
}
