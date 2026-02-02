export interface DocumentAnalysis {
  theme: string;
  tone: string;
  targetAudience: string;
}

export interface SuggestedReader {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
}

export interface ParseAndAnalyzeResult {
  extractedText: string;
  filename: string;
  analysis: DocumentAnalysis;
  suggestedReaders: SuggestedReader[];
}

/** 单次读者反馈（由 AI 模拟该身份给出） */
export interface ReaderFeedback {
  readerId: string;
  readerName: string;
  firstImpressionScore: number;
  firstImpressionReason: string;
  /** 阅读感受（先于修改建议展示） */
  readingFeeling: string;
  /** 兼容旧字段，可与 readingFeeling 合并展示 */
  painPoints?: string;
  revisionSuggestions: string;
}
