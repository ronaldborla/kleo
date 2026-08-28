import { tool } from "ai";
import { z } from "zod";

export const evidenceSourceSchema = z.object({
  filename: z.string(),
  page: z.number().nullable(),
  section: z.string().nullable(),
  excerpt: z.string(),
  relevance: z.enum(["high", "medium", "low"]),
});

export const showEvidenceSchema = z.object({
  summary: z.string(),
  sources: z.array(evidenceSourceSchema).min(1),
});

export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;
export type ShowEvidenceInput = z.infer<typeof showEvidenceSchema>;

export const showEvidenceTool = tool({
  description:
    "Display expandable evidence cards citing document sources. Call this when answering factual questions grounded in the uploaded document.",
  inputSchema: showEvidenceSchema,
  execute: async (input) => input,
});

export const chatTools = {
  showEvidence: showEvidenceTool,
};
