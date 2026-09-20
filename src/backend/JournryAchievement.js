export async function getJourneyAchievement(db, userId, journeyId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM journey_achievements WHERE user_id = ? AND journey_id = ?",
    userId,
    journeyId,
  );
  return result ?? null;
}
 
export async function hasJourneyAchievement(db, userId, journeyId) {
  const result = await getJourneyAchievement(db, userId, journeyId);
  return result != null;
}
 
export async function getJourneyAchievementsByUserId(db, userId) {
  const result = await db.getAllAsync(
    "SELECT * FROM journey_achievements WHERE user_id = ? ORDER BY achieved_at DESC",
    userId,
  );
  return result;
}
 
async function createJourneyAchievement(db, userId, journeyId) {
  await db.runAsync(
    "INSERT INTO journey_achievements (user_id, journey_id) VALUES (?, ?)",
    userId,
    journeyId,
  );
  return getJourneyAchievement(db, userId, journeyId);
}
 
export async function deleteJourneyAchievement(db, userId, journeyId) {
  await db.runAsync(
    "DELETE FROM journey_achievements WHERE user_id = ? AND journey_id = ?",
    userId,
    journeyId,
  );
}
 
// Checks whether the user holds a topic_achievements row for every topic
// inside this journey, and awards the journey achievement if so. Call this
// right after checkAndAwardTopicAchievement returns justAwarded: true,
// passing the journey that topic belongs to.
export async function checkAndAwardJourneyAchievement(db, userId, journeyId) {
  const existing = await getJourneyAchievement(db, userId, journeyId);
  if (existing) {
    return { justAwarded: false, achievement: existing };
  }
 
  const totalRow = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM topics WHERE journey_id = ?",
    journeyId,
  );
  const totalTopics = totalRow?.count ?? 0;
 
  const achievedRow = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM topic_achievements ta " +
      "JOIN topics t ON t.topic_id = ta.topic_id " +
      "WHERE t.journey_id = ? AND ta.user_id = ?",
    journeyId,
    userId,
  );
  const achievedTopics = achievedRow?.count ?? 0;
 
  if (totalTopics > 0 && achievedTopics === totalTopics) {
    const achievement = await createJourneyAchievement(db, userId, journeyId);
    return { justAwarded: true, achievement };
  }
 
  return { justAwarded: false, achievement: null };
}