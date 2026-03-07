import { PubSub } from "@google-cloud/pubsub";

const pubsub = new PubSub();

const TOPIC = "migration-batch";

export async function publishMigrationBatch(payload: any) {
  const topic = pubsub.topic(TOPIC);

  const dataBuffer = Buffer.from(JSON.stringify(payload));

  await topic.publish(dataBuffer);

  console.log("Published next migration batch");
}