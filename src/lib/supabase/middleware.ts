import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Pages that need a signed-in parent. */
const PROTECTED = ["/app"];
/** Pages a signed-in parent should skip. */
const AUTH_ONLY = ["/login", "/signup"];

/**
 * Runs on every request: refreshes the Supabase session cookie and
 * redirects between the public site, the auth screens and the app.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Do not put code between createServerClient and getUser: it keeps the session fresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const redirectTo = (to: string, params?: Record<string, string>) => {
    const dest = request.nextUrl.clone();
    dest.pathname = to;
    dest.search = "";
    Object.entries(params ?? {}).forEach(([k, v]) => dest.searchParams.set(k, v));
    const res = NextResponse.redirect(dest);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    return redirectTo("/login", { next: path });
  }
  if (user && AUTH_ONLY.includes(path)) {
    return redirectTo("/app");
  }
  return response;
}
