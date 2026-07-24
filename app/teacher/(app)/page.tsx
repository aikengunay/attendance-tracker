import { TeacherPageHeader } from "@/components/teacher/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { prisma } from "@/lib/db";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeacherHomePage() {
  const sections = await prisma.section.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: { select: { students: true, templates: true } },
    },
  });

  return (
    <>
      <TeacherPageHeader
        title="Sections"
        description="Import a Registrar classlist, then open a section to run attendance."
        actions={
          <Button render={<Link href="/teacher/import" />}>
            Import classlist
          </Button>
        }
      />

      {sections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No sections yet.{" "}
            <Link
              href="/teacher/import"
              className="underline underline-offset-4"
            >
              Import INF231 or INF232
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle>Your sections</CardTitle>
            <CardDescription>
              {sections.length} section{sections.length === 1 ? "" : "s"} ready
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ItemGroup className="gap-0">
              {sections.map((s) => (
                <Item
                  key={s.id}
                  variant="default"
                  size="sm"
                  className="rounded-none border-0 border-b last:border-b-0 px-4 py-3 hover:bg-muted/50"
                  render={<Link href={`/teacher/sections/${s.id}`} />}
                >
                  <ItemContent>
                    <ItemTitle>{s.code}</ItemTitle>
                    <ItemDescription>
                      {s.subjectName} · {s.termLabel}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="gap-2 text-sm text-muted-foreground">
                    <span>
                      {s._count.students} students · {s._count.templates}{" "}
                      schedules
                    </span>
                    <ChevronRightIcon className="size-4" />
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      )}
    </>
  );
}
