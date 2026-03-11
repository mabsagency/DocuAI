import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Document, Packer, Paragraph, TextRun } from "docx";
import mammoth from "mammoth";
import { ParquetWriter, ParquetSchema } from "parquetjs-lite";

export async function POST(request: Request) {
  const body = await request.json();
  const action = body.action;

  if (action === "image-to-pdf") {
    const imageData = body.image;
    if (!imageData) {
      return NextResponse.json({ success: false, message: "image required" }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();
    const imgBytes = imageData.split(",")[1];
    const imgType = imageData.match(/^data:(image\/[^;]+);/)?.[1] || "image/png";
    const imageBytes = Buffer.from(imgBytes, "base64");

    let image;
    if (imgType === "image/png") image = await pdfDoc.embedPng(imageBytes);
    else image = await pdfDoc.embedJpg(imageBytes);

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

    const output = await pdfDoc.save();
    const base64 = `data:application/pdf;base64,${Buffer.from(output).toString("base64")}`;

    return NextResponse.json({ success: true, result: base64 });
  }

  if (action === "pdf-to-text" || action === "pdf-to-parquet") {
    const pdfData = body.pdf;
    if (!pdfData) {
      return NextResponse.json({ success: false, message: "pdf required" }, { status: 400 });
    }

    const data = pdfData.split(",")[1];
    const bytes = new Uint8Array(Buffer.from(data, "base64"));
    const loadingTask = pdfjsLib.getDocument({ data: bytes as any });
    const pdf = await loadingTask.promise;

    let fullText = "";
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
      const page = await pdf.getPage(pageIndex);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += `Page ${pageIndex}\n${pageText}\n\n`;
    }

    if (action === "pdf-to-text") {
      return NextResponse.json({ success: true, text: fullText });
    }

    const schema = new ParquetSchema({ text: { type: "UTF8" } });
    const writer = await ParquetWriter.openFile(schema, ":memory:");
    await writer.appendRow({ text: fullText });
    await writer.close();
    const parquetBuffer = writer.buffer;
    const base64 = `data:application/octet-stream;base64,${Buffer.from(parquetBuffer).toString("base64")}`;

    return NextResponse.json({ success: true, parquet: base64 });
  }

  if (action === "pdf-to-word") {
    const pdfData = body.pdf;
    if (!pdfData) {
      return NextResponse.json({ success: false, message: "pdf required" }, { status: 400 });
    }

    const data = pdfData.split(",")[1];
    const bytes = new Uint8Array(Buffer.from(data, "base64"));
    const loadingTask = pdfjsLib.getDocument({ data: bytes as any });
    const pdf = await loadingTask.promise;

    let fullText = "";
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
      const page = await pdf.getPage(pageIndex);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += `Page ${pageIndex}\n${pageText}\n\n`;
    }

    const doc = new Document({
      sections: [{ properties: {}, children: [new Paragraph({ children: [new TextRun(fullText)] })] }]
    });
    const buffer = await Packer.toBuffer(doc);
    const base64 = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${Buffer.from(buffer).toString("base64")}`;
    return NextResponse.json({ success: true, word: base64 });
  }

  if (action === "word-to-pdf") {
    const wordData = body.word;
    if (!wordData) {
      return NextResponse.json({ success: false, message: "word required" }, { status: 400 });
    }

    const docxBytes = Buffer.from(wordData.split(",")[1], "base64");
    const result = await mammoth.extractRawText({ buffer: docxBytes });
    const lines = result.value.split("\n").filter(Boolean);

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(PDFDocument.StandardFonts.Helvetica);
    let y = 820;

    for (const line of lines) {
      page.drawText(line, { x: 40, y, size: 12, font });
      y -= 16;
      if (y < 40) {
        page = pdfDoc.addPage([595, 842]);
        y = 820;
      }
    }

    const output = await pdfDoc.save();
    const base64 = `data:application/pdf;base64,${Buffer.from(output).toString("base64")}`;
    return NextResponse.json({ success: true, pdf: base64 });
  }

  if (action === "pdf-to-images") {
    return NextResponse.json({ success: false, message: "pdf-to-images should run client side via pdfjs-dist" }, { status: 501 });
  }

  return NextResponse.json({ success: false, message: "action inconnue" }, { status: 400 });
}
