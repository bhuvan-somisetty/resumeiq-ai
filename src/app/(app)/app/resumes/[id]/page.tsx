import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Clock,
  ChevronRight,
  AlertTriangle,
  History,
} from "lucide-react";
import { requireUser } from "@/server/auth/current-user";
import { resumeService } from "@/server/services/resume.service";
import { RunAnalysisPanel } from "@/components/resumeiq/run-analysis-panel";
import { EmptyState } from "@/components/resumeiq/empty-state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/resumeiq/score-ring";
import { timeAgo, formatBytes, scoreHealthLabel } from "@/lib/utils";

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const resume = await resumeService.get(id, user.id);
  if (!resume) notFound();

  const current = resume.versions[0];
  const ready = current?.parseStatus === "COMPLETED";
  const failed = current?.parseStatus === "FAILED";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-secondary">
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {resume.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {current
                ? `v${current.versionNumber} · ${current.fileName} · ${formatBytes(
                    current.fileSize,
                  )}`
                : "No file uploaded"}
            </p>
          </div>
        </div>
      </div>

      {failed && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="text-sm">
              <p className="font-medium">We couldn&apos;t read this file.</p>
              <p className="text-muted-foreground">
                {current?.parseError ??
                  "Try re-exporting it as a text-based PDF and uploading again."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Run an analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <RunAnalysisPanel resumeId={resume.id} ready={ready} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {resume.analyses.length === 0 ? (
              <EmptyState
                icon={<History />}
                title="No analyses yet"
                description="Run your first analysis to see your score history here."
                className="border-0 bg-transparent"
              />
            ) : (
              <ul className="divide-y divide-border">
                {resume.analyses.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/app/analyses/${a.id}`}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-secondary/40"
                    >
                      {a.overallScore != null ? (
                        <ScoreRing
                          score={a.overallScore}
                          size={44}
                          strokeWidth={4}
                          showLabel={false}
                          animate={false}
                        />
                      ) : (
                        <Badge
                          variant={
                            a.status === "FAILED" ? "destructive" : "secondary"
                          }
                        >
                          {a.status.toLowerCase()}
                        </Badge>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {a.jobDescription?.title
                            ? a.jobDescription.title
                            : "Standalone analysis"}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" /> {timeAgo(a.createdAt)}
                          {a.overallScore != null
                            ? ` · ${scoreHealthLabel(a.overallScore)}`
                            : ""}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
