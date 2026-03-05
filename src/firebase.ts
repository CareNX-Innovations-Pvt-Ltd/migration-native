import * as admin from "firebase-admin";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";
import * as fs from "fs";

// Initialize NEW project (default)
admin.initializeApp();

export const newDb = getFirestore(admin.app(), "fetosense-native");

// Load old project service account from root folder
const serviceAccountPath = path.join(
  __dirname,
  "..",
  // "old-service-account.json"
  "fetosense-v2-service-account.json"
);

if (!fs.existsSync(serviceAccountPath)) {
  // throw new Error("old-service-account.json not found at root of functions folder");
  throw new Error("fetosense-v2-service-account.json not found at root of functions folder");
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

// Initialize OLD project
const oldApp = initializeApp(
  {
    credential: cert(serviceAccount),
    // projectId: "fetosense-staging"
    projectId: "fetosense-v2"
  },
  "oldApp"
);

// export const oldDb = getFirestore(oldApp, "migration-primary");
export const oldDb = getFirestore(oldApp, "(default)");
