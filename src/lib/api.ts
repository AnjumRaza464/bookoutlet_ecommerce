import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { getCurrentUser, isStaff, type SessionUser } from "./auth";
import { fieldErrors, firstError } from "./validation";
import { rateLimit } from "./rate-limit";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

/** Rejects cross-site state-changing requests (defence in depth on top of SameSite cookies). */
export function assertSameOrigin(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  if (!origin) throw new ApiError(403, "Missing origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (new URL(origin).host !== host) throw new ApiError(403, "Cross-origin request blocked");
}

export async function parseJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
  const result = schema.safeParse(body);
  if (!result.success) throw new ApiError(422, firstError(result.error), fieldErrors(result.error));
  return result.data;
}

export async function requireApiUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Please sign in to continue");
  return user;
}

export async function requireApiStaff(): Promise<SessionUser> {
  const user = await requireApiUser();
  if (!isStaff(user)) throw new ApiError(403, "You do not have permission to do that");
  return user;
}

export async function requireApiAdmin(): Promise<SessionUser> {
  const user = await requireApiUser();
  if (user.role !== "ADMIN") throw new ApiError(403, "Only administrators can do that");
  return user;
}

export function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export function limit(req: NextRequest, name: string, max: number, windowMs = 60_000) {
  if (!rateLimit(`${name}:${clientIp(req)}`, max, windowMs)) {
    throw new ApiError(429, "Too many requests. Please wait a moment and try again.");
  }
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/** Wraps a route handler with origin checks and uniform error handling. */
export function handler<C = unknown>(fn: Handler<C>, opts: { skipOriginCheck?: boolean } = {}): Handler<C> {
  return async (req, ctx) => {
    try {
      if (!opts.skipOriginCheck) assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return json({ error: err.message, fields: err.fields }, err.status);
      if (err instanceof ZodError) return json({ error: firstError(err), fields: fieldErrors(err) }, 422);
      if (isUniqueViolation(err)) return json({ error: "A record with that value already exists" }, 409);
      console.error("[api]", req.method, req.nextUrl.pathname, err);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
}

function isUniqueViolation(err: unknown) {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
}
