// import { oldDb, newDb } from "./firebase";
// import { processInBatches } from "./helpers";

// export async function migrateTests(organizationId: string, deviceName: string) {
//   const query = oldDb
//     .collection("tests")
//     .where("organizationId", "==", organizationId)
//     .where("deviceName", "==", deviceName);

//   await processInBatches(query, async (doc, batch) => {
//     batch.set(newDb.collection("tests").doc(doc.id), doc.data(), { merge: true });
//   }, newDb);
// }
import { oldDb, newDb } from "./firebase";
import { processInBatches } from "./helpers";

// Only migrate tests created AFTER 31 Dec 2024
const MIGRATION_START_DATE = new Date("2025-01-01T00:00:00Z");

export async function migrateTests(organizationId: string, deviceName: string) {
  const query = oldDb
    .collection("tests")
    .where("organizationId", "==", organizationId)
    .where("deviceName", "==", deviceName)
    .where("createdOn", ">=", MIGRATION_START_DATE); // FILTER ADDED

  await processInBatches(
    query,
    async (doc, batch) => {
      batch.set(
        newDb.collection("tests").doc(doc.id),
        doc.data(),
        { merge: true }
      );
    },
    newDb
  );
}