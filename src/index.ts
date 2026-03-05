import { setGlobalOptions } from "firebase-functions/v2";

/* MUST BE FIRST */
setGlobalOptions({
  memory: "1GiB",
  timeoutSeconds: 540,
});

export { migrateAllDevices } from "./migrateAllDevices";
export { onDeviceCreated } from "./onDeviceCreated";