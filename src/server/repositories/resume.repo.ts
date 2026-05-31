import "server-only";
import { db } from "@/server/db";
import { isDemoMode } from "@/lib/dev-mode";
import { demoStore } from "@/server/demo/store";
import type { FileType, Prisma } from "@/generated/prisma";

export const resumeRepo = {
  listByUser(userId: string) {
    if (isDemoMode()) return Promise.resolve(demoStore.listResumes(userId));
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
    if (isDemoMode()) return Promise.resolve(demoStore.findResume(id, userId));
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
    if (isDemoMode()) return Promise.resolve(demoStore.createResume(userId, title));
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
    if (isDemoMode()) return demoStore.addVersion(resumeId, data);
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
    if (isDemoMode())
      return Promise.resolve(demoStore.updateVersionParse(versionId, data));
    return db.resumeVersion.update({ where: { id: versionId }, data });
  },

  findVersion(versionId: string) {
    if (isDemoMode()) return Promise.resolve(demoStore.findVersion(versionId));
    return db.resumeVersion.findUnique({ where: { id: versionId } });
  },

  delete(id: string, userId: string) {
    if (isDemoMode()) return Promise.resolve(demoStore.deleteResume(id, userId));
    return db.resume.deleteMany({ where: { id, userId } });
  },
};
