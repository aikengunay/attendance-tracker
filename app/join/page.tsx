import { lookupStudentAction } from "@/app/join/actions";
import { JoinConfirmTicket } from "@/components/JoinConfirmTicket";
import { BrandLockup } from "@/components/teacher/brand-lockup";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type Props = {
  searchParams: Promise<{
    step?: string;
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
  const error = sp.error ?? "";
  const sectionCode = (sp.sectionCode ?? "").toUpperCase();
  const studentId = sp.studentId ?? "";
  const name = sp.name ?? "";
  const subjectName = sp.subjectName ?? "";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-4 md:p-10">
      {error ? (
        <p className="w-full max-w-sm rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {step === "confirm" && name && studentId && sectionCode ? (
        <JoinConfirmTicket
          sectionCode={sectionCode}
          studentId={studentId}
          name={name}
          subjectName={subjectName}
        />
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-6">
          <BrandLockup className="self-center" size="lg" />
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Check in</CardTitle>
              <CardDescription>
                Enter your section and student ID.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={lookupStudentAction} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sectionCode">Section</Label>
                  <Input
                    id="sectionCode"
                    name="sectionCode"
                    defaultValue={sectionCode}
                    placeholder="INF191"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    className="min-h-12"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="studentId">Student ID</Label>
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
                    className="min-h-12 font-mono"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Find me
                </Button>
              </form>
            </CardContent>
          </Card>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Back to home
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
