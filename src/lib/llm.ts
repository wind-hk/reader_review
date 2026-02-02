import type { DocumentAnalysis, SuggestedReader } from "@/types/reader";

const MAX_TEXT_LENGTH = 12000;

const QUOTA_MESSAGE =
  "当前 API 配额已用尽或未开通计费。请到 OpenAI 控制台检查用量与账单：https://platform.openai.com/account/billing ；若已配置 Claude，可在 .env.local 中设置 LLM_PROVIDER=anthropic 并填入 ANTHROPIC_API_KEY 以改用 Claude。";

/** 将 OpenAI/Anthropic API 错误转为用户可读提示 */
function toFriendlyLLMError(err: unknown): Error {
  const str = String(err);
  if (str.includes("429") || str.includes("quota") || str.includes("exceeded your current quota")) {
    return new Error(QUOTA_MESSAGE);
  }
  if (err && typeof err === "object") {
    const status = "status" in err ? (err as { status?: number }).status : null;
    const code = "code" in err ? (err as { code?: string }).code : null;
    const type = "type" in err ? (err as { type?: string }).type : null;
    if (
      status === 429 ||
      code === "insufficient_quota" ||
      type === "insufficient_quota"
    ) {
      return new Error(QUOTA_MESSAGE);
    }
    if (status === 401 || code === "invalid_api_key") {
      return new Error("API Key 无效或已失效，请检查 .env.local 中的配置。");
    }
    const msg =
      "message" in err && typeof (err as { message?: string }).message === "string"
        ? (err as { message: string }).message
        : str;
    if (msg.length > 200) {
      return new Error(`API 调用失败：${msg.slice(0, 200)}…`);
    }
    return new Error(`API 调用失败：${msg}`);
  }
  return err instanceof Error ? err : new Error(str);
}

const ANALYSIS_PROMPT = `你是一位文档分析助手。根据下面提供的文档内容（可能被截断），分析并严格按以下 JSON 格式输出，不要包含其他文字或 markdown 标记：

{
  "theme": "文档主题（一句话概括）",
  "tone": "语气风格（如：正式、轻松、学术、口语化等）",
  "targetAudience": "目标用户（谁最适合阅读）",
  "suggestedReaders": [
    { "name": "读者身份名称", "description": "一句话描述该读者会如何审阅此文" },
    { "name": "读者身份名称", "description": "一句话描述" },
    { "name": "读者身份名称", "description": "一句话描述" }
  ]
}

要求：
- suggestedReaders 必须恰好 3 个，且具有区分度。
- 示例身份可参考：严苛的学术导师、挑剔的投资人、普通的吃瓜群众、领域专家、潜在客户、竞争对手等，根据文档内容选择最贴切的 3 种。
- 全部使用中文。`;

export interface AnalyzeResult {
  analysis: DocumentAnalysis;
  suggestedReaders: SuggestedReader[];
}

export async function analyzeDocumentWithLLM(
  extractedText: string
): Promise<AnalyzeResult> {
  const text =
    extractedText.length > MAX_TEXT_LENGTH
      ? extractedText.slice(0, MAX_TEXT_LENGTH) + "\n\n[内容已截断…]"
      : extractedText;

  const provider = process.env.LLM_PROVIDER as "openai" | "anthropic" | "deepseek" | undefined;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  const useDeepSeek = !!deepseekKey && (provider === "deepseek" || provider !== "openai" && provider !== "anthropic");
  const useOpenAI = !!openaiKey && (provider === "openai" || (!provider && !deepseekKey));
  const useAnthropic = !!anthropicKey && (provider === "anthropic" || (!provider && !deepseekKey && !openaiKey));

  if (useDeepSeek && deepseekKey) {
    try {
      return await analyzeWithDeepSeek(text, deepseekKey);
    } catch (e) {
      throw toFriendlyLLMError(e);
    }
  }
  if (useOpenAI && openaiKey) {
    try {
      return await analyzeWithOpenAI(text, openaiKey);
    } catch (e) {
      throw toFriendlyLLMError(e);
    }
  }
  if (useAnthropic && anthropicKey) {
    try {
      return await analyzeWithAnthropic(text, anthropicKey);
    } catch (e) {
      throw toFriendlyLLMError(e);
    }
  }

  throw new Error(
    "未配置 LLM：请在项目根目录创建 .env.local，并添加 DEEPSEEK_API_KEY（推荐）、OPENAI_API_KEY 或 ANTHROPIC_API_KEY（可参考 .env.example）"
  );
}

async function analyzeWithOpenAI(
  text: string,
  apiKey: string
): Promise<AnalyzeResult> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey });

  let response;
  try {
    response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: ANALYSIS_PROMPT },
      { role: "user", content: `文档内容：\n\n${text}` },
    ],
    response_format: { type: "json_object" },
  });
  } catch (e) {
    throw toFriendlyLLMError(e);
  }

  const raw = response!.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("OpenAI 返回为空");

  return parseAnalysisResponse(raw);
}

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

async function analyzeWithDeepSeek(
  text: string,
  apiKey: string
): Promise<AnalyzeResult> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey, baseURL: DEEPSEEK_BASE_URL });

  let response;
  try {
    response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [
        { role: "system", content: ANALYSIS_PROMPT },
        { role: "user", content: `文档内容：\n\n${text}` },
      ],
      response_format: { type: "json_object" },
    });
  } catch (e) {
    throw toFriendlyLLMError(e);
  }

  const raw = response!.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("DeepSeek 返回为空");
  return parseAnalysisResponse(raw);
}

async function analyzeWithAnthropic(
  text: string,
  apiKey: string
): Promise<AnalyzeResult> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: ANALYSIS_PROMPT,
    messages: [{ role: "user", content: `文档内容：\n\n${text}` }],
  });

  const block = response.content.find((b) => b.type === "text");
  const raw = block && block.type === "text" ? block.text.trim() : "";
  if (!raw) throw new Error("Anthropic 返回为空");

  return parseAnalysisResponse(raw);
}

/** 读者反馈：要求 AI 深度模拟该身份，返回结构化内容（先感受，再建议） */
export interface ReaderFeedbackPayload {
  firstImpressionScore: number;
  firstImpressionReason: string;
  readingFeeling: string;
  painPoints?: string;
  revisionSuggestions: string;
}

const READER_FEEDBACK_SYSTEM = `你正在深度模拟一位特定读者，对下方文档给出真实、犀利的阅读反馈。你必须完全代入该读者身份（职业、立场、关注点、说话习惯），用该身份的口吻和标准评判文档。

反馈分为两部分：先写阅读感受，再写修改建议。必须严格按以下 JSON 格式输出，不要包含其他文字或 markdown 代码块标记：
{
  "firstImpressionScore": 1到10的整数,
  "firstImpressionReason": "一两句话说明为何打这个分数",
  "readingFeeling": "阅读感受：以该读者身份写一段整体感受，包括读下来的第一印象、哪些地方让你满意或不满意、阅读中的困惑或槽点（费解、逻辑不通、语气不适等）。可引用原文。使用 Markdown 格式。",
  "revisionSuggestions": "修改建议：在感受之后，逐条给出具体、可执行的重写建议，最好带示例改写。使用 Markdown 格式。"
}

要求：
- firstImpressionScore 必须是 1-10 的整数。
- 先有感受（readingFeeling），再给建议（revisionSuggestions）。
- readingFeeling 和 revisionSuggestions 使用中文，支持 Markdown（列表、加粗、引用等）。
- 反馈要具体、可操作，避免空泛。`;

export async function getReaderFeedback(
  extractedText: string,
  readerName: string,
  readerDescription: string,
  apiKey: string,
  provider: "openai" | "anthropic" | "deepseek",
  isCustom = false
): Promise<ReaderFeedbackPayload> {
  const text =
    extractedText.length > MAX_TEXT_LENGTH
      ? extractedText.slice(0, MAX_TEXT_LENGTH) + "\n\n[内容已截断…]"
      : extractedText;

  const customHint = isCustom
    ? "【该读者身份由用户自定义】请根据其名称与描述推断该读者的立场、关注点与阅读偏好，并完全代入该视角给出反馈。\n\n"
    : "";
  const userContent = `${customHint}请以「${readerName}」的身份审阅以下文档。该读者的特点：${readerDescription}\n\n---\n\n文档内容：\n\n${text}`;

  if (provider === "deepseek") {
    return getReaderFeedbackDeepSeek(userContent, apiKey);
  }
  if (provider === "openai") {
    return getReaderFeedbackOpenAI(userContent, apiKey);
  }
  return getReaderFeedbackAnthropic(userContent, apiKey);
}

async function getReaderFeedbackOpenAI(
  userContent: string,
  apiKey: string
): Promise<ReaderFeedbackPayload> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey });

  let response;
  try {
    response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: READER_FEEDBACK_SYSTEM },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    });
  } catch (e) {
    throw toFriendlyLLMError(e);
  }

  const raw = response!.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("OpenAI 返回为空");
  return parseReaderFeedbackResponse(raw);
}

async function getReaderFeedbackDeepSeek(
  userContent: string,
  apiKey: string
): Promise<ReaderFeedbackPayload> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey, baseURL: DEEPSEEK_BASE_URL });

  let response;
  try {
    response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [
        { role: "system", content: READER_FEEDBACK_SYSTEM },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    });
  } catch (e) {
    throw toFriendlyLLMError(e);
  }

  const raw = response!.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("DeepSeek 返回为空");
  return parseReaderFeedbackResponse(raw);
}

async function getReaderFeedbackAnthropic(
  userContent: string,
  apiKey: string
): Promise<ReaderFeedbackPayload> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  let response;
  try {
    response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: READER_FEEDBACK_SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });
  } catch (e) {
    throw toFriendlyLLMError(e);
  }

  const block = response!.content.find((b) => b.type === "text");
  const raw = block && block.type === "text" ? block.text.trim() : "";
  if (!raw) throw new Error("Anthropic 返回为空");
  return parseReaderFeedbackResponse(raw);
}

function parseReaderFeedbackResponse(raw: string): ReaderFeedbackPayload {
  let data: {
    firstImpressionScore?: number;
    firstImpressionReason?: string;
    readingFeeling?: string;
    painPoints?: string;
    revisionSuggestions?: string;
  };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) data = JSON.parse(jsonMatch[0]) as typeof data;
    else throw new Error("读者反馈返回的不是有效 JSON");
  }
  const score = data.firstImpressionScore;
  const num =
    typeof score === "number"
      ? Math.min(10, Math.max(1, Math.round(score)))
      : 5;
  const readingFeeling = data.readingFeeling?.trim() || data.painPoints?.trim() || "";
  return {
    firstImpressionScore: num,
    firstImpressionReason: data.firstImpressionReason ?? "",
    readingFeeling,
    painPoints: data.painPoints,
    revisionSuggestions: data.revisionSuggestions ?? "",
  };
}

function parseAnalysisResponse(raw: string): AnalyzeResult {
  let data: {
    theme?: string;
    tone?: string;
    targetAudience?: string;
    suggestedReaders?: Array<{ name: string; description: string }>;
  };

  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) data = JSON.parse(jsonMatch[0]) as typeof data;
    else throw new Error("LLM 返回的不是有效 JSON");
  }

  const suggestedReaders: SuggestedReader[] = (data.suggestedReaders || [])
    .slice(0, 3)
    .map((r, i) => ({
      id: `suggested-${i}-${Date.now()}`,
      name: r.name || `读者 ${i + 1}`,
      description: r.description || "",
      isCustom: false,
    }));

  return {
    analysis: {
      theme: data.theme ?? "",
      tone: data.tone ?? "",
      targetAudience: data.targetAudience ?? "",
    },
    suggestedReaders,
  };
}
