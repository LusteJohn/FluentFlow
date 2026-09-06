const parseStoredDateTime = (stored) => {
  if (stored instanceof Date) {
    return Number.isNaN(stored.getTime()) ? null : stored;
  }
  if (typeof stored === "number") {
    const date = new Date(stored);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const raw = String(stored ?? "");
  if (!raw) return null;
  if (/^\d+$/.test(raw)) {
    const date = new Date(Number(raw));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (raw.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) {
    return new Date(raw.replace(" ", "T") + "Z");
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(raw)) {
    return new Date(raw + "Z");
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getManilaDateKey = (stored) => {
  const date = parseStoredDateTime(stored);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const getProgressDateKey = (row) =>
  getManilaDateKey(row.recorded_at ?? row.completed_at);

const addDaysToDateKey = (dateKey, days) => {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const getCompletedProgressRows = async (db, userId) =>
  db.getAllAsync(
    `SELECT
      p.id,
      p.recorded_at,
      p.completed_at,
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
     WHERE p.user_id = ? AND p.is_completed = 1
     ORDER BY p.recorded_at ASC`,
    userId,
  );

export async function getWeeklyProgress(db, userId, startOfWeek, endOfWeek) {
  const startKey = startOfWeek.slice(0, 10);
  const endKey = endOfWeek.slice(0, 10);
  const rows = (await getCompletedProgressRows(db, userId)).filter((row) => {
    const dateKey = getProgressDateKey(row);
    return dateKey && dateKey >= startKey && dateKey <= endKey;
  });

  const dayMap = {};
  for (let i = 0; i < 7; i++) {
    dayMap[i] = { day_of_week: String(i), completed_count: 0, total_xp: 0 };
  }

  for (const row of rows ?? []) {
    const dateKey = getProgressDateKey(row);
    if (!dateKey) continue;
    const dayNum = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
    dayMap[dayNum].completed_count += 1;
    dayMap[dayNum].total_xp += Number(row.xp ?? 0);
  }

  return Object.values(dayMap);
}

export async function getWeeklyProgressDetails(db, userId, weekStart, weekEnd, dayIndex) {
  const dayOffset = dayIndex === 0 ? 6 : dayIndex - 1;
  const targetDateKey = addDaysToDateKey(weekStart.slice(0, 10), dayOffset);
  const rows = await getCompletedProgressRows(db, userId);
  return rows.filter((row) => getProgressDateKey(row) === targetDateKey);
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
