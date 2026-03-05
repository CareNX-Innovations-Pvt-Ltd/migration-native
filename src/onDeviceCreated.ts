import { onDocumentCreated } from "firebase-functions/v2/firestore";

import { migrateOrganization } from "./migrateOrganization";
import { migrateDoctors } from "./migrateDoctors";
import { migrateMothers } from "./migrateMothers";
import { migrateTests } from "./migrateTests";
import { migrateDeviceUser } from "./migrateDeviceUser";

import {
  startMigration,
  updateMigrationStatus,
} from "./migrationTracker";

import { oldDb } from "./firebase";

export const onDeviceCreated = onDocumentCreated(
  {
    document: "users/{userId}",
    database: "fetosense-native",
  },
  async (event) => {
    console.log("onDeviceCreated triggered");

    const data = event.data?.data();

    if (!data || data.type !== "device") {
      console.log("Not device. Skipping.");
      return;
    }

    const uid = event.params.userId;

    const email = data.email;

    if (!email) {
      console.error("Email missing in new device doc");
      return;
    }

    console.log("New device created:", {
      uid,
      email,
    });

    try {
      /* ---------------- FIND OLD DEVICE BY EMAIL ---------------- */

      const oldDeviceSnap = await oldDb
        .collection("users")
        .where("type", "==", "device")
        .where("email", "==", email)
        .limit(1)
        .get();

      /* ---------------- NOT FOUND ---------------- */

      if (oldDeviceSnap.empty) {
        console.warn("No old device found for:", email);

        await startMigration(uid, false, true);

        await updateMigrationStatus(uid, "not applicable", {
          message: "Old device not found",
          email,
        });

        return;
      }

      /* ---------------- FOUND ---------------- */

      const oldDoc = oldDeviceSnap.docs[0];
      const oldData = oldDoc.data();

      const organizationId = oldData.organizationId;
      const deviceName = oldData.deviceName;

      if (!organizationId || !deviceName) {
        throw new Error(
          "organizationId or deviceName missing in old record"
        );
      }

      console.log("Old device found:", {
        organizationId,
        deviceName,
      });

      /* ---------------- START MIGRATION ---------------- */

      await startMigration(uid, true, false);

      await updateMigrationStatus(uid, "ongoing");

      console.log("Migration started...");

      /* ---------------- MIGRATE DATA ---------------- */

      // Device user
      await migrateDeviceUser(uid, organizationId, deviceName);

      // Organization
      await migrateOrganization(organizationId);

      // Doctors
      await migrateDoctors(organizationId);

      // Mothers
      await migrateMothers(organizationId, deviceName);

      // Tests
      await migrateTests(organizationId, deviceName);

      /* ---------------- COMPLETE ---------------- */

      await updateMigrationStatus(uid, "completed");

      console.log("Migration completed:", uid);

    } catch (error: any) {
  console.error("Migration failed:", error);

  // Detect memory / timeout errors
  const isResourceError =
    error?.message?.includes("Memory") ||
    error?.message?.includes("memory") ||
    error?.message?.includes("timeout") ||
    error?.message?.includes("Deadline");

  await updateMigrationStatus(uid, "failed", {
    message: error?.message || "Unknown error",
    type: isResourceError ? "MEMORY_OR_RUNTIME" : "APPLICATION_ERROR",
    stack: error?.stack,
  });

  throw error;
}
  }
);
