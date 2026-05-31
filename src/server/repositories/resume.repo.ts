import "server-only";
import { db } from "@/server/db";
import type { FileType, Prisma } from "@/generated/prisma";

export const resumeRepo = {
  listByUser(userId: string) {
    return db.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        analyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, overallScore: true, status: true },
        },
        _count: { select: { analyses: true } },
      },
    });
  },

  findOwned(id: string, userId: string) {
    return db.resume.findFirst({
      where: { id, userId },
      include: {
        versions: { orderBy: { versionNumber: "desc" } },
        analyses: {
          orderBy: { createdAt: "desc" },
          include: { jobDescription: { select: { title: true } } },
        },
      },
    });
  },

  create(userId: string, title: string) {
    return db.resume.create({ data: { userId, title } });
  },

  async addVersion(
    resumeId: string,
    data: {
      fileKey: string;
      fileUrl: string;
      fileName: string;
      fileType: FileType;
      fileSize: number;
    },
  ) {
    const count = await db.resumeVersion.count({ where: { resumeId } });
    const version = await db.resumeVersion.create({
      data: { resumeId, versionNumber: count + 1, ...data },
    });
    await db.resume.update({
      where: { id: resumeId },
      data: { currentVersionId: version.id },
    });
    return version;
  },

  updateVersionParse(
    versionId: string,
    data: Prisma.ResumeVersionUpdateInput,
  ) {
    return db.resumeVersion.update({ where: { id: versionId }, data });
  },

  findVersion(versionId: string) {
    return db.resumeVersion.findUnique({ where: { id: versionId } });
  },

  delete(id: string, userId: string) {
    return db.resume.deleteMany({ where: { id, userId } });
  },
};
