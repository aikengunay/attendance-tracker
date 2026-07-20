import { AddStudentForm } from "@/components/AddStudentForm";
import { StartSessionPanel } from "@/components/StartSessionPanel";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = { params: Promise<{ sectionId: string }> };

export default async function SectionDetailPage({ params }: Props) {
  const { sectionId } = await params;
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      templates: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
      students: { where: { active: true }, orderBy: { name: "asc" } },
      meetings: {
        orderBy: { startAt: "desc" },
        take: 10,
        include: { session: true },
      },
    },
  });

  if (!section) notFound();

  const openSession = await prisma.session.findFirst({
    where: { status: "open", meeting: { sectionId } },
    select: { id: true },
  });

  const templates = section.templates.map((t) => ({
    id: t.id,
    dayLabel: DAY_LABELS[t.dayOfWeek] ?? String(t.dayOfWeek),
    startTime: t.startTime,
    endTime: t.endTime,
    roomType: t.roomType,
    room: t.room,
  }));

  return (
    <main className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/teacher" className="hover:underline">
            Sections
          </Link>
          <span className="mx-1">/</span>
          {section.code}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{section.code}</h1>
        <p className="text-sm text-zinc-600">{section.subjectName}</p>
        <p className="text-xs text-zinc-500">{section.termLabel}</p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Session
        </h2>
        <StartSessionPanel
          sectionId={section.id}
          templates={templates}
          openSessionId={openSession?.id ?? null}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Schedules
        </h2>
        <ul className="rounded border border-zinc-200 bg-white text-sm">
          {section.templates.map((t) => (
            <li
              key={t.id}
              className="border-b border-zinc-100 px-4 py-2 last:border-0"
            >
              {DAY_LABELS[t.dayOfWeek]} {t.startTime}–{t.endTime}
              {t.roomType ? ` · ${t.roomType}` : ""}
              {t.room ? ` · ${t.room}` : ""}
            </li>
          ))}
          {section.templates.length === 0 ? (
            <li className="px-4 py-3 text-zinc-500">No schedules imported.</li>
          ) : null}
        </ul>
      </section>

      {section.meetings.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Recent meetings
          </h2>
          <ul className="rounded border border-zinc-200 bg-white text-sm">
            {section.meetings.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-2 last:border-0"
              >
                <span>
                  {m.startAt.toLocaleString("en-PH", { timeZone: "Asia/Manila" })}
                  {m.title ? ` · ${m.title}` : ""}
                </span>
                <span className="text-zinc-600">
                  {m.session?.status ?? "no session"}
                  {m.session?.status === "open" ? (
                    <>
                      {" · "}
                      <Link
                        href={`/teacher/sessions/${m.session.id}/projector`}
                        className="underline"
                      >
                        projector
                      </Link>
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Roster ({section.students.length})
        </h2>
        <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Student ID</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {section.students.map((s) => (
                <tr key={s.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{s.studentId}</td>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-zinc-600">{s.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Add student
        </h2>
        <AddStudentForm sectionId={section.id} />
      </section>
    </main>
  );
}
