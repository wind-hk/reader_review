/**
 * 在 Node/Next.js 服务端设置 PDF.js worker 路径，避免打包后相对路径找不到 worker 文件。
 * 必须在任何使用 pdf-parse / getDocument 的代码之前执行（通过先 import 本模块）。
 */
import path from "node:path";

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const workerPath = path.join(
  process.cwd(),
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
);
pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
