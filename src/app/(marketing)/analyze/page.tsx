import type { Metadata } from "next";
import { GuestAnalyzer } from "@/components/resumeiq/guest-analyzer";

export const metadata: Metadata = {
  title: "Analyze your resume",
  description:
    "Upload your resume and get an instant ATS score, recruiter match, and concrete fixes — no account required.",
};

export default function AnalyzePage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:pt-32">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Analyze your resume — free
        </h1>
        <p className="mt-3 text-muted-foreground">
          Upload a PDF or DOCX to get an instant score, ATS audit, and a
          prioritized list of fixes. No sign-up, no limits.
        </p>
      </div>
      <GuestAnalyzer />
    </div>
  );
}
