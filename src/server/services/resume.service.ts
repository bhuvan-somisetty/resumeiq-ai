import "server-only";
import { resumeRepo } from "@/server/repositories/resume.repo";
import { extractRawText } from "@/lib/parsing/extract";
import { aiParseResume } from "@/lib/ai/engine";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { isDemoMode } from "@/lib/dev-mode";
import { demoStore } from "@/server/demo/store";
import { MAX_EXTRACTED_CHARS } from "@/lib/constants";
import type { FileType } from "@/generated/prisma";

export const resumeService = {
  list(userId: string) {
    return resumeRepo.listByUser(userId);
  },

  get(id: string, userId: string) {
    return resumeRepo.findOwned(id, userId);
  },

  create(userId: string, title: string) {
    return resumeRepo.create(userId, title);
  },

  async delete(id: string, userId: string) {
    const res = await resumeRepo.delete(id, userId);
    if (res.count === 0) throw new AppError("NOT_FOUND", "Resume not found.");
    return { deleted: true };
  },

  /** Record an uploaded file as a new resume version (fast; called post-upload). */
  async registerVersion(
    resumeId: string,
    userId: string,
    file: {
      fileKey: string;
      fileUrl: string;
      fileName: string;
      fileType: FileType;
      fileSize: number;
    },
  ) {
    const resume = await resumeRepo.findOwned(resumeId, userId);
    if (!resume) throw new AppError("NOT_FOUND", "Resume not found.");
    return resumeRepo.addVersion(resumeId, file);
  },

  /**
   * Parse a version: download → extract raw text → AI-structure. Synchronous for
   * the MVP; updates parseStatus along the way so the UI can reflect progress.
   */
  async parseVersion(versionId: string, userId: string) {
    const version = await resumeRepo.findVersion(versionId);
    if (!version) throw new AppError("NOT_FOUND", "Version not found.");

    const resume = await resumeRepo.findOwned(version.resumeId, userId);
    if (!resume) throw new AppError("NOT_FOUND", "Resume not found.");

    try {
      await resumeRepo.updateVersionParse(version.id, {
        parseStatus: "PROCESSING",
      });

      let buffer: ArrayBuffer;
      if (isDemoMode()) {
        // Demo uploads keep the original bytes in memory (no UploadThing).
        const stored = demoStore.getFile(version.fileKey);
        if (!stored)
          throw new AppError("PARSE_FAILED", "Uploaded file is no longer available.");
        buffer = stored.bytes.buffer.slice(
          stored.bytes.byteOffset,
          stored.bytes.byteOffset + stored.bytes.byteLength,
        ) as ArrayBuffer;
      } else {
        const res = await fetch(version.fileUrl);
        if (!res.ok) throw new AppError("PARSE_FAILED", "Could not fetch file.");
        buffer = await res.arrayBuffer();
      }

      const rawText = (await extractRawText(buffer, version.fileType)).slice(
        0,
        MAX_EXTRACTED_CHARS,
      );
      const { data: parsed } = await aiParseResume(rawText);

      await resumeRepo.updateVersionParse(version.id, {
        parseStatus: "COMPLETED",
        rawText,
        parsed,
      });

      return { versionId: version.id, parseStatus: "COMPLETED" as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Parse failed";
      logger.error("Resume parse failed", { versionId: version.id, message });
      await resumeRepo.updateVersionParse(version.id, {
        parseStatus: "FAILED",
        parseError: message,
      });
      throw err;
    }
  },
};
