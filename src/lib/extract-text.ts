import "@/lib/pdf-worker-setup";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function isPdf(type: string, name: string): boolean {
  return type === PDF_MIME || name.toLowerCase().endsWith(".pdf");
}

export function isDocx(type: string, name: string): boolean {
  return (
    type === DOCX_MIME ||
    name.toLowerCase().endsWith(".docx") ||
    name.toLowerCase().endsWith(".doc")
  );
}

export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = file.type;
  const name = file.name.toLowerCase();

  if (isPdf(type, name)) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (isDocx(type, name)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("仅支持 PDF 或 Word (.docx) 文件");
}
