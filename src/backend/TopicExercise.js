import { SEED_EXERCISES } from "@/data/seed-exercises";

export async function createExercise(db, exercise) {
  const result = await db.runAsync(
    "INSERT OR REPLACE INTO exercises (exercise_id, topic_id, level, type, prompt, context_sentence, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
    exercise.exercise_id,
    exercise.topic_id,
    exercise.level,
    exercise.type,
    exercise.prompt,
    exercise.context_sentence ?? null,
    exercise.order_index ?? null,
  );
  if (result.changes < 1) throw new Error("Failed to create exercise");
  return {
    exercise_id: exercise.exercise_id ?? result.lastInsertRowId,
    topic_id: exercise.topic_id,
    level: exercise.level,
    type: exercise.type,
    prompt: exercise.prompt,
    context_sentence: exercise.context_sentence ?? null,
    order_index: exercise.order_index ?? null,
  };
}

export async function getExerciseById(db, exerciseId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM exercises WHERE exercise_id = ?",
    exerciseId,
  );
  return result ?? null;
}

export async function getExercisesByTopicId(db, topicId) {
  const result = await db.getAllAsync(
    "SELECT * FROM exercises WHERE topic_id = ? ORDER BY level ASC, order_index ASC",
    topicId,
  );
  return result;
}

export async function getExercisesByTopicIdAndLevel(db, topicId, level) {
  const result = await db.getAllAsync(
    "SELECT * FROM exercises WHERE topic_id = ? AND level = ? ORDER BY order_index ASC",
    topicId,
    level,
  );
  return result;
}

export async function getAllExercises(db) {
  const result = await db.getAllAsync(
    "SELECT * FROM exercises ORDER BY exercise_id ASC",
  );
  return result;
}

export async function updateExercise(db, exerciseId, updates) {
  const fields = [];
  const values = [];

  if (updates.topic_id !== undefined) {
    fields.push("topic_id = ?");
    values.push(updates.topic_id);
  }
  if (updates.level !== undefined) {
    fields.push("level = ?");
    values.push(updates.level);
  }
  if (updates.type !== undefined) {
    fields.push("type = ?");
    values.push(updates.type);
  }
  if (updates.prompt !== undefined) {
    fields.push("prompt = ?");
    values.push(updates.prompt);
  }
  if (updates.context_sentence !== undefined) {
    fields.push("context_sentence = ?");
    values.push(updates.context_sentence);
  }
  if (updates.order_index !== undefined) {
    fields.push("order_index = ?");
    values.push(updates.order_index);
  }

  if (fields.length === 0) return getExerciseById(db, exerciseId);

  values.push(exerciseId);
  await db.runAsync(
    `UPDATE exercises SET ${fields.join(", ")} WHERE exercise_id = ?`,
    ...values,
  );
  return getExerciseById(db, exerciseId);
}

export async function deleteExercise(db, exerciseId) {
  await db.runAsync(
    "DELETE FROM exercises WHERE exercise_id = ?",
    exerciseId,
  );
}

export async function seedExercises(db) {
  await db.runAsync("DELETE FROM exercise_tokens");
  await db.runAsync("DELETE FROM exercises");

  for (const exercise of SEED_EXERCISES) {
    await createExercise(db, exercise);
  }
}