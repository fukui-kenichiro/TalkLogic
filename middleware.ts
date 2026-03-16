import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const protectedPaths = [
  "/dashboard",
  "/activities",
  "/reports",
  "/goals",
  "/profile",
  "/onboarding",
]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isProtectedRoute = protectedPaths.some((p) =>
    nextUrl.pathname.startsWith(p)
  )
  const isOnboardingRoute = nextUrl.pathname.startsWith("/onboarding")

  // 未認証ユーザーが保護ルートにアクセス → /login へ
  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // ログイン済みでオンボーディング未完了 → /onboarding へ
  if (
    isLoggedIn &&
    !req.auth?.user?.onboardingCompleted &&
    !isOnboardingRoute
  ) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl))
  }

  // ログイン済みでオンボーディング完了済み、/onboarding へのアクセス → /dashboard へ
  if (isLoggedIn && req.auth?.user?.onboardingCompleted && isOnboardingRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/activities/:path*",
    "/reports/:path*",
    "/goals/:path*",
    "/profile/:path*",
    "/onboarding",
    "/onboarding/:path*",
  ],
}
