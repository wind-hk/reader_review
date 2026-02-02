import { getReaderFeedback } from "@/lib/llm";
import type { ReaderFeedback, SuggestedReader } from "@/types/reader";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const extractedText = typeof body?.extractedText === "string" ? body.extractedText.trim() : "";
    const reader = body?.reader as SuggestedReader | undefined;

    if (!extractedText) {
      return NextResponse.json(
        { error: "文档内容为空", code: "EMPTY_TEXT" },
        { status: 400 }
      );
    }

    if (!reader || typeof reader.id !== "string" || typeof reader.name !== "string") {
      return NextResponse.json(
        { error: "请选择读者身份", code: "INVALID_READER" },
        { status: 400 }
      );
    }

    const provider = process.env.LLM_PROVIDER as "openai" | "anthropic" | "deepseek" | undefined;
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const useDeepSeek = !!deepseekKey && (provider === "deepseek" || (provider !== "openai" && provider !== "anthropic"));
    const useOpenAI = !!openaiKey && (provider === "openai" || (!provider && !deepseekKey));
    const useAnthropic = !!anthropicKey && (provider === "anthropic" || (!provider && !deepseekKey && !openaiKey));
    const apiKey = useDeepSeek ? deepseekKey! : useOpenAI ? openaiKey! : useAnthropic ? anthropicKey! : null;
    const prov: "openai" | "anthropic" | "deepseek" = useDeepSeek ? "deepseek" : useOpenAI ? "openai" : "anthropic";

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "未配置 LLM：请在环境变量中配置 DEEPSEEK_API_KEY、OPENAI_API_KEY 或 ANTHROPIC_API_KEY",
          code: "NO_LLM_CONFIG",
        },
        { status: 503 }
      );
    }

    const payload = await getReaderFeedback(
      extractedText,
      reader.name,
      reader.description ?? "",
      apiKey,
      prov,
      reader.isCustom ?? false
    );

    const result: ReaderFeedback = {
      readerId: reader.id,
      readerName: reader.name,
      firstImpressionScore: payload.firstImpressionScore,
      firstImpressionReason: payload.firstImpressionReason,
      readingFeeling: payload.readingFeeling,
      painPoints: payload.painPoints,
      revisionSuggestions: payload.revisionSuggestions,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取读者反馈失败";
    console.error("Feedback API error:", err);
    return NextResponse.json(
      { error: message, code: "FEEDBACK_FAILED" },
      { status: 500 }
    );
  }
}
