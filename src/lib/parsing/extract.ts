import "server-only";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { AppError } from "@/lib/errors";
import type { FileType } from "@/generated/prisma";

/**
 * Extract raw text from a resume file. PDF via `unpdf` (serverless-safe, pdf.js
 * under the hood), DOCX via `mammoth`. See /docs/07-Folder-Structure.md §7.5.
 */
export async function extractRawText(
  buffer: ArrayBuffer,
  fileType: FileType,
): Promise<string> {
  try {
    if (fileType === "PDF") {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      return normalize(Array.isArray(text) ? text.join("\n") : text);
    }

    if (fileType === "DOCX") {
      const { value } = await mammoth.extractRawText({
        buffer: Buffer.from(buffer),
      });
      return normalize(value);
    }

    throw new AppError("UNSUPPORTED_FILE_TYPE", "Unsupported file type.");
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "PARSE_FAILED",
      "We couldn't read this file. Try re-exporting it as a PDF.",
      { cause: err instanceof Error ? err.message : String(err) },
    );
  }
}

function normalize(text: string): string {
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (cleaned.length < 30) {
    throw new AppError(
      "PARSE_FAILED",
      "This file has too little readable text. If it's a scanned image, export a text-based PDF.",
    );
  }
  return cleaned;
}

export { detectFileType } from "@/lib/parsing/file-type";
