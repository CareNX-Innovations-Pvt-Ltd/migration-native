import { oldDb, newDb } from "./firebase";

/**
 * Merge old device user data into new device user
 */
export async function migrateDeviceUser(
  newUserId: string,
  organizationId: string,
  deviceName: string
) {
  console.log("Migrating device user:", newUserId);

  // Find old device user
  const snap = await oldDb
    .collection("users")
    .where("type", "==", "device")
    .where("organizationId", "==", organizationId)
    .where("deviceName", "==", deviceName)
    .limit(1)
    .get();

  if (snap.empty) {
    console.warn("Old device user not found:", organizationId, deviceName);
    return;
  }

  const oldDoc = snap.docs[0];
  const oldData = oldDoc.data();

  // Merge into new DB user
  await newDb
    .collection("users")
    .doc(newUserId)
    .set(oldData, { merge: true });

  console.log("Device user migrated:", newUserId);
}
