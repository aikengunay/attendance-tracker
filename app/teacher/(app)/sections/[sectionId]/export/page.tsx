import { ExportDownloadButton } from "@/components/ExportDownloadButton";
import { prisma } from "@/lib/db";
import { templateFileForSection } from "@/lib/export/gradebook";
import Link from "next/link";
import path from "node:path";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ sectionId: string }> };

export default async function ExportPage({ params }: Props) {
  const { sectionId } = await params;
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      _count: {
        select: {
          students: true,
          meetings: true,
        },
      },
      meetings: {
        where: { session: { isNot: null } },
        select: { id: true },
      },
    },
  });
  if (!section) notFound();

  const template = path.basename(templateFileForSection(section.code));

  return (
    <main className="flex max-w-xl flex-col gap-6">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/teacher" className="hover:underline">
            Sections
          </Link>
          <span className="mx-1">/</span>
          <Link
            href={`/teacher/sections/${section.id}`}
            className="hover:underline"
          >
            {section.code}
          </Link>
          <span className="mx-1">/</span>
          Export
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Export gradebook
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Downloads your complete attendance workbook (
          <code className="text-zinc-800">{template}</code>
          ): sheets <code>midterms</code>, <code>finals</code>,{" "}
          <code>all</code>, <code>summary</code>. Only opened sessions are
          written as codes <code>0–4</code>; unopened dates stay blank.
        </p>
      </div>

      <ul className="rounded border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
        <li>{section._count.students} students in roster</li>
        <li>{section.meetings.length} meetings with sessions</li>
      </ul>

      <ExportDownloadButton sectionId={section.id} sectionCode={section.code} />
    </main>
  );
}
