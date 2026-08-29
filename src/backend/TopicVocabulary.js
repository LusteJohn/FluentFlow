import { SEED_TOPIC_VOCABULARY } from "@/data/seed-topic-vocabulary";

export async function createTopicVocabulary(db, topicVocabulary) {
  const result = await db.runAsync(
    "INSERT INTO topic_vocabulary (topic_id, word, part_of_speech, definition, example_sentence, image, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)",
    topicVocabulary.topic_id,
    topicVocabulary.word,
    topicVocabulary.part_of_speech,
    topicVocabulary.definition,
    topicVocabulary.example_sentence,
    topicVocabulary.image,
    topicVocabulary.order_index,
  );
  if (result.changes < 1) throw new Error("Failed to create topic vocabulary");
  return {
    topic_vocabulary_id: result.lastInsertRowId,
    topic_id: topicVocabulary.topic_id,
    word: topicVocabulary.word,
    part_of_speech: topicVocabulary.part_of_speech,
    definition: topicVocabulary.definition,
    example_sentence: topicVocabulary.example_sentence,
    image: topicVocabulary.image,
    order_index: topicVocabulary.order_index,
  };
}

export async function getTopicVocabularyById(db, topicVocabularyId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM topic_vocabulary WHERE topic_vocabulary_id = ?",
    topicVocabularyId,
  );
  return result ?? null;
}

export async function getAllTopicVocabulary(db) {
  const result = await db.getAllAsync(
    "SELECT * FROM topic_vocabulary ORDER BY topic_id ASC, order_index ASC",
  );
  return result;
}

export async function getTopicVocabularyByTopicId(db, topicId) {
  const result = await db.getAllAsync(
    "SELECT * FROM topic_vocabulary WHERE topic_id = ? ORDER BY order_index ASC",
    topicId,
  );
  return result;
}

export async function updateTopicVocabulary(db, topicVocabularyId, updates) {
  const fields = [];
  const values = [];

  if (updates.topic_id !== undefined) {
    fields.push("topic_id = ?");
    values.push(updates.topic_id);
  }
  if (updates.word !== undefined) {
    fields.push("word = ?");
    values.push(updates.word);
  }
  if (updates.part_of_speech !== undefined) {
    fields.push("part_of_speech = ?");
    values.push(updates.part_of_speech);
  }
  if (updates.definition !== undefined) {
    fields.push("definition = ?");
    values.push(updates.definition);
  }
  if (updates.example_sentence !== undefined) {
    fields.push("example_sentence = ?");
    values.push(updates.example_sentence);
  }
  if (updates.image !== undefined) {
    fields.push("image = ?");
    values.push(updates.image);
  }
  if (updates.order_index !== undefined) {
    fields.push("order_index = ?");
    values.push(updates.order_index);
  }

  if (fields.length === 0)
    return getTopicVocabularyById(db, topicVocabularyId);

  values.push(topicVocabularyId);
  await db.runAsync(
    `UPDATE topic_vocabulary SET ${fields.join(", ")} WHERE topic_vocabulary_id = ?`,
    ...values,
  );
  return getTopicVocabularyById(db, topicVocabularyId);
}

export async function deleteTopicVocabulary(db, topicVocabularyId) {
  await db.runAsync(
    "DELETE FROM topic_vocabulary WHERE topic_vocabulary_id = ?",
    topicVocabularyId,
  );
}

export async function seedTopicVocabulary(db) {
  const existing = await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM topic_vocabulary",
  );

  if ((existing?.count ?? 0) > 0) {
    for (const vocabulary of SEED_TOPIC_VOCABULARY) {
      await db.runAsync(
        "UPDATE topic_vocabulary SET part_of_speech = ? WHERE topic_id = ? AND word = ? AND (part_of_speech IS NULL OR part_of_speech = '')",
        vocabulary.part_of_speech,
        vocabulary.topic_id,
        vocabulary.word,
      );
    }
    return;
  }

  for (const vocabulary of SEED_TOPIC_VOCABULARY) {
    await createTopicVocabulary(db, vocabulary);
  }
}
