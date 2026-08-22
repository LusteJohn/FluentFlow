import { SEED_TOPICS } from "@/data/seed-topic";

export async function createTopic(db, topic) {
  const result = await db.runAsync(
    "INSERT INTO topics (journey_id, title, grammar_focus, order_index) VALUES (?, ?, ?, ?)",
    topic.journey_id,
    topic.title,
    topic.grammar_focus,
    topic.order_index,
  );
  const topicId = result.lastInsertRowId;
  const created = await getTopicById(db, topicId);
  if (!created) throw new Error("Failed to create topic");
  return created;
}

export async function getTopicById(db, topicId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM topics WHERE topic_id = ?",
    topicId,
  );
  return result ?? null;
}

export async function getAllTopics(db) {
  const result = await db.getAllAsync(
    "SELECT * FROM topics ORDER BY order_index ASC",
  );
  return result;
}

export async function getTopicsByJourneyId(db, journeyId) {
  const result = await db.getAllAsync(
    "SELECT * FROM topics WHERE journey_id = ? ORDER BY order_index ASC",
    journeyId,
  );
  return result;
}

export async function updateTopic(db, topicId, updates) {
  const fields = [];
  const values = [];

  if (updates.journey_id !== undefined) {
    fields.push("journey_id = ?");
    values.push(updates.journey_id);
  }
  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.grammar_focus !== undefined) {
    fields.push("grammar_focus = ?");
    values.push(updates.grammar_focus);
  }
  if (updates.order_index !== undefined) {
    fields.push("order_index = ?");
    values.push(updates.order_index);
  }

  if (fields.length === 0) return getTopicById(db, topicId);

  values.push(topicId);
  await db.runAsync(
    `UPDATE topics SET ${fields.join(", ")} WHERE topic_id = ?`,
    ...values,
  );
  return getTopicById(db, topicId);
}

export async function deleteTopic(db, topicId) {
  await db.runAsync("DELETE FROM topics WHERE topic_id = ?", topicId);
}

export async function seedTopics(db) {
  const existing = await db.getFirstAsync("SELECT COUNT(*) as count FROM topics");
  if ((existing?.count ?? 0) > 0) return;

  for (const topic of SEED_TOPICS) {
    await createTopic(db, topic);
  }
}
