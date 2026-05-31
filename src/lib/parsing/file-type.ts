/**
 * Pure (dependency-free) file-type detection. Kept separate from extract.ts so
 * it can be imported from edge/client-reachable code without pulling in
 * server-only, unpdf, or mammoth. The union matches the Prisma FileType enum.
 */
export type ResumeFileType = "PDF" | "DOCX";

export function detectFileType(
  mime: string | undefined,
  fileName: string,
): ResumeFileType | null {
  if (mime === "application/pdf" || fileName.toLowerCase().endsWith(".pdf"))
    return "PDF";
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.toLowerCase().endsWith(".docx")
  )
    return "DOCX";
  return null;
}