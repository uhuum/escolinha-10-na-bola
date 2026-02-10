import { createBrowserClient } from "@supabase/ssr"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserClient() {
  if (!browserClient) {
    // Use as variáveis do Next.js (NEXT_PUBLIC_)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Verifique se ambas as variáveis estão definidas
    if (!url || !key) {
      throw new Error(
        "Missing Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined.",
      )
    }

    // Crie o cliente do Supabase
    browserClient = createBrowserClient(url, key)
  }
  
  return browserClient
}
