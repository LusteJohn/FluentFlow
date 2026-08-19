import { seedJourneys } from "@/backend/Journey";
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
          "CREATE TABLE IF NOT EXISTS journeys (journey_id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, icon TEXT, order_index INTEGER)",
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
