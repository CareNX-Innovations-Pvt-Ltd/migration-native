import { WriteBatch } from "firebase-admin/firestore";

export async function processInBatches(
  query: FirebaseFirestore.Query,
  handler: (
    doc: FirebaseFirestore.QueryDocumentSnapshot,
    batch: WriteBatch
  ) => Promise<void>,
  targetDb: FirebaseFirestore.Firestore,
  batchSize = 50
) {
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let batchCount = 0;
  let totalDocs = 0;

  async function commitWithRetry(
    batch: WriteBatch,
    retries = 3
  ): Promise<void> {
    try {
      await batch.commit();
    } catch (err) {
      if (retries > 0) {
        console.log("Retrying batch commit...");
        await new Promise((r) => setTimeout(r, 2000));
        return commitWithRetry(batch, retries - 1);
      }
      throw err;
    }
  }

  while (true) {
    let q = query.limit(batchSize);
    if (lastDoc) q = q.startAfter(lastDoc);

    console.log(`Fetching batch ${batchCount + 1}...`);

    const snapshot = await q.get();

    console.log(`Batch ${batchCount + 1} size:`, snapshot.size);

    if (snapshot.empty) {
      console.log("No more documents. Migration finished.");
      break;
    }

    const batch = targetDb.batch();

    for (const doc of snapshot.docs) {
      handler(doc, batch);
      totalDocs++;
    }

    console.log(
      `Committing batch ${batchCount + 1} with ${snapshot.size} docs`
    );

    await commitWithRetry(batch);

    batchCount++;

    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    console.log(`Total migrated so far: ${totalDocs}`);
  }

  console.log(`Migration done. Total docs migrated: ${totalDocs}`);
}