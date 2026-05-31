import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Target,
  AlertTriangle,
  ListChecks,
  ScanLine,
  RefreshCw,
} from "lucide-react";
import { requireUser } from "@/server/auth/current-user";
import { analysisService } from "@/server/services/analysis.service";
import { ScoreRing } from "@/components/resumeiq/score-ring";
import { ScoreGauge } from "@/components/resumeiq/score-gauge";
import { SubScoreBar } from "@/components/resumeiq/sub-score-bar";
import { AtsFindingItem } from "@/components/resumeiq/ats-finding-item";
import { GapList } from "@/components/resumeiq/gap-list";
import { KeywordCoverage } from "@/components/resumeiq/keyword-coverage";
import { AiFeedbackCard } from "@/components/resumeiq/ai-feedback-card";
import {
  SuggestionCard,
  type SuggestionView,
} from "@/components/resumeiq/suggestion-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SCORE_DIMENSIONS } from "@/lib/constants";
import { scoreHealthLabel } from "@/lib/utils";
import type { SubScores, AtsFinding } from "@/types/domain";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const analysis = await analysisService.get(id, user.id);
  if (!analysis) notFound();

  if (analysis.status === "FAILED") {
    return (
      <ReportShell title={analysis.resume.title}>
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="font-medium">This analysis failed</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {analysis.failureReason ??
                "Something went wrong. Please try running it again."}
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href={`/app/resumes/${analysis.resumeId}`}>
                <RefreshCw className="size-4" /> Try again
              </Link>
            </Button>
          </CardContent>
        </Card>
      </ReportShell>
    );
  }

  if (analysis.status !== "COMPLETED" || analysis.overallScore == null) {
    return (
      <ReportShell title={analysis.resume.title}>
        <RunningReport />
      </ReportShell>
    );
  }

  const sub = analysis.subScores as unknown as SubScores;
  const findings = (analysis.atsReport?.findings ?? []) as unknown as AtsFinding[];
  const match = analysis.matchResult;
  const suggestions = analysis.suggestions as unknown as SuggestionView[];
  const hint = Object.fromEntries(SCORE_DIMENSIONS.map((d) => [d.key, d.label]));

  const topFixes = suggestions
    .filter((s) => s.priority === "HIGH")
    .slice(0, 3)
    .map((s) => s.title);

  const coverage = match?.keywordCoverage as
    | { found: number; missing: number; density: number }
    | undefined;

  return (
    <ReportShell
      title={analysis.resume.title}
      subtitle={
        analysis.jobDescription?.title
          ? `→ ${analysis.jobDescription.title}`
          : "Standalone analysis"
      }
    >
      {/* Score band: overall ring + sub-scores, then ATS / match gauges */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
            <ScoreRing score={analysis.overallScore} size={150} />
            <div className="w-full space-y-3">
              {SCORE_DIMENSIONS.map((d, i) => (
                <SubScoreBar
                  key={d.key}
                  label={d.label}
                  value={sub?.[d.key] ?? 0}
                  hint={hint[d.key]}
                  index={i}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col items-center justify-center gap-4 p-6">
            {match ? (
              <ScoreGauge
                score={match.matchScore}
                label="Recruiter match"
                caption={`${(match.matched as unknown as string[]).length} of ${
                  (match.matched as unknown as string[]).length +
                  (match.missing as unknown as string[]).length
                } requirements met`}
              />
            ) : (
              <ScoreGauge
                score={analysis.atsReport?.score ?? 0}
                label="ATS compatibility"
                caption={`${findings.filter((f) => f.severity === "fail").length} blocking issues`}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI verdict */}
      {analysis.summary && (
        <AiFeedbackCard
          summary={analysis.summary}
          topFixes={topFixes}
          model={analysis.modelUsed}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="suggestions">
        <TabsList>
          <TabsTrigger value="suggestions">
            <ListChecks className="mr-1.5 size-4" /> Suggestions
            <span className="ml-1.5 rounded-full bg-background/60 px-1.5 text-xs">
              {suggestions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="ats">
            <ScanLine className="mr-1.5 size-4" /> ATS report
          </TabsTrigger>
          {match && (
            <TabsTrigger value="gap">
              <Target className="mr-1.5 size-4" /> Gap details
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="suggestions" className="space-y-3">
          {suggestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No suggestions — this resume is in great shape.
            </p>
          ) : (
            suggestions.map((s) => <SuggestionCard key={s.id} suggestion={s} />)
          )}
        </TabsContent>

        <TabsContent value="ats" className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <ScoreRing
              score={analysis.atsReport?.score ?? 0}
              size={56}
              strokeWidth={5}
              showLabel={false}
              animate={false}
            />
            <div>
              <p className="font-medium">
                ATS compatibility:{" "}
                {scoreHealthLabel(analysis.atsReport?.score ?? 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                {findings.filter((f) => f.severity === "fail").length} issues to
                fix · {findings.filter((f) => f.severity === "pass").length}{" "}
                passing
              </p>
            </div>
          </div>
          {findings.map((f) => (
            <AtsFindingItem key={f.id} finding={f} />
          ))}
        </TabsContent>

        {match && (
          <TabsContent value="gap" className="space-y-5">
            {coverage && (
              <Card>
                <CardContent className="p-6">
                  <KeywordCoverage
                    found={coverage.found}
                    missing={coverage.missing}
                    density={coverage.density}
                  />
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-6">
                <GapList
                  matched={match.matched as unknown as string[]}
                  weak={match.weak as unknown as string[]}
                  missing={match.missing as unknown as string[]}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </ReportShell>
  );
}

function ReportShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <Badge variant="secondary">{subtitle}</Badge>}
        </div>
      </div>
      {children}
    </div>
  );
}

function RunningReport() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10">
          <ScanLine className="size-7 animate-pulse text-primary" />
        </div>
        <p className="font-medium">Your analysis is still running…</p>
        <p className="text-sm text-muted-foreground">Refresh in a few seconds.</p>
      </CardContent>
    </Card>
  );
}
