import { SEED_GRAMMAR_TRIVIA } from "@/data/seed-grammar-trivia";

export async function createGrammarTrivia(db, trivia) {
  const result = await db.runAsync(
    "INSERT INTO grammar_trivia (category, topic, scenario, example_sentence, usage_note, pros, cons) VALUES (?, ?, ?, ?, ?, ?, ?)",
    trivia.category,
    trivia.topic,
    trivia.scenario,
    trivia.example_sentence,
    trivia.usage_note,
    trivia.pros,
    trivia.cons,
  );
  const id = result.lastInsertRowId;
  const created = await getGrammarTriviaById(db, id);
  if (!created) throw new Error("Failed to create grammar trivia");
  return created;
}

export async function getGrammarTriviaById(db, id) {
  const result = await db.getFirstAsync(
    "SELECT * FROM grammar_trivia WHERE id = ?",
    id,
  );
  return result ?? null;
}

export async function getGrammarTriviaByTopic(db, topic) {
  const result = await db.getAllAsync(
    "SELECT * FROM grammar_trivia WHERE topic = ? ORDER BY id ASC",
    topic,
  );
  return result;
}

export async function getGrammarTriviaByCategory(db, category) {
  const result = await db.getAllAsync(
    "SELECT * FROM grammar_trivia WHERE category = ? ORDER BY topic ASC, id ASC",
    category,
  );
  return result;
}

export async function getAllGrammarTrivia(db) {
  const result = await db.getAllAsync(
    "SELECT * FROM grammar_trivia ORDER BY id ASC",
  );
  return result;
}

// Fetches ONE random trivia entry - this is what you call on app open to
// show a fresh, varied trivia card each time. Uses SQLite's own RANDOM()
// so the randomness happens in the DB, not by pulling every row into JS
// first.
export async function getRandomGrammarTrivia(db) {
  const result = await db.getFirstAsync(
    "SELECT * FROM grammar_trivia ORDER BY RANDOM() LIMIT 1",
  );
  return result ?? null;
}

// Same as above, but avoids repeating the trivia the user just saw
// (useful for a "Next tip" button so two taps in a row don't show the
// same card twice). Falls back to any random row if there's only one
// entry total, or none to exclude.
export async function getRandomGrammarTriviaExcluding(db, excludeId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM grammar_trivia WHERE id != ? ORDER BY RANDOM() LIMIT 1",
    excludeId,
  );
  if (result) return result;
  return getRandomGrammarTrivia(db);
}

// Fetches one random trivia entry from a specific category (e.g. only
// "Parts of Speech") - useful once more categories (Tenses, Sentence
// Grammar, etc.) get added and you want to target one of them.
export async function getRandomGrammarTriviaByCategory(db, category) {
  const result = await db.getFirstAsync(
    "SELECT * FROM grammar_trivia WHERE category = ? ORDER BY RANDOM() LIMIT 1",
    category,
  );
  return result ?? null;
}

export async function updateGrammarTrivia(db, id, updates) {
  const fields = [];
  const values = [];

  if (updates.category !== undefined) {
    fields.push("category = ?");
    values.push(updates.category);
  }
  if (updates.topic !== undefined) {
    fields.push("topic = ?");
    values.push(updates.topic);
  }
  if (updates.scenario !== undefined) {
    fields.push("scenario = ?");
    values.push(updates.scenario);
  }
  if (updates.example_sentence !== undefined) {
    fields.push("example_sentence = ?");
    values.push(updates.example_sentence);
  }
  if (updates.usage_note !== undefined) {
    fields.push("usage_note = ?");
    values.push(updates.usage_note);
  }
  if (updates.pros !== undefined) {
    fields.push("pros = ?");
    values.push(updates.pros);
  }
  if (updates.cons !== undefined) {
    fields.push("cons = ?");
    values.push(updates.cons);
  }

  if (fields.length === 0) return getGrammarTriviaById(db, id);

  values.push(id);
  await db.runAsync(
    `UPDATE grammar_trivia SET ${fields.join(", ")} WHERE id = ?`,
    ...values,
  );
  return getGrammarTriviaById(db, id);
}

export async function deleteGrammarTrivia(db, id) {
  await db.runAsync("DELETE FROM grammar_trivia WHERE id = ?", id);
}

export async function seedGrammarTrivia(db) {
  const existing = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM grammar_trivia",
  );
  const currentCount = existing?.count ?? 0;

  // Already seeded with the current data set - nothing to do.
  if (currentCount === SEED_GRAMMAR_TRIVIA.length) return;

  // Mismatch means this table is empty, or stale from an earlier (smaller
  // or differently-shaped) version of seed-grammar-trivia.js - wipe and
  // reinsert fresh so nothing stale or duplicated lingers.
  await db.runAsync("DELETE FROM grammar_trivia");

  for (const trivia of SEED_GRAMMAR_TRIVIA) {
    await createGrammarTrivia(db, trivia);
  }
}