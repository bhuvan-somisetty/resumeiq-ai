import { z } from "zod";
import { MAX_FILE_BYTES } from "@/lib/constants";

export const createResumeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
});
export type CreateResumeInput = z.infer<typeof createResumeSchema>;

export const updateResumeSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.enum(["PDF", "DOCX"]),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_BYTES, "File exceeds the 10MB limit"),
});
export type UploadUrlInput = z.infer<typeof uploadUrlSchema>;

export const createJobDescriptionSchema = z.object({
  title: z.string().trim().max(160).optional(),
  company: z.string().trim().max(160).optional(),
  rawText: z
    .string()
    .trim()
    .min(50, "Paste the full job description (at least 50 characters)")
    .max(20000),
});
export type CreateJobDescriptionInput = z.infer<
  typeof createJobDescriptionSchema
>;

export const createAnalysisSchema = z.object({
  resumeId: z.string().min(1),
  resumeVersionId: z.string().optional(),
  jobDescriptionId: z.string().optional(),
  deep: z.boolean().optional().default(false),
});
export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
