"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText, Upload, X } from "lucide-react";
import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
} from "react";

const ACCEPT = ".pdf,.docx";
const ACCEPT_MIME =
  "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback(
    (file: File | null) => {
      if (!file) {
        setSelectedFile(null);
        return;
      }
      const name = file.name.toLowerCase();
      if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
        return;
      }
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) validateAndSet(file);
    },
    [disabled, validateAndSet]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      validateAndSet(file ?? null);
      e.target.value = "";
    },
    [validateAndSet]
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    []
  );

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleChange}
        aria-label="选择 PDF 或 Word 文件"
      />
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragging && "border-primary bg-primary/5",
          !isDragging && "border-border bg-muted/30",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="size-10 text-primary" />
            <p className="text-sm font-medium text-foreground">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB · 点击或拖放可更换
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 gap-1"
              onClick={handleClear}
            >
              <X className="size-4" />
              清除
            </Button>
          </div>
        ) : (
          <>
            <Upload className="mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              拖放文件到此处，或点击上传
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              支持 .pdf、.docx
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              选择文件
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
