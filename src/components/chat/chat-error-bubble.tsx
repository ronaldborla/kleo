"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatErrorBubbleProps = {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
};

export function ChatErrorBubble({
  title,
  message,
  onRetry,
  className,
}: ChatErrorBubbleProps) {
  return (
    <div className={cn("flex justify-start", className)}>
      <div className="max-w-[85%] rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-2">
            <div>
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-destructive/90">{message}</p>
            </div>
            {onRetry ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/30 bg-background text-destructive hover:bg-destructive/10"
                onClick={onRetry}
              >
                Try again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
