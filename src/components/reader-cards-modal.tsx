"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SuggestedReader } from "@/types/reader";
import { Check, User, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export interface ReaderCardsModalProps {
  open: boolean;
  onClose: () => void;
  suggestedReaders: SuggestedReader[];
  onAddCustomReader?: (name: string, description: string) => void;
  onConfirm?: (readers: SuggestedReader[]) => void;
}

export function ReaderCardsModal({
  open,
  onClose,
  suggestedReaders,
  onAddCustomReader,
  onConfirm,
}: ReaderCardsModalProps) {
  const [readers, setReaders] = useState<SuggestedReader[]>(suggestedReaders);
  const [selectedId, setSelectedId] = useState<string | null>(() => suggestedReaders[0]?.id ?? null);

  useEffect(() => {
    if (open && suggestedReaders.length > 0) {
      setReaders(suggestedReaders);
      setSelectedId(suggestedReaders[0]?.id ?? null);
    }
  }, [open, suggestedReaders]);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");

  const handleAddCustom = useCallback(() => {
    const name = customName.trim();
    const desc = customDesc.trim();
    if (!name) return;
    const newReader: SuggestedReader = {
      id: `custom-${Date.now()}`,
      name,
      description: desc || "自定义读者视角",
      isCustom: true,
    };
    setReaders((prev) => [...prev, newReader]);
    setSelectedId(newReader.id);
    onAddCustomReader?.(name, desc);
    setCustomName("");
    setCustomDesc("");
  }, [customName, customDesc, onAddCustomReader]);

  const handleRemove = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReaders((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? null);
      }
      return next;
    });
  }, [selectedId]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const selectedReaders = selectedId
    ? readers.filter((r) => r.id === selectedId)
    : [];

  const handleConfirm = useCallback(() => {
    onConfirm?.(selectedReaders);
    onClose();
  }, [selectedReaders, onConfirm, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-modal-title"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 p-6 pb-0">
          <h2
            id="reader-modal-title"
            className="mb-2 text-lg font-semibold text-card-foreground"
          >
            建议读者身份
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            每次只能选择一个角色，点击卡片即可选中或取消选中。自定义角色可移除；填写后点击底部「确认添加」加入列表并自动选中
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            {readers.map((r) => {
              const isSelected = selectedId === r.id;
              return (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectOne(r.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleSelectOne(r.id)}
                  className={cn(
                    "relative flex cursor-pointer flex-col rounded-lg border p-4 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-muted/30 hover:border-muted-foreground/30",
                    r.isCustom && isSelected && "border-primary/50 bg-primary/10"
                  )}
                >
                  {r.isCustom && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 size-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleRemove(r.id, e)}
                      aria-label={`移除 ${r.name}`}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                  {isSelected && (
                    <div className={cn("absolute top-2.5 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center", r.isCustom ? "right-9" : "right-2.5")}>
                      <Check className="size-3" />
                    </div>
                  )}
                  <div className={cn("mb-2 flex items-center gap-2", isSelected ? "pr-10" : r.isCustom ? "pr-10" : "pr-2")}>
                    <User className="size-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium text-card-foreground">{r.name}</span>
                    {r.isCustom && (
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                        自定义
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mb-4 rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <p className="mb-3 text-sm font-medium text-foreground">
              添加自定义读者
            </p>
            <p className="mb-2 text-xs text-muted-foreground">
              填写身份名称与描述后，点击「确认添加」将该角色加入列表并自动选中
            </p>
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-[1fr,2fr,auto] sm:items-end">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">身份名称</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                    placeholder="例如：严格的审稿人"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    描述（选填）
                  </label>
                  <input
                    type="text"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                    placeholder="该读者会如何审阅此文"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={handleAddCustom}
                  disabled={!customName.trim()}
                >
                  <UserPlus className="size-4" />
                  确认添加
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedId
              ? "当前选中 1 位读者，点击「确认并继续」将进入分析"
              : "请点击上方卡片选择一个角色，或添加自定义角色"}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              关闭
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedId}>
              确认并继续
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
