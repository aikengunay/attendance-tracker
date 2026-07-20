import { checkInAction, lookupStudentAction } from "@/app/join/actions";
import { JoinQrScanner } from "@/app/join/join-qr-scanner";

type Props = {
  searchParams: Promise<{
    step?: string;
    error?: string;
    sectionCode?: string;
    studentId?: string;
    name?: string;
    token?: string;
  }>;
};

export default async function JoinPage({ searchParams }: Props) {
  const sp = await searchParams;
  const step = sp.step === "confirm" ? "confirm" : "identify";
  const error = sp.error ?? "";
  const sectionCode = (sp.sectionCode ?? "").toUpperCase();
  const studentId = sp.studentId ?? "";
  const name = sp.name ?? "";
  const token = sp.token ?? "";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 bg-white px-5 py-10 text-zinc-900 sm:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Student
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Check in
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Scan the projector QR in this page or with your phone Camera, then
          confirm your student ID. You can also type section + ID and the
          fallback code under the QR.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {step === "identify" ? (
        <div className="flex flex-col gap-4">
          <JoinQrScanner sectionCode={sectionCode} studentId={studentId} />
          <form action={lookupStudentAction} className="flex flex-col gap-4">
            <input type="hidden" name="token" value={token} />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-zinc-600">Section</span>
              <input
                name="sectionCode"
                defaultValue={sectionCode}
                placeholder="INF191"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                required
                className="min-h-12 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-zinc-600">Student ID</span>
              <input
                name="studentId"
                defaultValue={studentId}
                placeholder="2019-100265"
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                required
                className="min-h-12 rounded-lg border border-zinc-300 bg-white px-3 font-mono text-base text-zinc-900"
              />
            </label>
            {token ? (
              <p className="text-sm text-zinc-500">
                QR token ready from scan. Enter your ID and tap Find me.
              </p>
            ) : null}
            <button
              type="submit"
              className="min-h-12 rounded-lg bg-zinc-900 px-4 text-base font-medium text-white"
            >
              Find me
            </button>
          </form>
        </div>
      ) : (
        <form action={checkInAction} className="flex flex-col gap-4">
          <input type="hidden" name="sectionCode" value={sectionCode} />
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="name" value={name} />
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-500">Is this you?</p>
            <p className="mt-1 text-xl font-medium leading-snug">{name}</p>
            <p className="mt-1 font-mono text-sm text-zinc-600">{studentId}</p>
            <p className="text-sm text-zinc-600">{sectionCode}</p>
          </div>
          {token ? (
            <>
              <input type="hidden" name="token" value={token} />
              <p className="text-sm text-zinc-500">QR token ready from scan.</p>
            </>
          ) : (
            <>
              <JoinQrScanner
                sectionCode={sectionCode}
                studentId={studentId}
                name={name}
                resumeConfirm
              />
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-zinc-600">Projector fallback code</span>
                <input
                  name="token"
                  required
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-h-12 rounded-lg border border-zinc-300 bg-white px-3 font-mono text-base text-zinc-900"
                />
              </label>
            </>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={`/join?sectionCode=${encodeURIComponent(sectionCode)}&studentId=${encodeURIComponent(studentId)}&token=${encodeURIComponent(token)}`}
              className="flex min-h-12 items-center justify-center rounded-lg border border-zinc-300 px-4 text-base"
            >
              Not me
            </a>
            <button
              type="submit"
              className="min-h-12 flex-1 rounded-lg bg-zinc-900 px-4 text-base font-medium text-white"
            >
              This is me — check in
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
