import { oldDb, newDb } from "./firebase";
import { updateMotherCursor } from "./migrationTracker";

const BATCH_SIZE = 1000;

export async function migrateMothers(
  userId: string,
  organizationId: string,
  deviceName: string,
  lastCursor?: string
) {
  let query = oldDb
    .collection("users")
    .where("type", "==", "mother")
    .where("organizationId", "==", organizationId)
    .where("deviceName", "==", deviceName)
    .orderBy("createdOn", "desc")
    .limit(BATCH_SIZE);

  if (lastCursor) {
    const cursorDoc = await oldDb.collection("users").doc(lastCursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snap = await query.get();

  if (snap.empty) {
    console.log("No more mothers");
    return false;
  }

  const chunkSize = 50;

for (let i = 0; i < snap.docs.length; i += chunkSize) {

  const batch = newDb.batch();

  const chunk = snap.docs.slice(i, i + chunkSize);

  for (const doc of chunk) {
    batch.set(
      newDb.collection("mothers").doc(doc.id),
      doc.data(),
      { merge: true }
    );
  }

  await batch.commit();

}

  const lastDoc = snap.docs[snap.docs.length - 1];

  await updateMotherCursor(userId, lastDoc.id);

  console.log("Migrated mothers batch:", snap.size);

  return snap.size === BATCH_SIZE;
}