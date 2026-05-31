import Link from "next/link";
import {
  FileText,
  ArrowUpRight,
  Plus,
  Sparkles,
  Clock,
  Gauge,
  Target,
  Zap,
} from "lucide-react";
import { requireUser } from "@/server/auth/current-user";
import { resumeService } from "@/server/services/resume.service";
import { analysisService } from "@/server/services/analysis.service";
import { usageService } from "@/server/services/usage.service";
import { NewResumeDialog } from "@/components/resumeiq/new-resume-dialog";
import { ScoreRing } from "@/components/resumeiq/score-ring";
import { StatCard } from "@/components/resumeiq/stat-card";
import { EmptyState } from "@/components/resumeiq/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { timeAgo, scoreHealthLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const [resumes, recent, usage] = await Promise.all([
    resumeService.list(user.id),
    analysisService.listRecent(user.id),
    usageService.getUsage(user.id, user.plan),
  ]);

  const scored = recent.filter((a) => a.overallScore != null);
  const bestScore = scored.length
    ? Math.max(...scored.map((a) => a.overallScore ?? 0))
    : 0;
  const jdMatches = recent.filter((a) => a.type === "JD_MATCH").length;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a resume to get an instant score and a plan to improve it.
          </p>
        </div>
        <NewResumeDialog />
      </div>

      {/* Stat band */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileText />}
          label="Resumes"
          value={resumes.length}
          accent="primary"
          delay={0}
        />
        <StatCard
          icon={<Gauge />}
          label="Best score"
          value={bestScore}
          accent="success"
          delay={0.06}
        />
        <StatCard
          icon={<Target />}
          label="Job matches"
          value={jdMatches}
          accent="info"
          delay={0.12}
        />
        <StatCard
          icon={<Zap />}
          label={usage.unlimited ? "Analyses (Pro)" : "Analyses left"}
          value={usage.unlimited ? recent.length : Math.max(0, usage.limit - usage.used)}
          accent="warning"
          delay={0.18}
        />
      </div>

      {resumes.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Upload your first resume"
          description="Drop in a PDF or DOCX and get an instant ResumeScore, ATS report, and a prioritized list of fixes."
          action={
            <NewResumeDialog
              trigger={
                <Button size="lg">
                  <Plus className="size-4" /> Upload resume
                </Button>
              }
            />
          }
        />
      ) : (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Your resumes
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r) => {
              const latest = r.analyses[0];
              const version = r.versions[0];
              return (
                <Link key={r.id} href={`/app/resumes/${r.id}`}>
                  <Card className="group relative h-full overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                        <FileText className="size-5 text-muted-foreground" />
                      </div>
                      {latest?.overallScore != null ? (
                        <ScoreRing
                          score={latest.overallScore}
                          size={56}
                          strokeWidth={5}
                          showLabel={false}
                          animate={false}
                        />
                      ) : (
                        <Badge variant="secondary">
                          {version?.parseStatus === "COMPLETED"
                            ? "Ready"
                            : "Processing"}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-4 font-semibold leading-tight">
                      {r.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r._count.analyses} analysis
                      {r._count.analyses === 1 ? "" : "es"} ·{" "}
                      {timeAgo(r.updatedAt)}
                    </p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Open <ArrowUpRight className="ml-1 size-3.5" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent analyses
          </h2>
          <Card className="divide-y divide-border">
            {recent.map((a) => (
              <Link
                key={a.id}
                href={`/app/analyses/${a.id}`}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-secondary/40"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                  <Sparkles className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {a.resume.title}
                    {a.jobDescription?.title
                      ? ` → ${a.jobDescription.title}`
                      : ""}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" /> {timeAgo(a.createdAt)} ·{" "}
                    {a.type === "JD_MATCH" ? "Job match" : "Standalone"}
                  </p>
                </div>
                {a.overallScore != null ? (
                  <div className="text-right">
                    <span className="text-lg font-semibold tabular-nums">
                      {a.overallScore}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {scoreHealthLabel(a.overallScore)}
                    </span>
                  </div>
                ) : (
                  <Badge
                    variant={a.status === "FAILED" ? "destructive" : "secondary"}
                  >
                    {a.status.toLowerCase()}
                  </Badge>
                )}
              </Link>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
