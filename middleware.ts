import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl
  const { userId } = await auth()

  if (pathname.startsWith("/sign-in") && userId) {
    const redirectParam = request.nextUrl.searchParams.get("redirect_url")
    let target = "/citizen"
    if (redirectParam) {
      try {
        const url = new URL(redirectParam, request.url)
        if (url.origin === request.nextUrl.origin) {
          target = `${url.pathname}${url.search}${url.hash}`
        }
      } catch {
        // ignore invalid redirect param
      }
    }
    return NextResponse.redirect(new URL(target, request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"]
}
