const parseLocalFromISO = (iso) => {
  const match = iso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return new Date(iso);
  const [, year, month, day, hours, minutes, seconds] = match;
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hours, 10),
    parseInt(minutes, 10),
    parseInt(seconds, 10),
  );
};

const parseLocalDate = (localStr) => {
  const [datePart] = localStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export async function getWeeklyProgress(db, userId, startOfWeek, endOfWeek) {
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const start = parseLocalDate(startOfWeek);
  const end = parseLocalDate(endOfWeek);
  end.setDate(end.getDate() + 1);

  const result = await db.getAllAsync(
    `SELECT 
      strftime('%w', recorded_at) as day_of_week,
      COUNT(*) as completed_count,
      SUM(e.xp) as total_xp
     FROM user_exercise_progress p
     JOIN exercises e ON p.exercise_id = e.exercise_id
     WHERE p.user_id = ? 
       AND p.is_completed = 1
       AND p.recorded_at >= ?
       AND p.recorded_at < ?
     GROUP BY strftime('%w', recorded_at)
     ORDER BY day_of_week ASC`,
    userId,
    formatDate(start),
    formatDate(end),
  );
  return result;
}

export async function getWeeklyProgressDetails(db, userId, weekStart, weekEnd, dayIndex) {
  const dayOffset = dayIndex === 0 ? 6 : dayIndex - 1;
  const baseDate = parseLocalDate(weekStart);
  const dayStart = new Date(baseDate);
  dayStart.setDate(baseDate.getDate() + dayOffset);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayStart.getDate() + 1);
  dayEnd.setHours(0, 0, 0, 0);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const result = await db.getAllAsync(
    `SELECT 
      p.id,
      p.recorded_at,
      e.exercise_id,
      e.level,
      e.type,
      e.prompt as title,
      e.xp,
      COALESCE(t.topic_id, 0) as topic_id,
      COALESCE(t.title, 'Unknown Topic') as topic_title,
      COALESCE(t.grammar_focus, '') as grammar_focus
     FROM user_exercise_progress p
     JOIN exercises e ON p.exercise_id = e.exercise_id
     LEFT JOIN topics t ON e.topic_id = t.topic_id
     WHERE p.user_id = ? 
       AND p.is_completed = 1
       AND p.recorded_at >= ?
       AND p.recorded_at < ?
     ORDER BY p.recorded_at ASC`,
    userId,
    formatDate(dayStart),
    formatDate(dayEnd),
  );
  return result;
}

export async function getRecentCompletedExercises(db, userId, limit = 5, offset = 0) {
  const result = await db.getAllAsync(
    `SELECT 
      p.id,
      e.type,
      e.prompt as title,
      p.recorded_at,
      e.xp
     FROM user_exercise_progress p
     JOIN exercises e ON p.exercise_id = e.exercise_id
     WHERE p.user_id = ? AND p.is_completed = 1
     ORDER BY p.recorded_at DESC
     LIMIT ? OFFSET ?`,
    userId,
    limit,
    offset,
  );
  return result;
}

export async function getRecentCompletedExercisesCount(db, userId) {
  const result = await db.getFirstAsync(
    `SELECT COUNT(*) as total
     FROM user_exercise_progress p
     WHERE p.user_id = ? AND p.is_completed = 1`,
    userId,
  );
  return result?.total ?? 0;
}

export async function getTotalEarnedXP(db, userId) {
  const result = await db.getFirstAsync(
    `SELECT COALESCE(SUM(e.xp), 0) as total_xp
     FROM user_exercise_progress p
     JOIN exercises e ON p.exercise_id = e.exercise_id
     WHERE p.user_id = ? AND p.is_completed = 1`,
    userId,
  );
  return result?.total_xp ?? 0;
}

export async function createUserExerciseProgress(db, progress) {
  const result = await db.runAsync(
    "INSERT OR REPLACE INTO user_exercise_progress (user_id, exercise_id, is_completed, attempts_count, completed_at, recorded_at) VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))",
    progress.user_id,
    progress.exercise_id,
    progress.is_completed ? 1 : 0,
    progress.attempts_count ?? 0,
    progress.completed_at ?? null,
    progress.recorded_at ?? null,
  );
  if (result.changes < 1) throw new Error("Failed to create user exercise progress");
  return {
    id: result.lastInsertRowId,
    user_id: progress.user_id,
    exercise_id: progress.exercise_id,
    is_completed: progress.is_completed ? 1 : 0,
    attempts_count: progress.attempts_count ?? 0,
    completed_at: progress.completed_at ?? null,
    recorded_at: progress.recorded_at ?? null,
  };
}

export async function getUserExerciseProgressByUserAndExercise(db, userId, exerciseId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM user_exercise_progress WHERE user_id = ? AND exercise_id = ?",
    userId,
    exerciseId,
  );
  return result ?? null;
}

export async function getUserExerciseProgressByUserId(db, userId) {
  const result = await db.getAllAsync(
    "SELECT * FROM user_exercise_progress WHERE user_id = ? ORDER BY id ASC",
    userId,
  );
  return result;
}

export async function updateUserExerciseProgress(db, userId, exerciseId, updates) {
  const fields = [];
  const values = [];

  if (updates.is_completed !== undefined) {
    fields.push("is_completed = ?");
    values.push(updates.is_completed ? 1 : 0);
  }
  if (updates.attempts_count !== undefined) {
    fields.push("attempts_count = ?");
    values.push(updates.attempts_count);
  }
  if (updates.completed_at !== undefined) {
    fields.push("completed_at = ?");
    values.push(updates.completed_at);
  }
  if (updates.recorded_at !== undefined) {
    fields.push("recorded_at = ?");
    values.push(updates.recorded_at);
  }

  if (fields.length === 0) {
    return getUserExerciseProgressByUserAndExercise(db, userId, exerciseId);
  }

  values.push(userId, exerciseId);
  await db.runAsync(
    `UPDATE user_exercise_progress SET ${fields.join(", ")} WHERE user_id = ? AND exercise_id = ?`,
    ...values,
  );
  return getUserExerciseProgressByUserAndExercise(db, userId, exerciseId);
}

export async function deleteUserExerciseProgress(db, userId, exerciseId) {
  await db.runAsync(
    "DELETE FROM user_exercise_progress WHERE user_id = ? AND exercise_id = ?",
    userId,
    exerciseId,
  );
}

export async function seedUserExerciseProgress(db) {
  const existing = await db.getFirstAsync("SELECT COUNT(*) as count FROM user_exercise_progress");
  if ((existing?.count ?? 0) > 0) return;
}
