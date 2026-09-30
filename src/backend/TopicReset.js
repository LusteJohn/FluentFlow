/**
 * TopicReset.js
 * ---------------------------------------------------------------
 * Provides a "reset topic level" operation that wipes every user row
 * tied to a specific (user, topic, level) combination, then re-seeds
 * the user_level_progress row so the student can start that level
 * from scratch.
 *
 * Tables touched (all scoped to the current user + topic + level):
 *   - exercise_answers        (via exercises for this topic/level)
 *   - user_exercise_progress (user + exercise for this topic/level)
 *   - user_level_progress    (user + topic + level)
 *   - topic_achievements     (user + topic)  -- removed so it can be
 *                                              re-earned after the reset
 *   - journey_achievements   (user + journey) -- removed if the journey
 *                                              no longer has any topic
 *                                              achievements left
 */

import { getExercisesByTopicIdAndLevel } from "@/backend/TopicExercise";
import { getJourneyByTopicId } from "@/backend/Topic";

/**
 * Returns every (topic, level) pair the user has completed, joined with
 * the topic_achievement row (if any) so the Settings UI can list them.
 */
export async function getCompletedTopicLevels(db, userId) {
  const rows = await db.getAllAsync(
    `SELECT
        t.topic_id,
        t.title      AS topic_title,
        t.journey_id,
        j.title      AS journey_title,
        ulp.level,
        ulp.completed_count,
        ulp.is_completed,
        ulp.completed_at,
        ta.achieved_at AS topic_achieved_at
     FROM user_level_progress ulp
     JOIN topics t      ON t.topic_id = ulp.topic_id
     LEFT JOIN journeys j ON j.journey_id = t.journey_id
     LEFT JOIN topic_achievements ta
            ON ta.user_id = ulp.user_id AND ta.topic_id = ulp.topic_id
     WHERE ulp.user_id = ? AND ulp.is_completed = 1
     ORDER BY j.order_index ASC, t.order_index ASC, ulp.level ASC`,
    userId,
  );
  return rows ?? [];
}

/**
 * Wipes every user row tied to (user_id, topic_id, level) and re-seeds
 * user_level_progress so the student can start that level fresh.
 *
 * Returns the number of exercise_progress rows deleted.
 */
export async function resetTopicLevel(db, userId, topicId, level) {
  // 1. Find every exercise for this topic + level so we can scope the
  //    deletes precisely (exercise_answers and user_exercise_progress
  //    both reference exercise_id, not topic_id/level directly).
  const exercises = await getExercisesByTopicIdAndLevel(db, topicId, level);
  const exerciseIds = exercises.map((e) => e.exercise_id);

  let deletedProgress = 0;

  if (exerciseIds.length > 0) {
    // Build a placeholder list for the IN clause.
    const placeholders = exerciseIds.map(() => "?").join(", ");

    // 2. Delete user_exercise_progress rows for these exercises.
    const progressResult = await db.runAsync(
      `DELETE FROM user_exercise_progress
       WHERE user_id = ? AND exercise_id IN (${placeholders})`,
      userId,
      ...exerciseIds,
    );
    deletedProgress = progressResult.changes ?? 0;

    // 3. Delete exercise_answers rows for these exercises.
    await db.runAsync(
      `DELETE FROM exercise_answers
       WHERE exercise_id IN (${placeholders})`,
      ...exerciseIds,
    );
  }

  // 4. Reset the user_level_progress row for this (user, topic, level).
  await db.runAsync(
    `INSERT INTO user_level_progress
       (user_id, topic_id, level, completed_count, is_completed, completed_at)
     VALUES (?, ?, ?, 0, 0, NULL)
     ON CONFLICT(user_id, topic_id, level) DO UPDATE SET
       completed_count = 0,
       is_completed   = 0,
       completed_at   = NULL`,
    userId,
    topicId,
    level,
  );

  // 5. Remove the topic_achievement so it can be re-earned.
  await db.runAsync(
    "DELETE FROM topic_achievements WHERE user_id = ? AND topic_id = ?",
    userId,
    topicId,
  );

  // 6. Clean up journey_achievements: if the journey no longer has ANY
  //    topic_achievements left for this user, remove the journey
  //    achievement too (it will be re-awarded when the user completes
  //    every topic again).
  const journey = await getJourneyByTopicId(db, topicId);
  if (journey?.journey_id) {
    const remaining = await db.getFirstAsync(
      "SELECT COUNT(*) as count FROM topic_achievements ta " +
        "JOIN topics t ON t.topic_id = ta.topic_id " +
        "WHERE ta.user_id = ? AND t.journey_id = ?",
      userId,
      journey.journey_id,
    );
    if ((remaining?.count ?? 0) === 0) {
      await db.runAsync(
        "DELETE FROM journey_achievements WHERE user_id = ? AND journey_id = ?",
        userId,
        journey.journey_id,
      );
    }
  }

  return deletedProgress;
}