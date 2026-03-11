import { serve } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.0.0/dist/module/index.js";
import { createClient } from "@supabase/supabase-js";

const url = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(url, key);

serve(async (req) => {
  const { action, payload } = await req.json();
  if (action === "pdfToText") {
    const text = "Conversion PDF -> texte (placeholder).";
    return new Response(JSON.stringify({ success: true, text }), { status: 200 });
  }
  return new Response(JSON.stringify({ success: false, message: "Action non supportée" }), { status: 400 });
});
