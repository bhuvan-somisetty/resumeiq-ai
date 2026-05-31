"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  Loader2,
  Sparkles,
  Target,
  FileCheck2,
  ListChecks,
  ScanLine,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { MAX_GUEST_FILE_BYTES } from "@/lib/constants";
import { SCORE_DIMENSIONS } from "@/lib/constants";
import { cn, formatBytes, scoreHealthLabel } from "@/lib/utils";
import type { SubScores, AtsFinding, MatchBreakdown } from "@/types/domain";

type Mode = "standalone" | "jd";

interface GuestResult {
  fileName: string;
  jdTitle?: string;
  overallScore: number;
  subScores: SubScores;
  summary: string;
  modelUsed: string;
  ats: { score: number; findings: AtsFinding[] };
  match: MatchBreakdown | null;
  suggestions: Omit<SuggestionView, "id">[];
}

/** Provides Tooltip context — the guest page lives outside the (app) layout. */
export function GuestAnalyzer() {
  return (
    <TooltipProvider delayDuration={150}>
      <GuestAnalyzerInner />
    </TooltipProvider>
  );
}

function GuestAnalyzerInner() {
  const [mode, setMode] = React.useState<Mode>("standalone");
  const [file, setFile] = React.useState<File | null>(null);
  const [jdTitle, setJdTitle] = React.useState("");
  const [jdText, setJdText] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<GuestResult | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function pick(f: File) {
    const okType =
      f.type === "application/pdf" ||
      f.name.toLowerCase().endsWith(".pdf") ||
      f.name.toLowerCase().endsWith(".docx");
    if (!okType) {
      toast.error("Only PDF and DOCX files are supported.");
      return;
    }
    if (f.size > MAX_GUEST_FILE_BYTES) {
      toast.error(`File is ${formatBytes(f.size)} — the limit is 4MB.`);
      return;
    }
    setFile(f);
  }

  async function run() {
    if (!file) {
      toast.error("Choose a resume file first.");
      return;
    }
    if (mode === "jd" && jdText.trim().length < 50) {
      toast.error("Paste the full job description (at least 50 characters).");
      return;
    }
    setRunning(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (mode === "jd") {
        form.append("jdText", jdText.trim());
        if (jdTitle.trim()) form.append("jdTitle", jdTitle.trim());
      }
      const r = await fetch("/api/guest/analyze", {
        method: "POST",
        body: form,
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body?.error?.message ?? "Analysis failed");
      setResult(body.data as GuestResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setResult(null);
    setFile(null);
    setJdText("");
    setJdTitle("");
    setMode("standalone");
  }

  if (running) return <RunningCard />;
  if (result) return <Results result={result} onReset={reset} />;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) pick(f);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/40",
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary">
          {file ? (
            <FileCheck2 className="size-7 text-success" />
          ) : (
            <UploadCloud className="size-7 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-medium">
            {file ? file.name : "Drag & drop or click to upload your resume"}
          </p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="size-3.5" />
            {file ? formatBytes(file.size) : "PDF or DOCX · max 4MB"}
          </p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          e.target.value = "";
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <ModeOption
          active={mode === "standalone"}
          onClick={() => setMode("standalone")}
          icon={<FileCheck2 className="size-5" />}
          title="Standalone"
          desc="Score + ATS report"
        />
        <ModeOption
          active={mode === "jd"}
          onClick={() => setMode("jd")}
          icon={<Target className="size-5" />}
          title="Target a job"
          desc="Match + gap analysis"
        />
      </div>

      <AnimatePresence initial={false}>
        {mode === "jd" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <Input
              placeholder="Job title (optional) — e.g. Senior Backend Engineer"
              value={jdTitle}
              onChange={(e) => setJdTitle(e.target.value)}
            />
            <Textarea
              placeholder="Paste the full job description here…"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="min-h-40"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Button onClick={run} disabled={!file} size="lg" className="w-full">
        <Sparkles className="size-4" /> Analyze my resume
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No account needed. Your file is analyzed in memory and never stored —{" "}
        <Link href="/sign-up" className="underline underline-offset-2">
          sign up
        </Link>{" "}
        to save your history.
      </p>
    </div>
  );
}

function ModeOption({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:border-primary/40 hover:bg-secondary/40",
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-lg",
          active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}

function RunningCard() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="size-7 text-primary" />
          <Loader2 className="absolute -right-1.5 -top-1.5 size-6 animate-spin text-primary" />
        </div>
        <div>
          <p className="font-medium">Analyzing your resume…</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reading the file, scoring, and writing your improvements.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Results({
  result,
  onReset,
}: {
  result: GuestResult;
  onReset: () => void;
}) {
  const sub = result.subScores;
  const findings = result.ats.findings;
  const match = result.match;
  const hint = Object.fromEntries(SCORE_DIMENSIONS.map((d) => [d.key, d.label]));
  const suggestions: SuggestionView[] = result.suggestions.map((s, i) => ({
    ...s,
    id: `guest-${i}`,
  }));
  const topFixes = suggestions
    .filter((s) => s.priority === "HIGH")
    .slice(0, 3)
    .map((s) => s.title);
  const coverage = match?.keywordCoverage;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {result.fileName}
          </h2>
          <Badge variant="secondary">
            {result.jdTitle ? `→ ${result.jdTitle}` : "Standalone analysis"}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="size-4" /> Analyze another
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
            <ScoreRing score={result.overallScore} size={150} />
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
                caption={`${match.matched.length} of ${
                  match.matched.length + match.missing.length
                } requirements met`}
              />
            ) : (
              <ScoreGauge
                score={result.ats.score}
                label="ATS compatibility"
                caption={`${findings.filter((f) => f.severity === "fail").length} blocking issues`}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {result.summary && (
        <AiFeedbackCard
          summary={result.summary}
          topFixes={topFixes}
          model={result.modelUsed}
        />
      )}

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
              score={result.ats.score}
              size={56}
              strokeWidth={5}
              showLabel={false}
              animate={false}
            />
            <div>
              <p className="font-medium">
                ATS compatibility: {scoreHealthLabel(result.ats.score)}
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
                  matched={match.matched}
                  weak={match.weak}
                  missing={match.missing}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="font-medium">Want to save this and track your progress?</p>
          <Button asChild>
            <Link href="/sign-up">
              Create a free account <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
