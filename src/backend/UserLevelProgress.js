import { checkAndAwardTopicAchievement } from "@/backend/TopicAchievement";

export const EXERCISES_PER_LEVEL = 5;

/**
 * @typedef {"available" | "in_progress" | "completed"} LevelProgressStatus
 */

/**
 * @typedef {object} UserLevelProgress
 * @property {number} id
 * @property {number} user_id
 * @property {number} topic_id
 * @property {string} level
 * @property {number} completed_count
 * @property {number} is_completed
 * @property {string | null} completed_at
 */

/**
 * @typedef {object} LevelProgressInfo
 * @property {LevelProgressStatus} status
 * @property {number} completedCount
 * @property {number} totalCount
 */

async function getExpectedCountForLevel(db, topicId, level) {
  const row = await db.getFirstAsync(
    "SELECT COUNT(*) as total FROM exercises WHERE topic_id = ? AND level = ?",
    topicId,
    level,
  );
  return row?.total ?? 0;
}

export async function getLevelProgress(db, userId, topicId, level) {
  const row = await db.getFirstAsync(
    `SELECT * FROM user_level_progress
     WHERE user_id = ? AND topic_id = ? AND level = ?`,
    userId,
    topicId,
    level,
  );
  return row ?? null;
}

export async function getLevelProgressInfo(db, userId, topicId, level) {
  const row = await getLevelProgress(db, userId, topicId, level);
  const total = await getExpectedCountForLevel(db, topicId, level);
  if (!row || row.completed_count === 0) {
    return { status: "available", completedCount: 0, totalCount: total };
  }
  if (row.is_completed === 1) {
    return {
      status: "completed",
      completedCount: row.completed_count,
      totalCount: total,
    };
  }
  return {
    status: "in_progress",
    completedCount: row.completed_count,
    totalCount: total,
  };
}

export async function getAllLevelProgressForTopic(db, userId, topicId) {
  const levels = ["beginner", "intermediate", "advanced"];
  const result = {};
  for (const level of levels) {
    result[level] = await getLevelProgressInfo(db, userId, topicId, level);
  }
  return result;
}

export async function upsertLevelProgressAfterExercise(userId, topicId, level) {
  const { getDatabase } = await import("@/database/database");
  const db = await getDatabase();
  const expectedTotal = await getExpectedCountForLevel(db, topicId, level);
  const target = expectedTotal > 0 ? expectedTotal : EXERCISES_PER_LEVEL;

  const completedRow = await db.getFirstAsync(
    `SELECT COUNT(*) as completed
     FROM user_exercise_progress p
     JOIN exercises e ON p.exercise_id = e.exercise_id
     WHERE p.user_id = ?
       AND p.is_completed = 1
       AND e.topic_id = ?
       AND e.level = ?`,
    userId,
    topicId,
    level,
  );
  const completedCount = completedRow?.completed ?? 0;
  const isCompleted = completedCount >= target ? 1 : 0;
  const completedAt = isCompleted === 1 ? new Date().toISOString() : null;

  await db.runAsync(
    `INSERT INTO user_level_progress
       (user_id, topic_id, level, completed_count, is_completed, completed_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, topic_id, level) DO UPDATE SET
       completed_count = excluded.completed_count,
       is_completed = excluded.is_completed,
       completed_at = excluded.completed_at`,
    userId,
    topicId,
    level,
    completedCount,
    isCompleted,
    completedAt,
  );

  const row = await getLevelProgress(db, userId, topicId, level);
  const achievement = await checkAndAwardTopicAchievement(
    db,
    userId,
    topicId,
  );
  return { ...row, justAwarded: achievement.justAwarded };
}

export async function seedUserLevelProgress(db) {
  const existing = await db.getFirstAsync(
    "SELECT COUNT(*) as total FROM user_level_progress",
  );
  if ((existing?.total ?? 0) > 0) return;
  try {
    await db.runAsync(
      "INSERT INTO user_level_progress (user_id, topic_id, level, completed_count, is_completed) SELECT up.user_id, e.topic_id, e.level, 0, 0 FROM user_profiles up CROSS JOIN exercises e",
    );
  } catch {
    // UNIQUE(user_id, topic_id, level) may already have rows from a
    // previous partial import. Fall back to a row-by-row upsert so the
    // seed is idempotent and does not abort the whole import.
    const rows = await db.getAllAsync(
      "SELECT up.user_id, e.topic_id, e.level FROM user_profiles up CROSS JOIN exercises e",
    );
    for (const row of rows) {
      await db.runAsync(
        `INSERT INTO user_level_progress (user_id, topic_id, level, completed_count, is_completed)
         VALUES (?, ?, ?, 0, 0)
         ON CONFLICT(user_id, topic_id, level) DO NOTHING`,
        row.user_id,
        row.topic_id,
        row.level,
      );
    }
  }
}
