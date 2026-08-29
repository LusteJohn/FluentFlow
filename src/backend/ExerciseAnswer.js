import { SEED_EXERCISE_ANSWERS } from "@/data/seed-exercise-answers";

export async function createExerciseAnswer(db, exerciseAnswer) {
  const created = await db.getFirstAsync(
    "INSERT INTO exercise_answers (exercise_id, answer_text, is_primary, match_type) VALUES (?, ?, ?, ?) RETURNING *",
    exerciseAnswer.exercise_id,
    exerciseAnswer.answer_text,
    exerciseAnswer.is_primary ?? 0,
    exerciseAnswer.match_type ?? "exact",
  );
  if (!created) throw new Error("Failed to create exercise answer");
  return created;
}

export async function getExerciseAnswerById(db, exerciseAnswerId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM exercise_answers WHERE exercise_answer_id = ?",
    exerciseAnswerId,
  );
  return result ?? null;
}

export async function getExerciseAnswersByExerciseId(db, exerciseId) {
  const result = await db.getAllAsync(
    "SELECT * FROM exercise_answers WHERE exercise_id = ? ORDER BY is_primary DESC, exercise_answer_id ASC",
    exerciseId,
  );
  return result;
}

export async function getPrimaryExerciseAnswer(db, exerciseId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM exercise_answers WHERE exercise_id = ? AND is_primary = 1",
    exerciseId,
  );
  return result ?? null;
}

export async function getAllExerciseAnswers(db) {
  const result = await db.getAllAsync(
    "SELECT * FROM exercise_answers ORDER BY exercise_id ASC, exercise_answer_id ASC",
  );
  return result;
}

export async function updateExerciseAnswer(db, exerciseAnswerId, updates) {
  const fields = [];
  const values = [];

  if (updates.exercise_id !== undefined) {
    fields.push("exercise_id = ?");
    values.push(updates.exercise_id);
  }
  if (updates.answer_text !== undefined) {
    fields.push("answer_text = ?");
    values.push(updates.answer_text);
  }
  if (updates.is_primary !== undefined) {
    fields.push("is_primary = ?");
    values.push(updates.is_primary);
  }
  if (updates.match_type !== undefined) {
    fields.push("match_type = ?");
    values.push(updates.match_type);
  }

  if (fields.length === 0) return getExerciseAnswerById(db, exerciseAnswerId);

  values.push(exerciseAnswerId);
  await db.runAsync(
    `UPDATE exercise_answers SET ${fields.join(", ")} WHERE exercise_answer_id = ?`,
    ...values,
  );
  return getExerciseAnswerById(db, exerciseAnswerId);
}

export async function deleteExerciseAnswer(db, exerciseAnswerId) {
  await db.runAsync(
    "DELETE FROM exercise_answers WHERE exercise_answer_id = ?",
    exerciseAnswerId,
  );
}

export async function deleteExerciseAnswersByExerciseId(db, exerciseId) {
  await db.runAsync(
    "DELETE FROM exercise_answers WHERE exercise_id = ?",
    exerciseId,
  );
}

export async function seedExerciseAnswers(db) {
  const existing = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM exercise_answers",
  );
  if ((existing?.count ?? 0) > 0) return;

  for (const exerciseAnswer of SEED_EXERCISE_ANSWERS) {
    await createExerciseAnswer(db, exerciseAnswer);
  }
}