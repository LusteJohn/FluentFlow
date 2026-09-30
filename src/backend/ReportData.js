/**
 * ReportData.js
 * ---------------------------------------------------------------
 * Gathers all the data needed for the student PDF report:
 *   - Student profile info
 *   - Weekly progress (same query as homepage.tsx line chart)
 *   - Journey progress pie chart data (percent completed per journey)
 *   - Exercises section: journey name, topic name, exercise level,
 *     and whether the user's answer was correct/wrong
 */

import { getUserProfile } from "@/backend/UserProfile";
import { getAllJourneyProgressForUser, getAllJourneys } from "@/backend/Journey";
import { getWeeklyProgress, getUserExerciseProgressByUserAndExercise } from "@/backend/UserExerciseProgress";
import { getExercisesByTopicIdAndLevel } from "@/backend/TopicExercise";
import { getExerciseAnswersByExerciseId } from "@/backend/ExerciseAnswer";
import { getTopicsByJourneyId } from "@/backend/Topic";

/**
 * Build the full report payload for a user.
 * Returns an object with profile, weekly, journeys, and exercises sections.
 */
export async function buildReportData(db, userId) {
  // 1. Student profile info
  const profile = await getUserProfile(db);
  const fullName = [profile?.firstname, profile?.middlename, profile?.lastname, profile?.name_ext]
    .filter(Boolean)
    .join(" ") || "Student";

  // 2. Weekly progress (current week)
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Sunday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Saturday
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);
  const weeklyRows = await getWeeklyProgress(db, userId, weekStartStr, weekEndStr);

  // Build weekly chart data (same as homepage.tsx)
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const WEEK_DISPLAY_ORDER = [6, 0, 1, 2, 3, 4, 5]; // Sun first
  const dayMap = {};
  for (let i = 0; i < 7; i++) {
    dayMap[i] = { completed_count: 0, total_xp: 0 };
  }
  (weeklyRows ?? []).forEach((row) => {
    const dayNum = parseInt(row.day_of_week, 10);
    dayMap[dayNum] = {
      completed_count: row.completed_count ?? 0,
      total_xp: row.total_xp ?? 0,
    };
  });
  const weekly = WEEK_DISPLAY_ORDER.map((idx) => ({
    day: DAY_LABELS[idx],
    completedCount: dayMap[idx]?.completed_count ?? 0,
    xp: dayMap[idx]?.total_xp ?? 0,
  }));

  // 3. Journey progress (pie chart data)
  const journeys = await getAllJourneys(db);
  const journeyProgress = await getAllJourneyProgressForUser(db, userId);
  const journeyPieData = (journeys ?? []).map((j) => {
    const prog = journeyProgress[j.journey_id] ?? { percent: 0, totalExercises: 0, completedExercises: 0 };
    return {
      id: j.journey_id,
      title: j.title,
      percent: prog.percent,
      completed: prog.completedExercises,
      total: prog.totalExercises,
    };
  });

  // 4. Exercises section: journey name, topic name, exercise level, correct/wrong
  const exercisesSection = [];
  for (const journey of journeys ?? []) {
    const topics = await getTopicsByJourneyId(db, journey.journey_id);
    for (const topic of topics ?? []) {
      for (const level of ["beginner", "intermediate", "advanced"]) {
        const exercises = await getExercisesByTopicIdAndLevel(db, topic.topic_id, level);
        for (const exercise of exercises ?? []) {
          const progress = await getUserExerciseProgressByUserAndExercise(
            db,
            userId,
            exercise.exercise_id,
          );
          const answers = await getExerciseAnswersByExerciseId(db, exercise.exercise_id);
          const primaryAnswer = answers?.find((a) => a.is_primary === 1) ?? answers?.[0];
          const userAnswer = progress?.completed_at
            ? (primaryAnswer?.answer_text ?? "")
            : "";
          const isCorrect = progress?.is_completed === 1;
          exercisesSection.push({
            journeyTitle: journey.title,
            topicTitle: topic.title,
            level: level,
            exercisePrompt: exercise.prompt,
            userAnswer: userAnswer,
            isCorrect: isCorrect,
          });
        }
      }
    }
  }

  return {
    studentName: fullName,
    generatedAt: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    weekly,
    journeyPieData,
    exercisesSection,
  };
}