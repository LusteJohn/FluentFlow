// Formats a Date as 'YYYY-MM-DD' in the LOCAL timezone (not UTC), so a
// user practicing at 11 PM and again at 1 AM the next day are correctly
// treated as two different days in their own timezone.
function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(dateStrA, dateStrB) {
  const a = new Date(`${dateStrA}T00:00:00`);
  const b = new Date(`${dateStrB}T00:00:00`);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

export async function getStreakByUserId(db, userId) {
  const result = await db.getFirstAsync(
    "SELECT * FROM user_streaks WHERE user_id = ?",
    userId,
  );
  return result ?? null;
}

async function createStreak(db, userId) {
  const result = await db.runAsync(
    "INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES (?, 0, 0, NULL)",
    userId,
  );
  return getStreakByUserId(db, userId);
}

// Call this once whenever a user completes an exercise correctly.
// Safe to call multiple times in the same day - only the FIRST call each
// day actually changes anything, so you don't need to guard against
// calling it after every single exercise.
//
// `today` is optional and defaults to the real current date; passing it
// explicitly is mainly useful for testing.
export async function recordActivityToday(db, userId, today = new Date()) {
  let streak = await getStreakByUserId(db, userId);
  if (!streak) {
    streak = await createStreak(db, userId);
  }

  const todayStr = toDateString(today);

  // Already recorded activity today - nothing to do.
  if (streak.last_activity_date === todayStr) {
    return streak;
  }

  let newCurrentStreak;
  if (streak.last_activity_date === null) {
    // First ever activity.
    newCurrentStreak = 1;
  } else {
    const gap = daysBetween(streak.last_activity_date, todayStr);
    if (gap === 1) {
      // Practiced yesterday - streak continues.
      newCurrentStreak = streak.current_streak + 1;
    } else {
      // Missed one or more days (or clock moved backwards) - streak resets.
      newCurrentStreak = 1;
    }
  }

  const newLongestStreak = Math.max(streak.longest_streak, newCurrentStreak);

  await db.runAsync(
    "UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ? WHERE user_id = ?",
    newCurrentStreak,
    newLongestStreak,
    todayStr,
    userId,
  );

  return getStreakByUserId(db, userId);
}

// Call this once when the app opens (e.g. on the home screen) to find out
// if a streak has been silently broken by inactivity, WITHOUT recording
// today as active. Useful for showing "You lost your streak" messaging
// before the user has done anything today.
export async function seedUserStreaks(db) {
}

export async function getCurrentStreakStatus(db, userId, today = new Date()) {
  const streak = await getStreakByUserId(db, userId);
  if (!streak || streak.last_activity_date === null) {
    return { current_streak: 0, longest_streak: streak?.longest_streak ?? 0, isActiveToday: false, isBroken: false };
  }

  const todayStr = toDateString(today);
  const gap = daysBetween(streak.last_activity_date, todayStr);

  if (gap === 0) {
    return { current_streak: streak.current_streak, longest_streak: streak.longest_streak, isActiveToday: true, isBroken: false };
  }
  if (gap === 1) {
    // Still "alive" - they practiced yesterday, just haven't today yet.
    return { current_streak: streak.current_streak, longest_streak: streak.longest_streak, isActiveToday: false, isBroken: false };
  }
  // gap >= 2: streak is broken, even though we haven't written 0 to the DB
  // yet (that only happens the next time recordActivityToday runs).
  return { current_streak: 0, longest_streak: streak.longest_streak, isActiveToday: false, isBroken: true };
}