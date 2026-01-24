import { createBrowserClient } from "@supabase/ssr"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserClient() {
  if (!browserClient) {
    // Use as variáveis do Next.js (NEXT_PUBLIC_)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("[v0] Supabase config check:", {
      hasUrl: !!url,
      hasKey: !!key,
      urlPrefix: url?.substring(0, 20),
    })

    // Verifique se ambas as variáveis estão definidas
    if (!url || !key) {
      const errorMsg = `Missing Supabase configuration in production. URL: ${!!url ? 'OK' : 'MISSING'}, Key: ${!!key ? 'OK' : 'MISSING'}. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.`
      console.error("[v0]", errorMsg)
      throw new Error(errorMsg)
    }

    // Crie o cliente do Supabase
    browserClient = createBrowserClient(url, key)
  }
  
  return browserClient
}
