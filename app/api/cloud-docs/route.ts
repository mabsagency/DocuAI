import { NextResponse } from "next/server";
import { checkRateLimit } from "../../../lib/rateLimit";
import { supabase } from "../../../lib/supabase";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json({ success: false, message: rl.message }, { status: 429 });
  }

  const url = new URL(request.url);
  const folder = url.searchParams.get("folder") || "";
  const q = url.searchParams.get("q") || "";
  const sort = url.searchParams.get("sort") || "updated";

  let queryBuilder = supabase.from("Document").select("*");
  if (folder) queryBuilder = queryBuilder.eq("folder", folder);
  if (q) queryBuilder = queryBuilder.or(`name.ilike.%${q}%,content.ilike.%${q}%`);
  if (sort === "name") queryBuilder = queryBuilder.order("name", { ascending: true });
  else if (sort === "created") queryBuilder = queryBuilder.order("created_at", { ascending: false });
  else queryBuilder = queryBuilder.order("updated_at", { ascending: false });

  const { data, error } = await queryBuilder;
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, docs: data });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json({ success: false, message: rl.message }, { status: 429 });
  }

  const body = await request.json();
  const name = body.name || `Document-${Date.now()}`;
  const folder = body.folder || "root";
  const content = body.content || "";
  const type = body.type || "pdf";
  const ownerId = body.ownerId || null;

  const { data, error } = await supabase
    .from("Document")
    .insert({ owner_id: ownerId, name, folder, content, type })
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, doc: data });
}

export async function DELETE(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json({ success: false, message: rl.message }, { status: 429 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, message: "id required" }, { status: 400 });

  const { data, error } = await supabase.from("Document").delete().eq("id", id).single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 404 });

  return NextResponse.json({ success: true, id: data.id });
}
