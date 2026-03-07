import { newDb } from "./firebase";
import { FieldValue } from "firebase-admin/firestore";

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
        migrationStatus: "start",
        migration,

        lastTestCursor: null,
        lastMotherCursor: null,

        partiallyMigrated: false,
        fullyMigrated: false,

        createdOn: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        completedAt: null,
        errorLog: null,
      },
    },
    { merge: true }
  );
}

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
    updateData["migration.completedAt"] = FieldValue.serverTimestamp();
  }

  if (status === "failed") {
    updateData["migration.errorLog"] = errorLog;
  }

  await newDb.collection("users").doc(userId).update(updateData);
}

export async function markPartiallyMigrated(userId: string) {
  await newDb.collection("users").doc(userId).update({
    "migration.partiallyMigrated": true,
    "migration.updatedAt": FieldValue.serverTimestamp(),
  });
}

export async function updateTestCursor(
  userId: string,
  cursor: string
) {
  await newDb.collection("users").doc(userId).update({
    "migration.lastTestCursor": cursor,
    "migration.updatedAt": FieldValue.serverTimestamp(),
  });
}

export async function updateMotherCursor(
  userId: string,
  cursor: string
) {
  await newDb.collection("users").doc(userId).update({
    "migration.lastMotherCursor": cursor,
    "migration.updatedAt": FieldValue.serverTimestamp(),
  });
}

export async function markFullyMigrated(userId: string) {
  await newDb.collection("users").doc(userId).update({
    "migration.fullyMigrated": true,
    "migration.migrationStatus": "completed",
    "migration.completedAt": FieldValue.serverTimestamp(),
    "migration.updatedAt": FieldValue.serverTimestamp(),
  });
}