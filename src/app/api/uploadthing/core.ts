import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { resumeService } from "@/server/services/resume.service";
import { userRepo } from "@/server/repositories/user.repo";
import { detectFileType } from "@/lib/parsing/file-type";
import { MAX_FILE_BYTES } from "@/lib/constants";

const f = createUploadthing();

export const ourFileRouter = {
  resumeUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    blob: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .input(z.object({ resumeId: z.string().min(1) }))
    .middleware(async ({ input, files }) => {
      const { userId } = await auth();
      if (!userId) throw new UploadThingError("Unauthorized");

      const user = await userRepo.findByClerkId(userId);
      if (!user) throw new UploadThingError("User not provisioned");

      const file = files[0];
      if (file && file.size > MAX_FILE_BYTES) {
        throw new UploadThingError("File exceeds the 10MB limit");
      }

      return { userId: user.id, resumeId: input.resumeId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const fileType = detectFileType(file.type, file.name);
      if (!fileType) {
        throw new UploadThingError("Only PDF and DOCX files are supported");
      }

      const version = await resumeService.registerVersion(
        metadata.resumeId,
        metadata.userId,
        {
          fileKey: file.key,
          fileUrl: file.ufsUrl,
          fileName: file.name,
          fileType,
          fileSize: file.size,
        },
      );

      return { versionId: version.id, resumeId: metadata.resumeId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
