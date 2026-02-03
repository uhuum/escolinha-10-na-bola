import { createBrowserClient } from "@supabase/ssr"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserClient() {
  if (!browserClient) {
    console.log("[v0] Initializing Supabase client...")
    
    // Try multiple sources for environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_SUPABASE_URL)
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                (typeof window !== 'undefined' && (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY)

    console.log("[v0] Supabase URL available:", !!url)
    console.log("[v0] Supabase Key available:", !!key)

    // Verifique se ambas as variáveis estão definidas
    if (!url || !key) {
      const errorMsg = "Missing Supabase configuration. Please set up Supabase integration in the Connect section of the sidebar."
      console.error("[v0]", errorMsg)
      throw new Error(errorMsg)
    }

    // Crie o cliente do Supabase
    browserClient = createBrowserClient(url, key)
    console.log("[v0] Supabase client initialized successfully")
  }
  
  return browserClient
}
