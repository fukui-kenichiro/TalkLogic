export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/activities/:path*",
    "/reports/:path*",
    "/goals/:path*",
    "/profile/:path*",
  ],
}
