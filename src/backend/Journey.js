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
  const journeyId = result.lastInsertRowId;
  const created = await getJourneyById(db, journeyId);
  if (!created) throw new Error("Failed to create journey");
  return created;
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
