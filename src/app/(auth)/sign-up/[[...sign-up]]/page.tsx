import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Get your first resume analysis free
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-transparent shadow-none p-0",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            footer: "hidden",
          },
          variables: { colorPrimary: "#4f46e5", borderRadius: "0.6rem" },
        }}
      />
    </div>
  );
}
