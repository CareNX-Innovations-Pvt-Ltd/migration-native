import { oldDb, newDb } from "./firebase";
import { processInBatches } from "./helpers"; 

export async function migrateDoctors(organizationId: string) {
  const query = oldDb
    .collection("users")
    .where("type", "==", "doctor")
    .where("organizationId", "==", organizationId);

  await processInBatches(query, async (doc, batch) => {
    batch.set(newDb.collection("users").doc(doc.id), doc.data(), { merge: true });
  }, newDb);
}
