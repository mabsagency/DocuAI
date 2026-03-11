import { NextResponse } from "next/server";

let docs: Array<{ id: string; name: string; content: string; type: string; updatedAt: string }> = [];

export async function GET() {
  return NextResponse.json({ success: true, documents: docs });
}

export async function POST(request: Request) {
  const body = await request.json();
  const newDoc = {
    id: crypto.randomUUID(),
    name: body.name || `Document-${docs.length + 1}`,
    content: body.content || "",
    type: body.type || "pdf",
    updatedAt: new Date().toISOString(),
  };
  docs = [newDoc, ...docs];
  return NextResponse.json({ success: true, document: newDoc });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, message: "id required" }, { status: 400 });
  docs = docs.filter((doc) => doc.id !== id);
  return NextResponse.json({ success: true, id });
}
