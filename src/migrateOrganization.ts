import { oldDb, newDb } from "./firebase";

export async function migrateOrganization(organizationId: string) {
  console.log("Migrating organization:", organizationId);

  // Directly fetch by doc ID (correct for your schema)
  const orgDoc = await oldDb
    .collection("users")
    .doc(organizationId)
    .get();

  if (!orgDoc.exists) {
    console.warn("Organization not found:", organizationId);
    return;
  }

  const data = orgDoc.data();

  if (data?.type !== "organization") {
    console.warn("Doc is not organization:", organizationId);
    return;
  }

  await newDb
    .collection("organizations")
    .doc(organizationId)
    .set(data, { merge: true });

  console.log("Organization migrated:", organizationId);
}
