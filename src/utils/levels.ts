export const XP_PER_LEVEL = 100;
export const GAMES_PER_LEVEL = 10;
export const XP_PER_GAME = XP_PER_LEVEL / GAMES_PER_LEVEL;

export function getLevel(gamesPlayed: number): number {
  return Math.max(1, Math.floor(gamesPlayed / GAMES_PER_LEVEL) + 1);
}

export function getLevelProgress(gamesPlayed: number): { current: number; needed: number; progress: number; level: number } {
  const level = getLevel(gamesPlayed);
  const current = (gamesPlayed % GAMES_PER_LEVEL) * XP_PER_GAME;
  return { current, needed: XP_PER_LEVEL, progress: current / XP_PER_LEVEL, level };
}
