import { WriteBatch } from "firebase-admin/firestore";

export async function processInBatches(
  query: FirebaseFirestore.Query,
  handler: (doc: FirebaseFirestore.QueryDocumentSnapshot, batch: WriteBatch) => Promise<void>,
  targetDb: FirebaseFirestore.Firestore,
  batchSize = 100
) {
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (true) {
    let q = query.limit(batchSize);
    if (lastDoc) q = q.startAfter(lastDoc);

    const snapshot = await q.get();
    if (snapshot.empty) break;

    const batch = targetDb.batch();

    for (const doc of snapshot.docs) {
    await handler(doc, batch);
    }
//     await Promise.all(
//   snapshot.docs.map((doc) => handler(doc, batch))
// );

    await batch.commit();
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }
}
