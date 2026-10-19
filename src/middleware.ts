import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Safety net: if Supabase sends an email link to the bare site address (its "Site URL")
  // instead of /auth/callback, finish the sign-in there instead of showing the website.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && searchParams.get("code")) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/auth/callback";
    if (!dest.searchParams.get("next")) dest.searchParams.set("next", "/app");
    return NextResponse.redirect(dest);
  }
  return updateSession(request);
}

export const config = {
  // Skip static files and images; run on pages and API routes.
  matcher: ["/((?!_next/static|_next/image|images/|icons/|sw.js|offline.html|manifest.webmanifest|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
