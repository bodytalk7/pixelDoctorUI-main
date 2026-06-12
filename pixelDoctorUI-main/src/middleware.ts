import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // 관리자 전용 경로 접근 제한
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/patients", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // 토큰이 있으면 인증된 것으로 간주
      authorized: ({ token }) => !!token,
    },
  }
);

// 인증이 필요한 경로 (환자 링크 경로는 제외)
export const config = {
  matcher: [
    "/patients/:path*",
    "/admin/:path*",
    "/search/:path*",
    "/api/patients/:path*",
    "/api/visits/:path*",
    "/api/chat/:path*",
    "/api/analysis/:path*",
  ],
};
