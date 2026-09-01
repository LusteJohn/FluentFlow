export const EXERCISES_PER_LEVEL = 5;

export type LevelProgressStatus = "available" | "in_progress" | "completed";

export interface UserLevelProgress {
  id: number;
  user_id: number;
  topic_id: number;
  level: string;
  completed_count: number;
  is_completed: number;
  completed_at: string | null;
}

export interface LevelProgressInfo {
  status: LevelProgressStatus;
  completedCount: number;
  totalCount: number;
}

export function getLevelProgress(
  db: any,
  userId: number,
  topicId: number,
  level: string,
): Promise<UserLevelProgress | null>;

export function getLevelProgressInfo(
  db: any,
  userId: number,
  topicId: number,
  level: string,
): Promise<LevelProgressInfo>;

export function getAllLevelProgressForTopic(
  db: any,
  userId: number,
  topicId: number,
): Promise<Record<string, LevelProgressInfo>>;

export function upsertLevelProgressAfterExercise(
  userId: number,
  topicId: number,
  level: string,
): Promise<UserLevelProgress | null>;

export function seedUserLevelProgress(db: any): Promise<void>;
