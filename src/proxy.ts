import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  // const sessionCookie = getSessionCookie(request);
  // if (!sessionCookie) {
  //   return NextResponse.redirect(new URL("/sign-in", request.url));
  // }
  // return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude API routes, static files, image optimizations, and .png files
    "/((?!api|_next/static|_next/image|.*\\.png$).*)",
  ],
};
