"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface FeedbackCardProps {
  title: string;
  children: string;
  className?: string;
}

export function FeedbackCard({ title, children, className }: FeedbackCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 text-card-foreground",
        className
      )}
    >
      {title ? (
        <h4 className="mb-2 text-sm font-semibold text-foreground">{title}</h4>
      ) : null}
      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {children || "—"}
        </ReactMarkdown>
      </div>
    </div>
  );
}
