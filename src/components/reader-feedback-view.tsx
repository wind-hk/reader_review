"use client";

import { FeedbackCard } from "@/components/feedback-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReaderFeedback, SuggestedReader } from "@/types/reader";
import { Loader2, MessageSquare, User } from "lucide-react";

export interface ReaderFeedbackViewProps {
  readers: SuggestedReader[];
  feedbackByReaderId: Record<string, ReaderFeedback>;
  loadingReaderId: string | null;
  currentReaderId: string | null;
  onSelectReader: (reader: SuggestedReader) => void;
  className?: string;
}

export function ReaderFeedbackView({
  readers,
  feedbackByReaderId,
  loadingReaderId,
  currentReaderId,
  onSelectReader,
  className,
}: ReaderFeedbackViewProps) {
  const currentFeedback = currentReaderId
    ? feedbackByReaderId[currentReaderId]
    : null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {readers.length > 0 && (
        <div className="shrink-0">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            选择读者身份获取反馈
          </p>
          <div className="flex flex-wrap gap-2">
            {readers.map((r) => {
              const isLoading = loadingReaderId === r.id;
              const hasFeedback = !!feedbackByReaderId[r.id];
              const isActive = currentReaderId === r.id;
              return (
                <Button
                  key={r.id}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  disabled={!!loadingReaderId}
                  onClick={() => onSelectReader(r)}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <User className="size-4" />
                  )}
                  {r.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {loadingReaderId && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">正在以该读者身份生成反馈…</span>
        </div>
      )}

      {currentFeedback && !loadingReaderId && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="size-4" />
            <span>
              来自「{currentFeedback.readerName}」的反馈
            </span>
          </div>

          {/* 一、阅读感受（先于修改建议） */}
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              阅读感受
            </h4>
            <p className="mb-2 text-2xl font-bold text-primary">
              {currentFeedback.firstImpressionScore}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / 10
              </span>
            </p>
            <p className="mb-3 text-sm text-muted-foreground">
              {currentFeedback.firstImpressionReason}
            </p>
            {(currentFeedback.readingFeeling || currentFeedback.painPoints) && (
              <FeedbackCard
                title=""
                className="mt-2 border-0 bg-transparent p-0 shadow-none"
              >
                {currentFeedback.readingFeeling || currentFeedback.painPoints || ""}
              </FeedbackCard>
            )}
          </div>

          {/* 二、修改建议 */}
          <FeedbackCard title="修改建议">
            {currentFeedback.revisionSuggestions}
          </FeedbackCard>
        </div>
      )}

      {!currentFeedback && !loadingReaderId && readers.length > 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          点击上方读者身份，获取该视角下的阅读反馈
        </div>
      )}
    </div>
  );
}
