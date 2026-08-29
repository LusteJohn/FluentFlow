import { SEED_TOPIC_INTRO } from "@/data/seed-topic-intro";

export async function createTopicIntro(db, topicIntro) {
  const created = await db.getFirstAsync(
    "INSERT INTO topic_introduction (topic_id, intro_text, example_sentence) VALUES (?, ?, ?) RETURNING *",
    topicIntro.topic_id,
    topicIntro.intro_text,
    topicIntro.example_sentence,
  );
  if (!created) throw new Error("Failed to create topic intro");
  return created;
}

export async function getTopicIntroById(db, topicIntroId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM topic_introduction WHERE topic_intro_id = ?",
    topicIntroId,
  );
  return result ?? null;
}

export async function getTopicIntrosByTopicId(db, topicId) {
  const result = await db.getAllAsync(
    "SELECT * FROM topic_introduction WHERE topic_id = ? ORDER BY topic_intro_id ASC",
    topicId,
  );
  return result;
}

export async function getAllTopicIntros(db) {
  const result = await db.getAllAsync(
    "SELECT * FROM topic_introduction ORDER BY topic_intro_id ASC",
  );
  return result;
}

export async function updateTopicIntro(db, topicIntroId, updates) {
  const fields = [];
  const values = [];

  if (updates.topic_id !== undefined) {
    fields.push("topic_id = ?");
    values.push(updates.topic_id);
  }
  if (updates.intro_text !== undefined) {
    fields.push("intro_text = ?");
    values.push(updates.intro_text);
  }
  if (updates.example_sentence !== undefined) {
    fields.push("example_sentence = ?");
    values.push(updates.example_sentence);
  }

  if (fields.length === 0) return getTopicIntroById(db, topicIntroId);

  values.push(topicIntroId);
  await db.runAsync(
    `UPDATE topic_introduction SET ${fields.join(", ")} WHERE topic_intro_id = ?`,
    ...values,
  );
  return getTopicIntroById(db, topicIntroId);
}

export async function deleteTopicIntro(db, topicIntroId) {
  await db.runAsync(
    "DELETE FROM topic_introduction WHERE topic_intro_id = ?",
    topicIntroId,
  );
}

export async function seedTopicIntros(db) {
  const existing = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM topic_introduction",
  );
  if ((existing?.count ?? 0) > 0) return;

  for (const topicIntro of SEED_TOPIC_INTRO) {
    await createTopicIntro(db, topicIntro);
  }
}
