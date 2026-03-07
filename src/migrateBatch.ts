import { onMessagePublished } from "firebase-functions/v2/pubsub";

import { migrateTests } from "./migrateTests";
import { migrateMothers } from "./migrateMothers";
import { markFullyMigrated, markPartiallyMigrated } from "./migrationTracker";
import { newDb } from "./firebase";
import { publishMigrationBatch } from "./migrationQueue";

export const migrateBatch = onMessagePublished(
  {
    topic: "migration-batch",
  },
  async (event) => {
    const data = JSON.parse(
      Buffer.from(event.data.message.data, "base64").toString()
    );

    const { userId, organizationId, deviceName } = data;

    console.log("Running migration batch for:", deviceName);

    const userDoc = await newDb.collection("users").doc(userId).get();

    const migration = userDoc.data()?.migration || {};

    const lastTestCursor = migration.lastTestCursor;
    const lastMotherCursor = migration.lastMotherCursor;

    const hasMoreTests = await migrateTests(
      userId,
      organizationId,
      deviceName,
      lastTestCursor
    );

    const hasMoreMothers = await migrateMothers(
      userId,
      organizationId,
      deviceName,
      lastMotherCursor
    );

    // mark partial migration only once
    if (!migration.partiallyMigrated) {
      await markPartiallyMigrated(userId);
    }

    if (hasMoreTests || hasMoreMothers) {
      console.log("Scheduling next batch");

      await publishMigrationBatch({
        userId,
        organizationId,
        deviceName,
      });

      return;
    }

    console.log("Migration completed");

    await markFullyMigrated(userId);
  }
);