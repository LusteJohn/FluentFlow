export async function createUserProfile(db, userProfile) {
  const result = await db.runAsync(
    "INSERT INTO user_profiles (firstname, middlename, lastname, name_ext, birthdate, gender, address) VALUES (?, ?, ?, ?, ?, ?, ?)",
    userProfile.firstname,
    userProfile.middlename ?? null,
    userProfile.lastname,
    userProfile.name_ext ?? null,
    userProfile.birthdate ?? null,
    userProfile.gender ?? null,
    userProfile.address ?? null,
  );
  if (result.changes < 1) throw new Error("Failed to create user profile");
  return {
    user_id: result.lastInsertRowId,
    firstname: userProfile.firstname,
    middlename: userProfile.middlename ?? null,
    lastname: userProfile.lastname,
    name_ext: userProfile.name_ext ?? null,
    birthdate: userProfile.birthdate ?? null,
    gender: userProfile.gender ?? null,
    address: userProfile.address ?? null,
  };
}

export async function getUserProfile(db) {
  const result = await db.getFirstAsync(
    "SELECT * FROM user_profiles ORDER BY user_id ASC LIMIT 1",
  );
  return result ?? null;
}

export async function getAllUserProfiles(db) {
  const result = await db.getAllAsync(
    "SELECT * FROM user_profiles ORDER BY created_at DESC",
  );
  return result;
}

export async function updateUserProfile(db, userId, updates) {
  const fields = [];
  const values = [];

  if (updates.firstname !== undefined) {
    fields.push("firstname = ?");
    values.push(updates.firstname);
  }
  if (updates.middlename !== undefined) {
    fields.push("middlename = ?");
    values.push(updates.middlename);
  }
  if (updates.lastname !== undefined) {
    fields.push("lastname = ?");
    values.push(updates.lastname);
  }
  if (updates.name_ext !== undefined) {
    fields.push("name_ext = ?");
    values.push(updates.name_ext);
  }
  if (updates.birthdate !== undefined) {
    fields.push("birthdate = ?");
    values.push(updates.birthdate);
  }
  if (updates.gender !== undefined) {
    fields.push("gender = ?");
    values.push(updates.gender);
  }
  if (updates.address !== undefined) {
    fields.push("address = ?");
    values.push(updates.address);
  }

  if (fields.length === 0) return getUserProfile(db);

  values.push(userId);
  await db.runAsync(
    `UPDATE user_profiles SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
    ...values,
  );
  return getUserProfile(db);
}

export async function deleteUserProfile(db, userId) {
  await db.runAsync("DELETE FROM user_profiles WHERE user_id = ?", userId);
}

export async function seedUserProfiles(db) {
  const existing = await db.getFirstAsync("SELECT COUNT(*) as count FROM user_profiles");
  if ((existing?.count ?? 0) > 0) return;
}
