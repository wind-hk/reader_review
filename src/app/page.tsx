"use client";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { ReaderCardsModal } from "@/components/reader-cards-modal";
import { ReaderFeedbackView } from "@/components/reader-feedback-view";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  ParseAndAnalyzeResult,
  ReaderFeedback,
  SuggestedReader,
} from "@/types/reader";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { useCallback, useState } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ParseAndAnalyzeResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readerModalOpen, setReaderModalOpen] = useState(false);
  const [selectedReaders, setSelectedReaders] = useState<SuggestedReader[]>([]);
  const [feedbackByReaderId, setFeedbackByReaderId] = useState<
    Record<string, ReaderFeedback>
  >({});
  const [loadingReaderId, setLoadingReaderId] = useState<string | null>(null);
  const [currentReaderId, setCurrentReaderId] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    setResult(null);
    setFeedbackByReaderId({});
    setCurrentReaderId(null);
  }, []);

  const handleUploadAndAnalyze = useCallback(async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", selectedFile);
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "解析或分析失败");
        return;
      }
      setResult({
        extractedText: data.text,
        filename: data.filename,
        analysis: data.analysis,
        suggestedReaders: data.suggestedReaders ?? [],
      });
      setReaderModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析或分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile]);

  const handleSelectReader = useCallback(
    async (reader: SuggestedReader) => {
      if (!result?.extractedText) return;
      if (feedbackByReaderId[reader.id]) {
        setCurrentReaderId(reader.id);
        return;
      }
      setLoadingReaderId(reader.id);
      setCurrentReaderId(reader.id);
      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            extractedText: result.extractedText,
            reader,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error ?? "获取读者反馈失败");
          return;
        }
        setFeedbackByReaderId((prev) => ({ ...prev, [reader.id]: data }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取读者反馈失败");
      } finally {
        setLoadingReaderId(null);
      }
    },
    [result?.extractedText, feedbackByReaderId]
  );

  const handleReaderConfirm = useCallback(
    (readers: SuggestedReader[]) => {
      setSelectedReaders(readers);
      setReaderModalOpen(false);
      if (readers.length > 0 && result?.extractedText) {
        handleSelectReader(readers[0]);
      }
    },
    [result?.extractedText, handleSelectReader]
  );

  const allFeedback = Object.values(feedbackByReaderId);
  const hasAnyFeedback = allFeedback.length > 0;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* 顶部导航栏 */}
      <header className="flex h-14 shrink-0 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Reader Reaction
          </span>
        </div>
        <nav className="ml-8 flex gap-1">
          <Button variant="ghost" size="sm">
            文档
          </Button>
          <Button variant="ghost" size="sm">
            反馈
          </Button>
        </nav>
      </header>

      {/* 主工作区 */}
      <main className="flex min-h-0 flex-1">
        {/* 左侧：上传 / 文档展示区 */}
        <section className="flex w-1/2 flex-col border-r border-border">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              文档
            </h2>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!selectedFile || isAnalyzing}
              onClick={handleUploadAndAnalyze}
            >
              {isAnalyzing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {isAnalyzing ? "分析中…" : "上传并分析"}
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <FileUpload
              onFileSelect={handleFileSelect}
              disabled={isAnalyzing}
            />
            {error && (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            )}
            {result && (
              <div className="mt-4 rounded-lg border border-border bg-card p-4 text-card-foreground">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {result.filename} · 已提取文本
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed line-clamp-[20]">
                  {result.extractedText.slice(0, 3000)}
                  {result.extractedText.length > 3000 ? "…" : ""}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 右侧：AI 反馈区 */}
        <section className="flex w-1/2 flex-col bg-muted/20">
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-sm font-medium text-muted-foreground">
              AI 反馈
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {result ? (
              <>
                {selectedReaders.length > 0 && (
                  <div className="mb-4 rounded-lg border border-border bg-background p-4">
                    <h3 className="mb-2 text-sm font-medium text-foreground">
                      已选读者角色
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {selectedReaders.map((r) => (
                        <li key={r.id} className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground">
                            {r.name}
                            {r.isCustom && (
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                （自定义）
                              </span>
                            )}
                          </span>
                          {r.description && (
                            <span className="text-muted-foreground">
                              {r.description}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <ReaderFeedbackView
                  readers={selectedReaders}
                  feedbackByReaderId={feedbackByReaderId}
                  loadingReaderId={loadingReaderId}
                  currentReaderId={currentReaderId}
                  onSelectReader={handleSelectReader}
                />
              </>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-border bg-background p-8 text-center">
                <Sparkles className="mb-3 size-10 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  上传文档后将自动分析主题、语气与目标用户
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  选择读者身份即可获取该视角下的阅读反馈
                </p>
              </div>
            )}
          </div>

          {/* 底部：最终修改意见汇总 */}
          {hasAnyFeedback && (
            <div className="shrink-0 border-t border-border bg-background p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                最终修改意见汇总
              </h3>
              <div className="max-h-52 overflow-auto rounded-lg border border-border bg-muted/20 p-3 text-sm">
                {currentReaderId && feedbackByReaderId[currentReaderId] ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0 text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {feedbackByReaderId[currentReaderId].revisionSuggestions}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <ul className="space-y-2 text-muted-foreground">
                    {allFeedback.map((f) => (
                      <li key={f.readerId}>
                        <span className="font-medium text-foreground">
                          {f.readerName}：
                        </span>
                        <span className="line-clamp-2">
                          {f.revisionSuggestions.replace(/\s+/g, " ").slice(0, 120)}
                          …
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 建议读者弹窗 */}
      <ReaderCardsModal
        open={readerModalOpen}
        onClose={() => setReaderModalOpen(false)}
        suggestedReaders={result?.suggestedReaders ?? []}
        onConfirm={handleReaderConfirm}
      />
    </div>
  );
}
