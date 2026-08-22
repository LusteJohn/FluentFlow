import { seedJourneys } from "@/backend/Journey";
import { seedTopics } from "@/backend/Topic";
import { seedTopicIntros } from "@/backend/TopicIntro";
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
          "CREATE TABLE IF NOT EXISTS journeys (journey_id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, icon TEXT, bg_image TEXT, order_index INTEGER)",
        );

        try {
          await db.runAsync("ALTER TABLE journeys ADD COLUMN bg_image TEXT");
        } catch (e) {
        }

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS topics (topic_id INTEGER PRIMARY KEY AUTOINCREMENT, journey_id INTEGER NOT NULL, title TEXT NOT NULL, grammar_focus TEXT NOT NULL, order_index INTEGER, FOREIGN KEY(journey_id) REFERENCES journeys(journey_id))"
        )

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS topic_introduction (topic_intro_id INTEGER PRIMARY KEY AUTOINCREMENT, topic_id INTEGER NOT NULL, intro_text TEXT NOT NULL, example_sentence TEXT NOT NULL, FOREIGN KEY(topic_id) REFERENCES topics(topic_id))"
        )

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS topic_vocabulary (topic_vocabulary_id INTEGER PRIMARY KEY AUTOINCREMENT, topic_id INTEGER NOT NULL, word TEXT NOT NULL, definition TEXT NOT NULL, example_sentence TEXT NOT NULL, image TEXT, order_index INTEGER, FOREIGN KEY(topic_id) REFERENCES topics(topic_id))"
        )

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS exercises (exercise_id INTEGER PRIMARY KEY AUTOINCREMENT, topic_id INTEGER NOT NULL, level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')), type TEXT NOT NULL CHECK (type IN ('sentence_builder', 'spelling', 'fill_blank_spelling')), prompt TEXT NOT NULL, context_sentence TEXT, order_index INTEGER, FOREIGN KEY(topic_id) REFERENCES topics(topic_id))"
        )

        await db.runAsync(
          "CREATE TABLE IF NOT EXISTS exercise_answers (answer_id INTEGER PRIMARY KEY AUTOINCREMENT, exercise_id INTEGER NOT NULL, answer_text TEXT NOT NULL, is_primary INTEGER DEFAULT 0, match_type TEXT DEFAULT 'exact' CHECK (match_type IN ('exact', 'case_insensitive', 'fuzzy')), FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id))"
        )

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
