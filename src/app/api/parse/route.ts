import "@/lib/pdf-worker-setup";
import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const type = file.type;
    const name = file.name.toLowerCase();

    let text: string;

    if (type === "application/pdf" || name.endsWith(".pdf")) {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        text = result.text;
      } finally {
        await parser.destroy();
      }
    } else if (
      type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx") ||
      name.endsWith(".doc")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json(
        { error: "仅支持 PDF 或 Word (.docx) 文件" },
        { status: 400 }
      );
    }

    return NextResponse.json({ text, filename: file.name });
  } catch (err) {
    console.error("Parse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "解析失败" },
      { status: 500 }
    );
  }
}
