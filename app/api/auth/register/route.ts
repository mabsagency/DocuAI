import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { name, email, password, accessCode } = await request.json();

  if (!name || !email || !password || !accessCode) {
    return NextResponse.json({ success: false, message: "Tous les champs sont requis" }, { status: 400 });
  }

  if (accessCode !== "2007") {
    return NextResponse.json({ success: false, message: "Code d'accès incorrect." }, { status: 403 });
  }

  const { data: existing, error: checkError } = await supabase
    .from("User")
    .select("id")
    .eq("email", email)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    return NextResponse.json({ success: false, message: checkError.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ success: false, message: "Email déjà utilisé" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from("User")
    .insert({ name, email, password: hashed })
    .single();

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: { id: data.id, name: data.name, email: data.email } });
}
