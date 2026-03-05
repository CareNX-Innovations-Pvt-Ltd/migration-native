import { newDb } from "./firebase";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Initialize migration map inside user doc
 */
export async function startMigration(
  userId: string,
  migration: boolean,
  isNewUser: boolean

) {
  const ref = newDb.collection("users").doc(userId);

  await ref.set(
    {
      isNewUser,
      migration: {
        migrationStatus: "start", // start | ongoing | completed | failed
        migration, // true / false

        createdOn: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        completedAt: null,
        errorLog: null,
      },
    },
    { merge: true }
  );
}

/**
 * Update status
 */
export async function updateMigrationStatus(
  userId: string,
  status: "ongoing" | "completed" | "failed" | "not applicable",
  errorLog: any = null
) {
  const updateData: any = {
    "migration.migrationStatus": status,
    "migration.updatedAt": FieldValue.serverTimestamp(),
  };

  if (status === "completed") {
    updateData["migration.completedAt"] =
      FieldValue.serverTimestamp();
  }

  if (status === "failed") {
    updateData["migration.errorLog"] = errorLog;
  }

  await newDb
    .collection("users")
    .doc(userId)
    .update(updateData);
}
