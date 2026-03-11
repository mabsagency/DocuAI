import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: true, uptime: process.uptime(), timestamp: Date.now() });
}
