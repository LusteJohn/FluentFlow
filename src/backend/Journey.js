import { SEED_JOURNEYS } from "@/data/seed-journey";

export async function createJourney(db, journey) {
  const result = await db.runAsync(
    "INSERT INTO journeys (title, description, icon, bg_image, order_index) VALUES (?, ?, ?, ?, ?)",
    journey.title,
    journey.description,
    journey.icon,
    journey.bg_image,
    journey.order_index,
  );
  if (result.changes < 1) throw new Error("Failed to create journey");
  return {
    journey_id: result.lastInsertRowId,
    title: journey.title,
    description: journey.description,
    icon: journey.icon,
    bg_image: journey.bg_image,
    order_index: journey.order_index,
  };
}

export async function getJourneyById(db, journeyId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM journeys WHERE journey_id = ?",
    journeyId,
  );
  return result ?? null;
}

export async function getAllJourneys(db) {
  const result = await db.getAllAsync(
    "SELECT * FROM journeys ORDER BY order_index ASC",
  );
  return result;
}

export async function updateJourney(db, journeyId, updates) {
  const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.icon !== undefined) {
    fields.push("icon = ?");
    values.push(updates.icon);
  }
  if (updates.bg_image !== undefined) {
    fields.push("bg_image = ?");
    values.push(updates.bg_image);
  }
  if (updates.order_index !== undefined) {
    fields.push("order_index = ?");
    values.push(updates.order_index);
  }

  if (fields.length === 0) return getJourneyById(db, journeyId);

  values.push(journeyId);
  await db.runAsync(
    `UPDATE journeys SET ${fields.join(", ")} WHERE journey_id = ?`,
    ...values,
  );
  return getJourneyById(db, journeyId);
}

export async function deleteJourney(db, journeyId) {
  await db.runAsync("DELETE FROM journeys WHERE journey_id = ?", journeyId);
}

export async function seedJourneys(db) {
  const existing = await db.getFirstAsync("SELECT COUNT(*) as count FROM journeys");
  if ((existing?.count ?? 0) > 0) return;

  for (const journey of SEED_JOURNEYS) {
    await createJourney(db, journey);
  }
}

export async function getJourneyProgressForUser(db, userId, journeyId) {
  const totals = await db.getFirstAsync(
    `SELECT COUNT(*) as total
     FROM exercises e
     JOIN topics t ON e.topic_id = t.topic_id
     WHERE t.journey_id = ?`,
    journeyId,
  );
  const completed = await db.getFirstAsync(
    `SELECT COUNT(*) as completed
     FROM user_exercise_progress p
     JOIN exercises e ON p.exercise_id = e.exercise_id
     JOIN topics t ON e.topic_id = t.topic_id
     WHERE p.user_id = ?
       AND p.is_completed = 1
       AND t.journey_id = ?`,
    userId,
    journeyId,
  );
  const totalExercises = totals?.total ?? 0;
  const completedExercises = completed?.completed ?? 0;
  const percent = totalExercises > 0
    ? Math.round((completedExercises / totalExercises) * 100)
    : 0;
  return {
    totalExercises,
    completedExercises,
    percent,
  };
}

export async function getAllJourneyProgressForUser(db, userId) {
  const journeys = await getAllJourneys(db);
  const result = {};
  for (const journey of journeys ?? []) {
    result[journey.journey_id] = await getJourneyProgressForUser(
      db,
      userId,
      journey.journey_id,
    );
  }
  return result;
}
