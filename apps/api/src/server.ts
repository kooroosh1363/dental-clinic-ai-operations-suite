import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createDatabase } from "./db/database.js";
import { seedDatabase } from "./seed.js";

const config = loadConfig();
const db = await createDatabase(config.DATABASE_URL, config.PGLITE_DATA_DIR);
await seedDatabase(db);
const app = buildApp(db, config);

const shutdown = async () => {
  await app.close();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ port: config.PORT, host: "0.0.0.0" });
