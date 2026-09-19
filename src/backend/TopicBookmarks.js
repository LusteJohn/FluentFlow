export async function createBookmark(db, userId, topicId) {
  const result = await db.runAsync(
    "INSERT INTO topic_bookmarks (user_id, topic_id) VALUES (?, ?)",
    userId,
    topicId,
  );
  const id = result.lastInsertRowId;
  const created = await getBookmarkById(db, id);
  if (!created) throw new Error("Failed to create bookmark");
  return created;
}

export async function getBookmarkById(db, id) {
  const result = await db.getFirstAsync(
    "SELECT * FROM topic_bookmarks WHERE id = ?",
    id,
  );
  return result ?? null;
}

export async function getBookmarksByUserId(db, userId) {
  const result = await db.getAllAsync(
    "SELECT * FROM topic_bookmarks WHERE user_id = ? ORDER BY created_at DESC",
    userId,
  );
  return result;
}

// Returns the bookmarked topics themselves (joined), not just the
// bookmark rows - handy for rendering a "Saved topics" list directly.
export async function getBookmarkedTopicsByUserId(db, userId) {
  const result = await db.getAllAsync(
    "SELECT topics.*, topic_bookmarks.created_at AS bookmarked_at " +
      "FROM topic_bookmarks " +
      "JOIN topics ON topics.topic_id = topic_bookmarks.topic_id " +
      "WHERE topic_bookmarks.user_id = ? " +
      "ORDER BY topic_bookmarks.created_at DESC",
    userId,
  );
  return result;
}

export async function isTopicBookmarked(db, userId, topicId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM topic_bookmarks WHERE user_id = ? AND topic_id = ?",
    userId,
    topicId,
  );
  return result != null;
}

export async function getAllBookmarks(db) {
  const result = await db.getAllAsync(
    "SELECT * FROM topic_bookmarks ORDER BY created_at DESC",
  );
  return result;
}

export async function deleteBookmark(db, id) {
  await db.runAsync("DELETE FROM topic_bookmarks WHERE id = ?", id);
}

export async function deleteBookmarkByUserAndTopic(db, userId, topicId) {
  await db.runAsync(
    "DELETE FROM topic_bookmarks WHERE user_id = ? AND topic_id = ?",
    userId,
    topicId,
  );
}

// Convenience helper for a bookmark-icon button: adds the bookmark if it
// doesn't exist, removes it if it does. Returns the new bookmarked state
// (true if now bookmarked, false if just removed).
export async function toggleBookmark(db, userId, topicId) {
  const alreadyBookmarked = await isTopicBookmarked(db, userId, topicId);

  if (alreadyBookmarked) {
    await deleteBookmarkByUserAndTopic(db, userId, topicId);
    return false;
  }

  await createBookmark(db, userId, topicId);
  return true;
}

export async function seedTopicBookmarks(db) {}