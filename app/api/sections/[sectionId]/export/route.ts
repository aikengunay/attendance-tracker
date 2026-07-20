import { jsonError, unauthorized } from "@/lib/api";
import { isTeacherAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exportSectionGradebook } from "@/lib/export/gradebook";

type Params = { params: Promise<{ sectionId: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await isTeacherAuthenticated())) return unauthorized();
  const { sectionId } = await params;

  try {
    const result = await exportSectionGradebook(prisma, sectionId);
    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "X-Export-Template": result.templateUsed,
        "X-Export-Written-Marks": String(result.writtenMarks),
        "X-Export-Unmatched-Students": String(result.unmatchedStudents.length),
        "X-Export-Unmatched-Dates": String(result.unmatchedDates.length),
      },
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    const message = err instanceof Error ? err.message : "Export failed";
    if (code === "NOT_FOUND") return jsonError(code, message, 404);
    if (code === "TEMPLATE_MISSING" || code === "TEMPLATE_INVALID") {
      return jsonError(code, message, 500);
    }
    return jsonError("EXPORT_FAILED", message, 400);
  }
}
