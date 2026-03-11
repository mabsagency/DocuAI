import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { checkRateLimit } from "../../../lib/rateLimit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json({ success: false, message: rl.message }, { status: 429 });
  }

  const body = await request.json();
  const imageBase64 = body.image;

  if (!imageBase64) {
    return NextResponse.json({ success: false, message: "image field is required" }, { status: 400 });
  }

  const worker = createWorker({
    logger: (m) => console.log("Tesseract", m)
  });

  try {
    console.log("OCR request", { ip, size: imageBase64.length, timestamp: new Date().toISOString() });
    await worker.load();
    await worker.loadLanguage("fra+eng");
    await worker.initialize("fra+eng");

    const { data } = await worker.recognize(imageBase64);
    await worker.terminate();

    return NextResponse.json({
      success: true,
      result: {
        text: data.text,
        words: data.words,
        lines: data.lines,
        confidence: data.confidence,
      },
    });
  } catch (error) {
    console.error("OCR error", error);
    return NextResponse.json({ success: false, message: "OCR processing failed" }, { status: 500 });
  }
}
