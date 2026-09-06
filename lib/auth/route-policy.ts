export type AppRole = "admin" | "coach"

const PUBLIC_PAGE_PATHS = new Set(["/login"])

const ADMIN_ROUTE_PREFIXES = [
  "/students",
  "/payments",
  "/presencas",
  "/birthdays",
  "/carometro",
  "/chamada",
] as const

const COACH_ROUTE_PREFIXES = [
  "/trainer/dashboard",
  "/trainer/carometro",
  "/trainer/chamada",
  "/trainer/relatorio",
  "/trainer/birthdays",
] as const

export function normalizePathname(pathname: string) {
  if (!pathname) return "/"
  const withoutQuery = pathname.split("?")[0].split("#")[0]
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) return withoutQuery.slice(0, -1)
  return withoutQuery || "/"
}

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function isPublicPage(pathname: string) {
  return PUBLIC_PAGE_PATHS.has(normalizePathname(pathname))
}

export function isApiPath(pathname: string) {
  const path = normalizePathname(pathname)
  return path === "/api" || path.startsWith("/api/")
}

export function homeForRole(role: AppRole) {
  return role === "coach" ? "/trainer/dashboard" : "/"
}

/**
 * Central route policy. Only pages that belong to the authenticated profile
 * are allowed. Unknown/legacy paths are redirected to the profile home.
 */
export function canRoleAccessPath(role: AppRole, pathname: string) {
  const path = normalizePathname(pathname)

  if (isPublicPage(path)) return false
  if (isApiPath(path)) return true

  if (role === "coach") {
    return COACH_ROUTE_PREFIXES.some((prefix) => matchesPrefix(path, prefix))
  }

  if (path === "/") return true
  return ADMIN_ROUTE_PREFIXES.some((prefix) => matchesPrefix(path, prefix))
}
