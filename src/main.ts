import { ClientTCP } from "./client-tcp";

const client = new ClientTCP({ host: "localhost", port: 4001 });

(async function main() {
  console.log("--> before emit");
  try {
    await client.emit("messages.test.accept", 123);
  } catch (err) {
    console.error(err);
  }
  console.log("--> after emit");

  console.log("--> before send");
  const response = await client.send<{ test: string; hello: string }>(
    "messages.test.accept",
    123
  );
  console.log("--> after send", response);
})();
