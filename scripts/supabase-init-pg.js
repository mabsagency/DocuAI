import fs from "fs";
import path from "path";
import { Client } from "pg";

const supabaseDbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!supabaseDbUrl) {
  console.error("Missing SUPABASE_DB_URL or DATABASE_URL environment variable.");
  process.exit(1);
}

const sqlPath = path.resolve("scripts/supabase-init.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

async function run() {
  const client = new Client({ connectionString: supabaseDbUrl });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Supabase init SQL executed successfully.");
  } catch (err) {
    console.error("Supabase init SQL error:", err);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
