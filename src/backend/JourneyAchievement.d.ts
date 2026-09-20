export interface JourneyAchievement {
  id: number;
  user_id: number;
  journey_id: number;
  achieved_at: string;
}

export interface JourneyAchievementResult {
  justAwarded: boolean;
  achievement: JourneyAchievement | null;
}

export function getJourneyAchievement(
  db: any,
  userId: number,
  journeyId: number,
): Promise<JourneyAchievement | null>;

export function hasJourneyAchievement(
  db: any,
  userId: number,
  journeyId: number,
): Promise<boolean>;

export function getJourneyAchievementsByUserId(
  db: any,
  userId: number,
): Promise<JourneyAchievement[]>;

export function deleteJourneyAchievement(
  db: any,
  userId: number,
  journeyId: number,
): Promise<void>;

export function checkAndAwardJourneyAchievement(
  db: any,
  userId: number,
  journeyId: number,
): Promise<JourneyAchievementResult>;
