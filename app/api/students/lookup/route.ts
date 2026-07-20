import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { lookupStudent } from "@/lib/session/checkin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sectionCode = url.searchParams.get("sectionCode") ?? "";
  const studentId = url.searchParams.get("studentId") ?? "";

  if (!sectionCode || !studentId) {
    return jsonError("BAD_REQUEST", "sectionCode and studentId are required", 400);
  }

  const student = await lookupStudent(prisma, sectionCode, studentId);
  if (!student) {
    return jsonError("NOT_FOUND", "Student not found in section", 404);
  }

  return NextResponse.json({
    studentId: student.studentId,
    name: student.name,
    sectionCode: student.section.code,
    subjectName: student.section.subjectName,
  });
}
