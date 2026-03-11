/*
  Run this script after setting SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment vars.
  `node scripts/supabase-init.js`
*/

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE settings. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runScript() {
  const sqlFile = path.resolve("scripts/supabase-init.sql");
  const sql = fs.readFileSync(sqlFile, "utf8");

  const { data, error } = await supabase.rpc("sql", { query: sql });

  if (error) {
    console.error("Supabase init error:", error);
    process.exit(1);
  }

  console.log("Supabase init script executed.", data);
}

runScript().catch((err) => {
  console.error(err);
  process.exit(1);
});
