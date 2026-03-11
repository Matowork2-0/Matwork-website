import type { Context } from "@netlify/functions";

const SESSION_COOKIE_NAME = "mw_session";

function clearSessionCookie(): string {
  const isProd = process.env.NODE_ENV === "production" || process.env.CONTEXT === "production";
  return [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    ...(isProd ? ["Secure"] : []),
  ].join("; ");
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", clearSessionCookie());

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers,
  });
};
