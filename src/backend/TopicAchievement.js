export async function getTopicAchievement(db, userId, topicId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM topic_achievements WHERE user_id = ? AND topic_id = ?",
    userId,
    topicId,
  );
  return result ?? null;
}
 
export async function hasTopicAchievement(db, userId, topicId) {
  const result = await getTopicAchievement(db, userId, topicId);
  return result != null;
}
 
export async function getTopicAchievementsByUserId(db, userId) {
  const result = await db.getAllAsync(
    "SELECT * FROM topic_achievements WHERE user_id = ? ORDER BY achieved_at DESC",
    userId,
  );
  return result;
}
 
async function createTopicAchievement(db, userId, topicId) {
  await db.runAsync(
    "INSERT INTO topic_achievements (user_id, topic_id) VALUES (?, ?)",
    userId,
    topicId,
  );
  return getTopicAchievement(db, userId, topicId);
}
 
export async function deleteTopicAchievement(db, userId, topicId) {
  await db.runAsync(
    "DELETE FROM topic_achievements WHERE user_id = ? AND topic_id = ?",
    userId,
    topicId,
  );
}
 
// Checks whether the user has correctly completed every exercise that
// belongs to this topic, and awards the achievement if they have and
// don't already hold it. Safe to call after every single exercise
// completion - it's a no-op once the achievement already exists.
//
// Returns { justAwarded: boolean, achievement: object | null }
// - justAwarded is true only the moment the achievement is newly earned,
//   which is your cue to show an "Achievement unlocked!" popup.
export async function checkAndAwardTopicAchievement(db, userId, topicId) {
  const existing = await getTopicAchievement(db, userId, topicId);
  if (existing) {
    return { justAwarded: false, achievement: existing };
  }
 
  const totalRow = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM exercises WHERE topic_id = ?",
    topicId,
  );
  const totalExercises = totalRow?.count ?? 0;
 
  const completedRow = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM user_exercise_progress uep " +
      "JOIN exercises e ON e.exercise_id = uep.exercise_id " +
      "WHERE e.topic_id = ? AND uep.user_id = ? AND uep.is_completed = 1",
    topicId,
    userId,
  );
  const completedExercises = completedRow?.count ?? 0;
 
  if (totalExercises > 0 && completedExercises === totalExercises) {
    const achievement = await createTopicAchievement(db, userId, topicId);
    return { justAwarded: true, achievement };
  }
 
  return { justAwarded: false, achievement: null };
}