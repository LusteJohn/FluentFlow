export interface TopicAchievement {
  id: number;
  user_id: number;
  topic_id: number;
  achieved_at: string;
}

export interface AchievementResult {
  justAwarded: boolean;
  achievement: TopicAchievement | null;
}

export function getTopicAchievement(
  db: any,
  userId: number,
  topicId: number,
): Promise<TopicAchievement | null>;

export function hasTopicAchievement(
  db: any,
  userId: number,
  topicId: number,
): Promise<boolean>;

export function getTopicAchievementsByUserId(
  db: any,
  userId: number,
): Promise<TopicAchievement[]>;

export function deleteTopicAchievement(
  db: any,
  userId: number,
  topicId: number,
): Promise<void>;

export function checkAndAwardTopicAchievement(
  db: any,
  userId: number,
  topicId: number,
): Promise<AchievementResult>;
