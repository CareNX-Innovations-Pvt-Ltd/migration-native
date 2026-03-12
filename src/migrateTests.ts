import { oldDb, newDb } from "./firebase";
import { updateTestCursor } from "./migrationTracker";

const BATCH_SIZE = 1000;

export async function migrateTests(
  userId: string,
  organizationId: string,
  deviceName: string,
  lastCursor?: string
) {
  let query = oldDb
    .collection("tests")
    .where("organizationId", "==", organizationId)
    .where("deviceName", "==", deviceName)
    .orderBy("createdOn", "desc")
    .limit(BATCH_SIZE);

  if (lastCursor) {
    const cursorDoc = await oldDb.collection("tests").doc(lastCursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snap = await query.get();

  if (snap.empty) {
    console.log("No more tests to migrate");
    return false;
  }

  const chunkSize = 50;

  for (let i = 0; i < snap.docs.length; i += chunkSize) {
    const batch = newDb.batch();

    const chunk = snap.docs.slice(i, i + chunkSize);

    for (const doc of chunk) {
      const data = doc.data();

      let testType = "nst";

      if (Array.isArray(data.tocoEntries) && data.tocoEntries.length > 0) {
        const sum = data.tocoEntries.reduce((acc: number, val: number) => acc + val, 0);
        const avg = sum / data.tocoEntries.length;

        if (avg > 10) {
          testType = "ctg";
        }
      }

      const newData = {
        ...data,
        testType,
      };

      batch.set(
        newDb.collection("tests").doc(doc.id),
        newData,
        { merge: true }
      );
    }

    await batch.commit();
  }

  const lastDoc = snap.docs[snap.docs.length - 1];

  await updateTestCursor(userId, lastDoc.id);

  console.log("Migrated tests batch:", snap.size);

  return snap.size === BATCH_SIZE;
}