export async function createExerciseAnswer(db, exerciseAnswer) {
  const result = await db.runAsync(
    "INSERT INTO exercise_answers (exercise_id, answer_text, is_primary, match_type) VALUES (?, ?, ?, ?)",
    exerciseAnswer.exercise_id,
    exerciseAnswer.answer_text,
    exerciseAnswer.is_primary ?? 0,
    exerciseAnswer.match_type ?? "exact",
  );
  if (result.changes < 1) throw new Error("Failed to create exercise answer");
  return {
    answer_id: result.lastInsertRowId,
    exercise_id: exerciseAnswer.exercise_id,
    answer_text: exerciseAnswer.answer_text,
    is_primary: exerciseAnswer.is_primary ?? 0,
    match_type: exerciseAnswer.match_type ?? "exact",
  };
}

export async function getExerciseAnswerById(db, answerId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM exercise_answers WHERE answer_id = ?",
    answerId,
  );
  return result ?? null;
}

export async function getExerciseAnswersByExerciseId(db, exerciseId) {
  const result = await db.getAllAsync(
    "SELECT * FROM exercise_answers WHERE exercise_id = ? ORDER BY is_primary DESC, answer_id ASC",
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
    "SELECT * FROM exercise_answers ORDER BY exercise_id ASC, answer_id ASC",
  );
  return result;
}

// Checks a student's submitted text against every accepted answer for an
// exercise and returns the matching row (or null if nothing matches).
// - exact: case-sensitive, exact string match
// - case_insensitive: matches regardless of letter case
// - fuzzy: case-insensitive, ignores leading/trailing whitespace and
//   collapses repeated inner whitespace, so minor spacing differences
//   don't count as wrong
export async function checkExerciseAnswer(db, exerciseId, submittedText) {
  const answers = await getExerciseAnswersByExerciseId(db, exerciseId);
  const submitted = submittedText ?? "";

  const normalize = (s) => s.trim().replace(/\s+/g, " ");

  for (const answer of answers) {
    const candidate = answer.answer_text ?? "";

    if (answer.match_type === "exact") {
      if (submitted === candidate) return answer;
    } else if (answer.match_type === "case_insensitive") {
      if (submitted.toLowerCase() === candidate.toLowerCase()) return answer;
    } else if (answer.match_type === "fuzzy") {
      if (normalize(submitted).toLowerCase() === normalize(candidate).toLowerCase()) {
        return answer;
      }
    }
  }

  return null;
}

export async function updateExerciseAnswer(db, answerId, updates) {
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

  if (fields.length === 0) return getExerciseAnswerById(db, answerId);

  values.push(answerId);
  await db.runAsync(
    `UPDATE exercise_answers SET ${fields.join(", ")} WHERE answer_id = ?`,
    ...values,
  );
  return getExerciseAnswerById(db, answerId);
}

export async function deleteExerciseAnswer(db, answerId) {
  await db.runAsync("DELETE FROM exercise_answers WHERE answer_id = ?", answerId);
}

export async function deleteExerciseAnswersByExerciseId(db, exerciseId) {
  await db.runAsync(
    "DELETE FROM exercise_answers WHERE exercise_id = ?",
    exerciseId,
  );
}
