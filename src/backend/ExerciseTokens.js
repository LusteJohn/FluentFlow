import { SEED_EXERCISE_TOKENS } from "@/data/seed-exercise-token";

export async function createExerciseToken(db, exerciseToken) {
  const created = await db.getFirstAsync(
    "INSERT INTO exercise_tokens (exercise_id, token, correct_position) VALUES (?, ?, ?) RETURNING *",
    exerciseToken.exercise_id,
    exerciseToken.token,
    exerciseToken.correct_position,
  );
  if (!created) throw new Error("Failed to create exercise token");
  return created;
}

export async function getExerciseTokenById(db, exerciseTokenId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM exercise_tokens WHERE exercise_token_id = ?",
    exerciseTokenId,
  );
  return result ?? null;
}

export async function getExerciseTokensByExerciseId(db, exerciseId) {
  const result = await db.getAllAsync(
    "SELECT * FROM exercise_tokens WHERE exercise_id = ? ORDER BY correct_position ASC",
    exerciseId,
  );
  return result;
}

export async function getAllExerciseTokens(db) {
  const result = await db.getAllAsync(
    "SELECT * FROM exercise_tokens ORDER BY exercise_id ASC, correct_position ASC",
  );
  return result;
}

export async function updateExerciseToken(db, exerciseTokenId, updates) {
  const fields = [];
  const values = [];

  if (updates.exercise_id !== undefined) {
    fields.push("exercise_id = ?");
    values.push(updates.exercise_id);
  }
  if (updates.token !== undefined) {
    fields.push("token = ?");
    values.push(updates.token);
  }
  if (updates.correct_position !== undefined) {
    fields.push("correct_position = ?");
    values.push(updates.correct_position);
  }

  if (fields.length === 0) return getExerciseTokenById(db, exerciseTokenId);

  values.push(exerciseTokenId);
  await db.runAsync(
    `UPDATE exercise_tokens SET ${fields.join(", ")} WHERE exercise_token_id = ?`,
    ...values,
  );
  return getExerciseTokenById(db, exerciseTokenId);
}

export async function deleteExerciseToken(db, exerciseTokenId) {
  await db.runAsync(
    "DELETE FROM exercise_tokens WHERE exercise_token_id = ?",
    exerciseTokenId,
  );
}

export async function deleteExerciseTokensByExerciseId(db, exerciseId) {
  await db.runAsync(
    "DELETE FROM exercise_tokens WHERE exercise_id = ?",
    exerciseId,
  );
}

export async function seedExerciseTokens(db) {
  await db.runAsync("DELETE FROM exercise_tokens");

  for (const exerciseToken of SEED_EXERCISE_TOKENS) {
    await createExerciseToken(db, exerciseToken);
  }
}