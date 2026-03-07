import { setGlobalOptions } from "firebase-functions/v2";

/* MUST BE FIRST */
setGlobalOptions({
  memory: "2GiB",
  timeoutSeconds: 540,
});

export { migrateAllDevices } from "./migrateAllDevices";
export { onDeviceCreated } from "./onDeviceCreated";
export { migrateBatch } from "./migrateBatch";