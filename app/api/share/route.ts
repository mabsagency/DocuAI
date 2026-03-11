import { NextResponse } from "next/server";

const sharedData = new Map<string, string>();

export async function POST(request: Request) {
  const body = await request.json();
  const type = body.type || "image";
  const data = body.data;

  if (!data) {
    return NextResponse.json({ success: false, message: "data required" }, { status: 400 });
  }

  const token = crypto.randomUUID();
  sharedData.set(token, data);

  return NextResponse.json({ success: true, shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/share?doc=${token}`, token, type });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const doc = url.searchParams.get("doc");
  if (!doc) {
    return NextResponse.json({ success: false, message: "doc missing" }, { status: 400 });
  }

  const data = sharedData.get(doc);
  if (!data) {
    return NextResponse.json({ success: false, message: "not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data });
}
