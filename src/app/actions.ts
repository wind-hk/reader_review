"use server";

import { getReaderFeedback } from "@/lib/llm";
import type { ReaderFeedback, SuggestedReader } from "@/types/reader";

export async function fetchReaderFeedback(
  extractedText: string,
  reader: SuggestedReader
): Promise<ReaderFeedback> {
  if (!extractedText.trim()) throw new Error("文档内容为空");
  const provider = process.env.LLM_PROVIDER as "openai" | "anthropic" | "deepseek" | undefined;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const useDeepSeek = !!deepseekKey && (provider === "deepseek" || provider !== "openai" && provider !== "anthropic");
  const useOpenAI = !!openaiKey && (provider === "openai" || (!provider && !deepseekKey));
  const useAnthropic = !!anthropicKey && (provider === "anthropic" || (!provider && !deepseekKey && !openaiKey));
  const apiKey = useDeepSeek ? deepseekKey! : useOpenAI ? openaiKey! : useAnthropic ? anthropicKey! : null;
  const prov: "openai" | "anthropic" | "deepseek" = useDeepSeek ? "deepseek" : useOpenAI ? "openai" : "anthropic";
  if (!apiKey) {
    throw new Error(
      "未配置 LLM：请在项目根目录创建 .env.local，并添加 DEEPSEEK_API_KEY、OPENAI_API_KEY 或 ANTHROPIC_API_KEY（可参考 .env.example）"
    );
  }
  const payload = await getReaderFeedback(
    extractedText,
    reader.name,
    reader.description,
    apiKey,
    prov,
    reader.isCustom ?? false
  );
  return {
    readerId: reader.id,
    readerName: reader.name,
    firstImpressionScore: payload.firstImpressionScore,
    firstImpressionReason: payload.firstImpressionReason,
    readingFeeling: payload.readingFeeling,
    painPoints: payload.painPoints,
    revisionSuggestions: payload.revisionSuggestions,
  };
}
