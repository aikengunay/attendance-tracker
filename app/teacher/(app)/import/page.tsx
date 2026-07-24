"use client";

import { TeacherPageHeader } from "@/components/teacher/page-header";
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
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Preview = {
  termLabel: string;
  subjectName: string;
  sectionCode: string;
  instructor: string | null;
  classLimit: number | null;
  scheduleCount: number;
  studentCount: number;
  schedules: Array<{
    dayOfWeek: number;
    dayLabel: string;
    startTime: string;
    endTime: string;
    roomType: string | null;
    room: string | null;
  }>;
  sampleStudents: Array<{ studentId: string; name: string; status: string | null }>;
  students: Array<{
    studentId: string;
    name: string;
    email: string | null;
    status: string | null;
  }>;
};

export default function ImportPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onPreview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch("/api/import/classlist", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Parse failed");
        return;
      }
      setPreview(data.preview);
    } finally {
      setLoading(false);
    }
  }

  async function onCommit() {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import/classlist?commit=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termLabel: preview.termLabel,
          subjectName: preview.subjectName,
          sectionCode: preview.sectionCode,
          instructor: preview.instructor,
          classLimit: preview.classLimit,
          schedules: preview.schedules,
          students: preview.students,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Commit failed");
        return;
      }
      router.push(`/teacher/sections/${data.sectionId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TeacherPageHeader
        title="Import classlist"
        description="Upload Registrar TSV .xls (INF231 / INF232). Preview, then confirm to upsert."
      />

      <Card>
        <CardHeader>
          <CardTitle>Upload file</CardTitle>
          <CardDescription>
            Accepts .xls / .tsv from the Registrar export.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPreview} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="file">Classlist file</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".xls,.tsv,.txt,text/plain,text/tab-separated-values"
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-fit">
              {loading && !preview ? "Parsing…" : "Preview"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>{preview.sectionCode}</CardTitle>
            <CardDescription>
              {preview.subjectName} · {preview.termLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {preview.studentCount} students · {preview.scheduleCount} schedules
              {preview.classLimit != null
                ? ` · limit ${preview.classLimit}`
                : ""}
            </p>

            <div>
              <h2 className="text-sm font-medium">Schedules</h2>
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                {preview.schedules.map((s, i) => (
                  <li key={i}>
                    {s.dayLabel} {s.startTime}–{s.endTime}
                    {s.roomType ? ` · ${s.roomType}` : ""}
                    {s.room ? ` · ${s.room}` : ""}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-medium">Sample students</h2>
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                {preview.sampleStudents.map((s) => (
                  <li key={s.studentId}>
                    {s.studentId} — {s.name}
                    {s.status ? ` (${s.status})` : ""}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              type="button"
              onClick={onCommit}
              disabled={loading}
              className="w-fit"
            >
              {loading ? "Saving…" : "Confirm import"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
