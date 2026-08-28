import { FileText, MessageSquareText } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted/40">
        <MessageSquareText className="size-7 text-muted-foreground" />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-semibold">Upload a document to get started</h2>
        <p className="text-sm text-muted-foreground">
          Attach a PDF, TXT, or Markdown file, then ask questions. Kleo will
          answer with citations and expandable evidence cards.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="size-4" />
        Supported formats: PDF, TXT, Markdown
      </div>
    </div>
  );
}
