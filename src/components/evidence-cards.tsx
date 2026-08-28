"use client";

import type { ShowEvidenceInput } from "@/lib/ai/tools";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

function relevanceVariant(relevance: ShowEvidenceInput["sources"][number]["relevance"]) {
  switch (relevance) {
    case "high":
      return "default" as const;
    case "medium":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function formatLocation(source: ShowEvidenceInput["sources"][number]) {
  if (source.page != null) return `Page ${source.page}`;
  if (source.section) return source.section;
  return "Document";
}

export function EvidenceCards({ data }: { data: ShowEvidenceInput }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{data.summary}</p>
      {data.sources.map((source, index) => (
        <Collapsible key={`${source.filename}-${index}`}>
          <Card className="overflow-hidden py-0">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50">
              <div className="min-w-0 space-y-1">
                <CardHeader className="p-0">
                  <CardTitle className="truncate text-sm font-medium">
                    {source.filename}
                  </CardTitle>
                </CardHeader>
                <p className="text-xs text-muted-foreground">
                  {formatLocation(source)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={relevanceVariant(source.relevance)}>
                  {source.relevance}
                </Badge>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="border-t pt-0 pb-4">
                <blockquote className="mt-3 border-l-2 pl-3 text-sm text-muted-foreground italic">
                  {source.excerpt}
                </blockquote>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}
