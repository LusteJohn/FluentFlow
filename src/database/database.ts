import { seedExerciseTokens } from "@/backend/ExerciseTokens";
import { seedJourneys } from "@/backend/Journey";
import { seedTopics } from "@/backend/Topic";
import { seedExercises } from "@/backend/TopicExercise";
import { seedTopicIntros } from "@/backend/TopicIntro";
import { seedTopicVocabulary } from "@/backend/TopicVocabulary";
import { seedUserExerciseProgress } from "@/backend/UserExerciseProgress";
import { seedUserProfiles } from "@/backend/UserProfile";
import { Platform } from "react-native";

let SQLite: any = null;
if (Platform.OS !== "web") {
  try {
    SQLite = require("expo-sqlite");
  } catch (e) {
    console.warn(
      "expo-sqlite native module not available. Build a custom dev client to use SQLite.",
    );
  }
}

let dbPromise: Promise<any> | null = null;

export async function getDatabase() {
  if (!SQLite) {
    throw new Error(
      "expo-sqlite is not available. Please build and run a custom dev client (npx expo prebuild && npx expo run:android) instead of Expo Go.",
    );
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync("fluentflow_data_v2.db");

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS tbl_users (user_id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
        );

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS user_profiles (user_id INTEGER PRIMARY KEY AUTOINCREMENT, firstname TEXT NOT NULL, middlename TEXT, lastname TEXT NOT NULL, name_ext TEXT, birthdate TEXT, gender TEXT, address TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
        );

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS journeys (journey_id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, icon TEXT, bg_image TEXT, order_index INTEGER)",
        );

        try {
          await db.runAsync("ALTER TABLE journeys ADD COLUMN bg_image TEXT");
        } catch (e) {}

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS topics (topic_id INTEGER PRIMARY KEY AUTOINCREMENT, journey_id INTEGER NOT NULL, title TEXT NOT NULL, grammar_focus TEXT NOT NULL, order_index INTEGER, FOREIGN KEY(journey_id) REFERENCES journeys(journey_id))",
        );

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS topic_introduction (topic_intro_id INTEGER PRIMARY KEY AUTOINCREMENT, topic_id INTEGER NOT NULL, intro_text TEXT NOT NULL, example_sentence TEXT NOT NULL, FOREIGN KEY(topic_id) REFERENCES topics(topic_id))",
        );

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS topic_vocabulary (topic_vocabulary_id INTEGER PRIMARY KEY AUTOINCREMENT, topic_id INTEGER NOT NULL, word TEXT NOT NULL, part_of_speech TEXT, definition TEXT NOT NULL, example_sentence TEXT NOT NULL, image TEXT, order_index INTEGER, FOREIGN KEY(topic_id) REFERENCES topics(topic_id))",
        );

        try {
          await db.runAsync(
            "ALTER TABLE topic_vocabulary ADD COLUMN part_of_speech TEXT",
          );
        } catch (e) {}

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS exercises (exercise_id INTEGER PRIMARY KEY AUTOINCREMENT, topic_id INTEGER NOT NULL, level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')), type TEXT NOT NULL CHECK (type IN ('sentence_builder', 'spelling', 'fill_blank_spelling')), prompt TEXT NOT NULL, context_sentence TEXT, order_index INTEGER, xp INTEGER DEFAULT 5, FOREIGN KEY(topic_id) REFERENCES topics(topic_id))",
        );

        try {
          await db.runAsync(
            "ALTER TABLE exercises ADD COLUMN xp INTEGER DEFAULT 5",
          );
        } catch (e) {}

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS exercise_answers (answer_id INTEGER PRIMARY KEY AUTOINCREMENT, exercise_id INTEGER NOT NULL, answer_text TEXT NOT NULL, is_primary INTEGER DEFAULT 0, match_type TEXT DEFAULT 'exact' CHECK (match_type IN ('exact', 'case_insensitive', 'fuzzy')), FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id))",
        );

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS exercise_tokens (exercise_token_id INTEGER PRIMARY KEY AUTOINCREMENT, exercise_id INTEGER NOT NULL, token TEXT NOT NULL, correct_position INTEGER NOT NULL, FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id))",
        );

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS user_exercise_progress (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, exercise_id INTEGER NOT NULL, is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)), attempts_count INTEGER NOT NULL DEFAULT 0, completed_at TEXT, recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, exercise_id), FOREIGN KEY (user_id) REFERENCES user_profiles(user_id), FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id))",
        );

        try {
          await db.runAsync(
            "ALTER TABLE user_exercise_progress ADD COLUMN recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
          );
        } catch (e) {}

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS user_level_progress (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, topic_id INTEGER NOT NULL, level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')), completed_count INTEGER NOT NULL DEFAULT 0, is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)), completed_at TEXT, UNIQUE(user_id, topic_id, level), FOREIGN KEY (user_id) REFERENCES user_profiles(user_id), FOREIGN KEY (topic_id) REFERENCES topics(topic_id))",
        );

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS app_kv (key TEXT PRIMARY KEY, value TEXT)",
        );

        return db;
      } catch (error) {
        dbPromise = null;
        throw error;
      }
    })();
  }

  return dbPromise;
}

export async function importJourneyData() {
  const db = await getDatabase();
  await seedJourneys(db);
}

export async function importTopicData() {
  const db = await getDatabase();
  await seedTopics(db);
}

export async function importTopicIntroData() {
  const db = await getDatabase();
  await seedTopicIntros(db);
}

export async function importTopicVocabularyData() {
  const db = await getDatabase();
  await seedTopicVocabulary(db);
}

export async function importExerciseData() {
  const db = await getDatabase();
  await seedExercises(db);
}

export async function importExerciseTokenData() {
  const db = await getDatabase();
  await seedExerciseTokens(db);
}

export async function importUserProfileData() {
  const db = await getDatabase();
  await seedUserProfiles(db);
}

export async function importUserExerciseProgressData() {
  const db = await getDatabase();
  await seedUserExerciseProgress(db);
}

export async function isDataImported(): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync(
    "SELECT (SELECT COUNT(*) FROM journeys) as journeys, (SELECT COUNT(*) FROM topics) as topics, (SELECT COUNT(*) FROM exercises) as exercises",
  );
  if (!result) return false;
  return (
    (result.journeys ?? 0) > 0 &&
    (result.topics ?? 0) > 0 &&
    (result.exercises ?? 0) > 0
  );
}

export async function hasSeenTutorial(): Promise<boolean> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
      "SELECT value FROM app_kv WHERE key = ?",
      "tutorial_seen",
    );
    return row?.value === "1";
  } catch {
    return true;
  }
}

export async function markTutorialSeen(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      "INSERT INTO app_kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      "tutorial_seen",
      "1",
    );
  } catch (error) {
    console.error("Failed to mark tutorial seen", error);
  }
}

export async function resetTutorialSeen(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM app_kv WHERE key = ?", "tutorial_seen");
  } catch (error) {
    console.error("Failed to reset tutorial flag", error);
  }
}
