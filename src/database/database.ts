import { Platform } from "react-native";

let SQLite: any = null;
if (Platform.OS !== "web") {
  try {
    SQLite = require("expo-sqlite");
  } catch (e) {
    console.warn("expo-sqlite native module not available. Build a custom dev client to use SQLite.");
  }
}

export async function getDatabase() {
  if (!SQLite) {
    throw new Error(
      "expo-sqlite is not available. Please build and run a custom dev client (npx expo prebuild && npx expo run:android) instead of Expo Go."
    );
  }

  const db = await SQLite.openDatabaseAsync("student.db");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL CHECK (age BETWEEN 0 AND 100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

export type User = {
  user_id: number;
  full_name: string;
  age: number;
  created_at: string;
  last_active_at: string;
};

export async function createUser(db: any, fullName: string, age: number): Promise<User> {
  const result = await db.runAsync(
    "INSERT INTO users (full_name, age) VALUES (?, ?)",
    fullName,
    age
  );
  const user = await getUserById(db, result.lastInsertRowId as number);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function getUserById(db: any, userId: number): Promise<User | null> {
  const result = await db.getFirstAsync(
    "SELECT * FROM users WHERE user_id = ?",
    userId
  );
  return result as User | null;
}

export async function getAllUsers(db: any): Promise<User[]> {
  const result = await db.getAllAsync("SELECT * FROM users ORDER BY created_at DESC");
  return result as User[];
}

export async function updateUser(
  db: any,
  userId: number,
  fullName: string,
  age: number
): Promise<User | null> {
  await db.runAsync(
    "UPDATE users SET full_name = ?, age = ?, last_active_at = CURRENT_TIMESTAMP WHERE user_id = ?",
    fullName,
    age,
    userId
  );
  return getUserById(db, userId);
}

export async function deleteUser(db: any, userId: number): Promise<void> {
  await db.runAsync("DELETE FROM users WHERE user_id = ?", userId);
}
