export interface CompletedTopicLevel {
  topic_id: number;
  topic_title: string;
  journey_id: number | null;
  journey_title: string | null;
  level: string;
  completed_count: number;
  is_completed: number;
  completed_at: string | null;
  topic_achieved_at: string | null;
}

export function getCompletedTopicLevels(
  db: any,
  userId: number,
): Promise<CompletedTopicLevel[]>;

export function resetTopicLevel(
  db: any,
  userId: number,
  topicId: number,
  level: string,
): Promise<number>;