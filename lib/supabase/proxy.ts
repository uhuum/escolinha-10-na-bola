import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import {
  canRoleAccessPath,
  homeForRole,
  isApiPath,
  isPublicPage,
  type AppRole,
} from "@/lib/auth/route-policy"

function withPrivateCache(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate")
  response.headers.set("Pragma", "no-cache")
  return response
}

function redirect(request: NextRequest, pathname: string, sourceResponse: NextResponse) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ""
  const response = NextResponse.redirect(url)

  // Preserve any refreshed Supabase cookies produced during this request.
  sourceResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie)
  })

  return withPrivateCache(response)
}

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(cacheHeaders || {}).forEach(([key, value]) => response.headers.set(key, String(value)))
        },
      },
    },
  )

  const pathname = request.nextUrl.pathname
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims as any
  const role = claims?.app_metadata?.role as AppRole | undefined
  const hasValidRole = role === "admin" || role === "coach"

  // API endpoints perform their own authorization and must not be redirected
  // to HTML pages. The session refresh above still runs for them.
  if (isApiPath(pathname)) return withPrivateCache(response)

  if (!hasValidRole) {
    if (!isPublicPage(pathname)) return redirect(request, "/login", response)
    return withPrivateCache(response)
  }

  // Authenticated users never stay on the login page.
  if (isPublicPage(pathname)) return redirect(request, homeForRole(role), response)

  // Enforce role boundaries before the page is rendered. This also protects
  // direct URLs, bookmarks, refresh, browser Back/Forward and restored tabs.
  if (!canRoleAccessPath(role, pathname)) {
    return redirect(request, homeForRole(role), response)
  }

  return withPrivateCache(response)
}
