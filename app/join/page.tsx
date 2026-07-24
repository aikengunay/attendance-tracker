import { lookupStudentAction } from "@/app/join/actions";
import { JoinConfirmTicket } from "@/components/JoinConfirmTicket";
import { BrandLockup } from "@/components/teacher/brand-lockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type Props = {
  searchParams: Promise<{
    step?: string;
    fresh?: string;
    error?: string;
    sectionCode?: string;
    studentId?: string;
    name?: string;
    subjectName?: string;
  }>;
};

export default async function JoinPage({ searchParams }: Props) {
  const sp = await searchParams;
  const step = sp.step === "confirm" ? "confirm" : "identify";
  const freshFromLookup = sp.fresh === "1";
  const error = sp.error ?? "";
  const sectionCode = (sp.sectionCode ?? "").toUpperCase();
  const studentId = sp.studentId ?? "";
  const name = sp.name ?? "";
  const subjectName = sp.subjectName ?? "";

  return (
    <div className="flex min-h-svh flex-col items-center bg-background p-4 md:p-10">
      {step === "confirm" && name && studentId && sectionCode ? (
        <JoinConfirmTicket
          sectionCode={sectionCode}
          studentId={studentId}
          name={name}
          subjectName={subjectName}
          requireConfirm={freshFromLookup}
        />
      ) : (
        <div className="flex min-h-[calc(100svh-2rem)] w-full max-w-sm flex-col md:min-h-[calc(100svh-5rem)]">
          <div className="flex flex-1 flex-col justify-center gap-8 py-6">
            <BrandLockup className="self-center" size="lg" />

            <div className="space-y-2 text-center">
              <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Check in
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your section and student ID.
              </p>
            </div>

            {error ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <form action={lookupStudentAction} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sectionCode" className="text-muted-foreground">
                  Section
                </Label>
                <Input
                  id="sectionCode"
                  name="sectionCode"
                  defaultValue={sectionCode}
                  placeholder="INF191"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  className="presentpo-input-join h-12 rounded-[12px] border-2 border-border bg-background px-3.5 text-base shadow-none transition-[color,background-color,border-color,box-shadow] hover:border-foreground/40 hover:bg-muted/40 focus-visible:border-primary focus-visible:bg-[color-mix(in_oklch,var(--primary)_6%,white)] focus-visible:ring-3 focus-visible:ring-primary/20"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="studentId" className="text-muted-foreground">
                  Student ID
                </Label>
                <Input
                  id="studentId"
                  name="studentId"
                  defaultValue={studentId}
                  placeholder="2019-100265"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  className="presentpo-input-join h-12 rounded-[12px] border-2 border-border bg-background px-3.5 font-mono text-base shadow-none transition-[color,background-color,border-color,box-shadow] hover:border-foreground/40 hover:bg-muted/40 focus-visible:border-primary focus-visible:bg-[color-mix(in_oklch,var(--primary)_6%,white)] focus-visible:ring-3 focus-visible:ring-primary/20"
                />
              </div>
              <Button
                type="submit"
                variant="chunky"
                size="xl"
                className="mt-1 w-full"
              >
                Find me
              </Button>
            </form>
          </div>

          <div className="flex shrink-0 justify-center">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center px-4 py-3 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
