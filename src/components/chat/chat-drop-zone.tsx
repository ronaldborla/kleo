"use client";

import { FileUp } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChatDropZoneProps = {
  children: ReactNode;
  onDropFile: (file: File) => void;
  disabled?: boolean;
};

export function ChatDropZone({
  children,
  onDropFile,
  disabled = false,
}: ChatDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const hasFiles = (event: React.DragEvent) =>
    Array.from(event.dataTransfer.types).includes("Files");

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || !hasFiles(event)) return;

    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;

    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || !hasFiles(event)) return;

    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    if (disabled) return;

    const file = event.dataTransfer.files[0];
    if (!file) return;

    onDropFile(file);
  };

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {isDragging && !disabled ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div
            className={cn(
              "flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-primary/5 px-8 py-10 text-center",
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileUp className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Drop your document here</p>
              <p className="text-xs text-muted-foreground">
                PDF, TXT, or Markdown up to 10 MB
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
