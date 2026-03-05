import { onRequest } from "firebase-functions/v2/https";
import { oldDb, newDb } from "./firebase";
import { processInBatches } from "./helpers";

export const migrateAllDevices = onRequest(async (req, res) => {
  const query = oldDb.collection("devices");

  await processInBatches(query, async (doc, batch) => {
    batch.set(newDb.collection("devices").doc(doc.id), doc.data(), { merge: true });
  }, newDb);

  res.send("Devices migrated successfully");
});
