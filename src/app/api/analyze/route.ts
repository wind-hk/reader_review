/**
 * 与 /api/parse 一致：先加载 DOMMatrix polyfill 与 worker 设置，再解析并交由 DeepSeek 分析。
 */
import "@/lib/dommatrix-polyfill";
import "@/lib/pdf-worker-setup";
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

    let text: string;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());

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
    } catch (parseErr) {
      const message =
        parseErr instanceof Error ? parseErr.message : "未知解析错误";
      console.error("Document parse error:", parseErr);
      return NextResponse.json(
        {
          error: `文档解析失败：${message}`,
          code: "PARSE_FAILED",
        },
        { status: 500 }
      );
    }

    const trimmed = (text ?? "").trim();
    if (!trimmed) {
      return NextResponse.json(
        {
          error: "未能从文档中提取到文本，请确认文件内容有效且非扫描版图片",
          code: "NO_TEXT_EXTRACTED",
        },
        { status: 400 }
      );
    }

    const { analysis, suggestedReaders } = await analyzeDocumentWithLLM(
      trimmed
    );

    return NextResponse.json({
      filename: file.name,
      extractedText: trimmed,
      analysis,
      suggestedReaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "分析失败";
    console.error("Analyze error:", err);
    return NextResponse.json(
      {
        error: message,
        code: "ANALYSIS_FAILED",
      },
      { status: 500 }
    );
  }
}
