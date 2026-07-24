import { PasskeySecurityPanel } from "@/components/PasskeySecurityPanel";
import { TeacherPageHeader } from "@/components/teacher/page-header";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TeacherSettingsPage() {
  const passkeyCount = await prisma.teacherPasskey.count();

  return (
    <>
      <TeacherPageHeader
        title="Settings"
        description="Manage sign-in and device security for this teacher account."
      />
      <PasskeySecurityPanel autoPrompt={passkeyCount === 0} />
    </>
  );
}
