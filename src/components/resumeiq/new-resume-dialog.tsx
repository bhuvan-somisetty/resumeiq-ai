"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, UploadCloud, FileText, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadThing } from "@/lib/uploadthing";
import { isDemoMode } from "@/lib/dev-mode";
import { MAX_FILE_BYTES } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";

type Step = "title" | "upload" | "parsing";

const demo = isDemoMode();

export function NewResumeDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("title");
  const [title, setTitle] = React.useState("");
  const [resumeId, setResumeId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [demoUploading, setDemoUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // After a file lands (via UploadThing or demo upload), parse it and navigate.
  const afterUpload = React.useCallback(
    async (data: { resumeId: string; versionId: string }) => {
      setStep("parsing");
      try {
        const r = await fetch(
          `/api/resumes/${data.resumeId}/versions/${data.versionId}/parse`,
          { method: "POST" },
        );
        if (!r.ok) {
          const body = await r.json().catch(() => null);
          throw new Error(body?.error?.message ?? "Parsing failed");
        }
        toast.success("Resume parsed and ready to analyze.");
        setOpen(false);
        router.push(`/app/resumes/${data.resumeId}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Parsing failed");
        setStep("upload");
      }
    },
    [router],
  );

  const { startUpload, isUploading } = useUploadThing("resumeUploader", {
    onClientUploadComplete: async (res) => {
      const data = res?.[0]?.serverData;
      if (!data) {
        toast.error("Upload finished but no file was returned.");
        setStep("upload");
        return;
      }
      await afterUpload(data);
    },
    onUploadError: (e) => {
      toast.error(e.message || "Upload failed");
      setStep("upload");
    },
  });

  // Demo mode upload: POST the file to the local handler with progress.
  function demoUpload(file: File, resumeIdArg: string) {
    setDemoUploading(true);
    setProgress(0);
    const form = new FormData();
    form.append("file", file);
    form.append("resumeId", resumeIdArg);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/demo/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = async () => {
      setDemoUploading(false);
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          await afterUpload(body.data);
        } else {
          throw new Error(body?.error?.message ?? "Upload failed");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
        setStep("upload");
      }
    };
    xhr.onerror = () => {
      setDemoUploading(false);
      toast.error("Upload failed");
      setStep("upload");
    };
    xhr.send(form);
  }

  function reset() {
    setStep("title");
    setTitle("");
    setResumeId(null);
    setCreating(false);
    setDemoUploading(false);
    setProgress(0);
  }

  async function createResume() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const r = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body?.error?.message ?? "Could not create");
      setResumeId(body.data.id);
      setStep("upload");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create");
    } finally {
      setCreating(false);
    }
  }

  function validateAndUpload(file: File) {
    const okType =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".docx");
    if (!okType) {
      toast.error("Only PDF and DOCX files are supported.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`File is ${formatBytes(file.size)} — the limit is 10MB.`);
      return;
    }
    if (!resumeId) return;
    if (demo) {
      demoUpload(file, resumeId);
    } else {
      void startUpload([file], { resumeId });
    }
  }

  const uploading = isUploading || demoUploading;
  const busy = uploading || step === "parsing";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (busy) return;
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> New resume
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === "title" ? "Add a resume" : title || "Upload your resume"}
          </DialogTitle>
          <DialogDescription>
            {step === "title"
              ? "Give it a name so you can find it later."
              : "PDF or DOCX, up to 10MB."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "title" && (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="resume-title">Resume name</Label>
                <Input
                  id="resume-title"
                  placeholder="e.g. Backend Engineer 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createResume()}
                  autoFocus
                />
              </div>
              <Button
                className="w-full"
                onClick={createResume}
                disabled={!title.trim() || creating}
              >
                {creating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>Continue</>
                )}
              </Button>
            </motion.div>
          )}

          {(step === "upload" || step === "parsing") && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {step === "parsing" ? (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <div className="relative">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Sparkles className="size-6 text-primary" />
                    </div>
                    <Loader2 className="absolute -right-1 -top-1 size-5 animate-spin text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Reading your resume…</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Extracting structure and getting it analysis-ready.
                    </p>
                  </div>
                </div>
              ) : (
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
                    const file = e.dataTransfer.files?.[0];
                    if (file) validateAndUpload(file);
                  }}
                  disabled={busy}
                  className={cn(
                    "flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                    dragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-secondary/40",
                  )}
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-secondary">
                    {uploading ? (
                      <Loader2 className="size-6 animate-spin text-primary" />
                    ) : (
                      <UploadCloud className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="w-full">
                    <p className="font-medium">
                      {uploading
                        ? `Uploading… ${demo ? `${progress}%` : ""}`.trim()
                        : "Drag & drop or click to upload"}
                    </p>
                    {uploading && demo ? (
                      <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    ) : (
                      <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="size-3.5" /> PDF or DOCX · max 10MB
                      </p>
                    )}
                  </div>
                </button>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) validateAndUpload(file);
                  e.target.value = "";
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
