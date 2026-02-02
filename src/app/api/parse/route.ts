/**
 * 纯 API Route：解析上传的 PDF/Word，提取文本并交由 DeepSeek 分析。
 * 不在此文件中引用 pdfjs-dist；仅使用 pdf-parse 与 mammoth。
 */
import { analyzeDocumentWithLLM } from "@/lib/llm";
import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const runtime = "nodejs";

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isPdf(type: string, name: string): boolean {
  return type === PDF_MIME || name.toLowerCase().endsWith(".pdf");
}

function isDocx(type: string, name: string): boolean {
  return (
    type === DOCX_MIME ||
    name.toLowerCase().endsWith(".docx") ||
    name.toLowerCase().endsWith(".doc")
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "请上传文件", code: "MISSING_FILE" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "上传文件为空", code: "EMPTY_FILE" },
        { status: 400 }
      );
    }

    const type = file.type;
    const name = file.name.toLowerCase();

    if (!isPdf(type, name) && !isDocx(type, name)) {
      return NextResponse.json(
        {
          error: "仅支持 PDF 或 Word (.docx/.doc) 文件",
          code: "UNSUPPORTED_TYPE",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text: string;

    if (isPdf(type, name)) {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        text = result?.text ?? "";
      } finally {
        await parser.destroy();
      }
    } else {
      const result = await mammoth.extractRawText({ buffer });
      text = result?.value ?? "";
    }

    const trimmed = (text ?? "").trim();
    if (!trimmed) {
      return NextResponse.json(
        {
          error: "未能从文档中提取到文本",
          code: "NO_TEXT_EXTRACTED",
        },
        { status: 400 }
      );
    }

    const { analysis, suggestedReaders } = await analyzeDocumentWithLLM(
      trimmed
    );

    return NextResponse.json({
      text: trimmed,
      filename: file.name,
      analysis,
      suggestedReaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "解析或分析失败";
    console.error("Parse/analyze error:", err);
    return NextResponse.json(
      { error: message, code: "PARSE_OR_ANALYSIS_FAILED" },
      { status: 500 }
    );
  }
}
