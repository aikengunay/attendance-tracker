import { teacherSessionToken, tokensEqual } from "@/lib/teacher-token";
import { NextResponse, type NextRequest } from "next/server";

const TEACHER_COOKIE = "teacher_session";

async function isAuthed(req: NextRequest): Promise<boolean> {
  const value = req.cookies.get(TEACHER_COOKIE)?.value;
  if (!value) return false;
  const expected = await teacherSessionToken();
  return tokensEqual(value, expected);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/api/teacher/login") {
    return NextResponse.next();
  }

  const needsTeacher =
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/api/teacher") ||
    pathname.startsWith("/api/import") ||
    pathname.startsWith("/api/sections") ||
    pathname.startsWith("/api/sessions");

  if (!needsTeacher) {
    return NextResponse.next();
  }

  if (pathname === "/teacher/login") {
    if (await isAuthed(req)) {
      return NextResponse.redirect(new URL("/teacher", req.url));
    }
    return NextResponse.next();
  }

  if (!(await isAuthed(req))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Teacher PIN required" },
        { status: 401 },
      );
    }
    const login = new URL("/teacher/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/teacher/:path*",
    "/api/teacher/:path*",
    "/api/import/:path*",
    "/api/sections/:path*",
    "/api/sessions/:path*",
  ],
};
