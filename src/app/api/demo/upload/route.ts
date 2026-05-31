import type { NextRequest } from "next/server";
import { requireUser } from "@/server/auth/current-user";
import { resumeService } from "@/server/services/resume.service";
import { demoStore } from "@/server/demo/store";
import { detectFileType } from "@/lib/parsing/file-type";
import { MAX_FILE_BYTES } from "@/lib/constants";
import { ok, handleError, AppError } from "@/lib/api";
import { isDemoMode } from "@/lib/dev-mode";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Demo-mode file upload. Replaces UploadThing: accepts the file directly,
 * keeps the original bytes in memory, and registers a resume version. The
 * existing parse route then reads those bytes (see resume.service.parseVersion).
 */
export async function POST(req: NextRequest) {
  try {
    if (!isDemoMode()) throw new AppError("NOT_FOUND", "Not available.");

    const user = await requireUser();
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new AppError("VALIDATION_ERROR", "Expected a multipart form upload.");
    }
    const file = form.get("file");
    const resumeId = String(form.get("resumeId") ?? "");

    if (!(file instanceof File) || !resumeId) {
      throw new AppError("VALIDATION_ERROR", "Missing file or resume id.");
    }
    if (file.size === 0) {
      throw new AppError("VALIDATION_ERROR", "The uploaded file is empty.");
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new AppError("RESUME_TOO_LARGE", "File exceeds the 10MB limit.");
    }
    const fileType = detectFileType(file.type, file.name);
    if (!fileType) {
      throw new AppError(
        "UNSUPPORTED_FILE_TYPE",
        "Only PDF and DOCX files are supported.",
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const fileKey = `demo_${crypto.randomUUID()}`;
    demoStore.putFile(fileKey, { bytes, fileName: file.name });

    const version = await resumeService.registerVersion(resumeId, user.id, {
      fileKey,
      fileUrl: `demo://${fileKey}`,
      fileName: file.name,
      fileType,
      fileSize: file.size,
    });

    return ok({ resumeId, versionId: version.id });
  } catch (e) {
    return handleError(e);
  }
}
